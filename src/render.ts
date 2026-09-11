/**
 * Karten-Rendering — geteilt von Import (apkg), Karten-Editor und dem
 * <CardHtml>-WebView-Renderer. Quelle der Wahrheit sind die benannten Felder
 * eines Anki-Notiztyps; daraus werden Vorder-/Rückseiten-HTML (verlustfrei,
 * inkl. Inline-Formatierung) und ein flacher Text-Preview (Listen/Suche)
 * gerendert.
 */
import { BASIC_NOTE_TYPE, CardNoteType, CLOZE_NOTE_TYPE } from './types.js';

/** Rohtext → HTML-sicher (für selbst erstellte „Einfach"-Karten). */
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** HTML → flacher Text (Zeilenstruktur bleibt erhalten). Für Listen/Suche/Dedup. */
/**
 * Liegt `pos` innerhalb eines HTML-Tags?
 *
 * Für Werkzeuge, die in rohes Karten-HTML schreiben. Steht das letzte `<` vor
 * `pos` hinter dem letzten `>`, ist eine Marke offen — eine Lücke an dieser
 * Stelle würde das Tag zerschneiden (`</{{c2::u}}>` statt `</u>`).
 */
export function isInsideTag(html: string, pos: number): boolean {
  const auf = html.lastIndexOf('<', pos - 1);
  if (auf === -1) return false;
  return html.lastIndexOf('>', pos - 1) < auf;
}

export function stripHtml(s: string): string {
  return String(s)
    // <script>/<style> samt Inhalt zuerst — die Tag-Entfernung weiter unten
    // nimmt nur die Klammern weg und ließe den Quelltext dazwischen als Text
    // stehen. Bei Vorlagen wie „AnkiNick/Ankizin Cloze" sind das 25 KB
    // JavaScript in einem 29-KB-Template, die sonst als Vorschau in Listen,
    // Suche und Duplikatserkennung landen.
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/\[sound:[^\]]+\]/gi, '')
    // Zeilenumbrüche der Struktur erhalten (statt alles in eine Zeile zu matschen)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr[^>]*>/gi, '\n')
    .replace(/<\/(div|p|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type RenderOpts = { clozeOrd?: number; isBack?: boolean };

/** Cloze-Feld rendern: aktive Lücke (cN == ord+1) wird vorne zu [Hinweis]/[…],
 *  hinten zur hervorgehobenen Antwort; inaktive Lücken zeigen nur ihren Text. */
function renderClozeField(text: string, clozeOrd: number, isBack: boolean): string {
  const active = clozeOrd + 1;
  return String(text).replace(/\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g, (_m, n: string, answer: string, hint?: string) => {
    if (parseInt(n, 10) !== active) return answer;
    if (isBack) return `<span class="cloze">${answer}</span>`;
    return `<span class="cloze">[${hint && hint.trim() ? hint : '…'}]</span>`;
  });
}

/** Rendert eine Anki-Kartenvorlage (Mustache-artig) mit den Feldwerten.
 *  {{Field}}, Filter ({{cloze:F}} etc.), Bedingungen ({{#F}}/{{^F}}), {{FrontSide}}. */
/**
 * Anki-Abschnitte auflösen: `{{#Feld}}…{{/Feld}}` (zeigen wenn gefüllt) und
 * `{{^Feld}}…{{/Feld}}` (zeigen wenn leer).
 *
 * Bewusst kein regulärer Ausdruck. Echte Vorlagen verschachteln Abschnitte und
 * verwenden denselben Namen mehrfach — im Notiztyp „AnkiNick/Ankizin Cloze"
 * etwa `{{#Quelle}}` zweimal, `{{#Tags}}` dreimal. Ein nicht-gieriges Muster
 * paart die öffnende Marke mit der ERSTEN schließenden statt mit der
 * zugehörigen; übrig blieb ein nacktes `{{/Quelle}}` mitten in der Karte.
 * Verschachtelte Klammern sind mit regulären Ausdrücken nicht zu greifen.
 *
 * Unpaarige schließende Marken werden verworfen, nicht ausgegeben — eine
 * kaputte Vorlage soll nicht als Text auf der Karte landen.
 */
function resolveSections(tmpl: string, fields: Record<string, string>): string {
  const gefuellt = (name: string): boolean => !!fields[name]?.trim();

  type Marke = { at: number; len: number; art: '#' | '^' | '/'; name: string };
  const marken: Marke[] = [];
  for (const m of tmpl.matchAll(/\{\{([#^/])([^}]+)\}\}/g)) {
    marken.push({ at: m.index, len: m[0].length, art: m[1] as Marke['art'], name: m[2].trim() });
  }
  if (marken.length === 0) return tmpl;

  let pos = 0;
  let i = 0;

  const bauen = (bisName: string | null): string => {
    let out = '';
    while (i < marken.length) {
      const t = marken[i];
      out += tmpl.slice(pos, t.at);
      pos = t.at + t.len;
      i++;

      if (t.art === '/') {
        if (t.name === bisName) return out;
        continue;
      }

      const inner = bauen(t.name);
      const zeigen = t.art === '#' ? gefuellt(t.name) : !gefuellt(t.name);
      if (zeigen) out += inner;
    }
    // Rest der Vorlage hängt nur der äußerste Aufruf an.
    return out + (bisName === null ? tmpl.slice(pos) : '');
  };

  return bauen(null);
}

export function renderTemplate(tmpl: string, fields: Record<string, string>, frontSide: string, opts: RenderOpts = {}): string {
  let out = tmpl.replace(/\{\{FrontSide\}\}/g, frontSide);
  out = resolveSections(out, fields);
  out = out.replace(/\{\{([^#/^][^}]*)\}\}/g, (_m, expr: string) => {
    const raw = expr.trim();
    if (raw.startsWith('cloze:')) {
      const name = raw.slice(6).trim();
      return renderClozeField(fields[name] ?? '', opts.clozeOrd ?? 0, !!opts.isBack);
    }
    // {{type:Feld}} → aus dem HTML entfernen; Eingabefeld + Diff macht der Lern-Screen nativ.
    if (raw.startsWith('type:')) return '';
    const name = raw.includes(':') ? (raw.split(':').pop() as string).trim() : raw;
    return fields[name] ?? '';
  });
  return out;
}

/** Ersetzt <img src="dateiname"> durch lokale URIs und entfernt [sound:]-Marker
 *  (Audio läuft nativ im Footer). Rein, nutzt eine vorgebaute Datei→URI-Map. */
export function resolveHtmlMedia(html: string, map: Record<string, string>): string {
  let out = html.replace(/(<img[^>]+src\s*=\s*["']?)([^"'>\s]+)(["']?)/gi, (m, pre: string, src: string, post: string) => {
    const uri = map[decodeURIComponent(src)] ?? map[src];
    return uri ? `${pre}${uri}${post}` : m;
  });
  out = out.replace(/\[sound:[^\]]+\]/gi, '');
  return out;
}

export type RenderedContent = { frontHtml: string; backHtml: string; front: string; back: string };

/** Rendert Vorder-/Rückseite aus Feldern + Notiztyp (Editor-Speichern, importierte Karten).
 *  Rückseite ohne {{FrontSide}}-Doppelung — der Flip hat die Frage schon gezeigt. */
export function renderFromFields(noteType: CardNoteType, fields: Record<string, string>, mediaMap: Record<string, string>, ord = 0): RenderedContent {
  const frontRaw = renderTemplate(noteType.qfmt, fields, '', { clozeOrd: ord, isBack: false });
  const backRaw = renderTemplate(noteType.afmt, fields, '', { clozeOrd: ord, isBack: true });
  return {
    frontHtml: resolveHtmlMedia(frontRaw, mediaMap),
    backHtml: resolveHtmlMedia(backRaw, mediaMap),
    front: stripHtml(frontRaw) || '—',
    back: stripHtml(backRaw),
  };
}

const textToHtml = (s: string): string => escapeHtml(s).replace(/\n/g, '<br>');

export type ManualContent = RenderedContent & { fields: Record<string, string>; noteType: CardNoteType };

/** Baut den Inhalt einer selbst erstellten „Einfach"-Karte (Rohtext → sicheres HTML). */
export function buildManualContent(front: string, back: string, hint?: string): ManualContent {
  const fields = { Vorderseite: front, Rückseite: back, Notiz: hint ?? '' };
  const backHtml = textToHtml(back) + (hint ? `<div class="hint">${textToHtml(hint)}</div>` : '');
  return {
    fields,
    noteType: BASIC_NOTE_TYPE,
    frontHtml: textToHtml(front),
    backHtml,
    front: front || '—',
    back,
  };
}

/** Ist die Karte ein selbst erstellter „Einfach"-Typ? */
export function isBasicNoteType(noteType?: CardNoteType): boolean {
  return !noteType || noteType.name === BASIC_NOTE_TYPE.name;
}

/** Feldname bei Type-in-Answer-Karten ({{type:Feld}} in der Vorderseiten-Vorlage), sonst undefined. */
export function typeFieldOf(noteType?: CardNoteType): string | undefined {
  const m = noteType?.qfmt.match(/\{\{type:([^}]+)\}\}/);
  return m ? m[1].trim() : undefined;
}

// ─── Image Occlusion (Anki-kompatibel) ───────────────────────────────────────

/** Ist der Notiztyp ein Image-Occlusion-Typ (eingebautes Anki-IO oder IO-Enhanced)? */
export function isImageOcclusion(noteType?: CardNoteType): boolean {
  if (!noteType) return false;
  const fn = noteType.fieldNames.map((f) => f.toLowerCase());
  return /occlusion/i.test(noteType.name) || (fn.includes('occlusion') && fn.some((f) => f.includes('image')));
}

type IoShape = { group: number; type: string; p: Record<string, number>; points?: [number, number][] };

/** Occlusion-Feld parsen: {{cN::image-occlusion:<typ>:key=val:key=val...}} (relative 0..1). */
function parseOcclusions(field: string): IoShape[] {
  const out: IoShape[] = [];
  const re = /\{\{c(\d+)::image-occlusion:([a-z]+):([^}]*)\}\}/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(field))) {
    const group = parseInt(m[1], 10);
    const type = m[2].toLowerCase();
    const p: Record<string, number> = {};
    let points: [number, number][] | undefined;
    for (const kv of m[3].split(':')) {
      const eq = kv.indexOf('=');
      if (eq < 0) continue;
      const k = kv.slice(0, eq).trim();
      const v = kv.slice(eq + 1).trim();
      if (k === 'points') {
        points = v.split(/\s+/).map((pt) => pt.split(',').map(Number) as [number, number]).filter((pt) => pt.length === 2 && pt.every((n) => !isNaN(n)));
      } else {
        const n = parseFloat(v);
        if (!isNaN(n)) p[k] = n;
      }
    }
    out.push({ group, type, p, points });
  }
  return out;
}

const pct = (v: number): string => (Math.round(v * 10000) / 100).toString();

function maskSvg(s: IoShape, fill: string): string {
  const p = s.p;
  if (s.type === 'rect') return `<rect x="${pct(p.left)}" y="${pct(p.top)}" width="${pct(p.width)}" height="${pct(p.height)}" rx="0.6" fill="${fill}"/>`;
  if (s.type === 'ellipse') {
    const cx = p.cx ?? (p.left ?? 0) + (p.width ?? 0) / 2;
    const cy = p.cy ?? (p.top ?? 0) + (p.height ?? 0) / 2;
    const rx = p.rx ?? (p.width ?? 0) / 2;
    const ry = p.ry ?? (p.height ?? 0) / 2;
    return `<ellipse cx="${pct(cx)}" cy="${pct(cy)}" rx="${pct(rx)}" ry="${pct(ry)}" fill="${fill}"/>`;
  }
  if (s.type === 'polygon' && s.points?.length) {
    return `<polygon points="${s.points.map(([x, y]) => `${pct(x)},${pct(y)}`).join(' ')}" fill="${fill}"/>`;
  }
  return '';
}

const IO_MASK = 'rgba(60,60,72,0.97)';
const IO_QUESTION = 'rgba(139,123,255,0.95)';

/** Baut Vorder-/Rückseite einer IO-Karte: Bild + SVG-Masken.
 *  Front: alle Masken (aktive Gruppe hervorgehoben). Back: alle außer aktiver Gruppe (aufgedeckt).
 *  `imageField` = Inhalt des Image-Felds (<img …>). Media-URI wird später aufgelöst. */
export function buildImageOcclusion(occlusion: string, imageField: string, ord: number): { front: string; back: string } {
  const shapes = parseOcclusions(occlusion);
  const active = ord + 1;
  const srcMatch = imageField.match(/<img[^>]+src\s*=\s*["']?([^"'>\s]+)/i);
  const src = srcMatch ? srcMatch[1] : '';
  const img = `<img src="${src}" style="width:100%;display:block;border-radius:14px"/>`;
  const wrap = (inner: string): string =>
    `<div style="position:relative;display:inline-block;width:100%;max-width:100%">${img}<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:100%;height:100%">${inner}</svg></div>`;
  const front = shapes.map((s) => maskSvg(s, s.group === active ? IO_QUESTION : IO_MASK)).join('');
  const back = shapes.filter((s) => s.group !== active).map((s) => maskSvg(s, IO_MASK)).join('');
  return { front: wrap(front), back: wrap(back) };
}

export type ClozeCard = RenderedContent & { fields: Record<string, string>; noteType: CardNoteType; ord: number };

/** Baut aus Lückentext echte Cloze-Karten (Anki-kompatibel).
 *  Nutzer markiert Lücken mit {{ }} → wird fortlaufend zu {{c1::…}}, {{c2::…}} …;
 *  bereits vorhandene {{cN::…}} bleiben. Eine Karte je Cloze-Nummer. */
export function buildClozeCards(rawText: string, extra?: string): ClozeCard[] {
  let n = 0;
  const text = rawText.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (_m, inner: string) => {
    if (/^c\d+::/.test(inner)) return `{{${inner}}}`;
    n += 1;
    return `{{c${n}::${inner}}}`;
  });
  const nums = [...text.matchAll(/\{\{c(\d+)::/g)].map((m) => parseInt(m[1], 10));
  const count = nums.length ? Math.max(...nums) : 1;
  const fields = { Text: text, Extra: extra?.trim() ?? '' };
  const out: ClozeCard[] = [];
  for (let ord = 0; ord < count; ord++) {
    out.push({ fields, noteType: CLOZE_NOTE_TYPE, ord, ...renderFromFields(CLOZE_NOTE_TYPE, fields, {}, ord) });
  }
  return out;
}
