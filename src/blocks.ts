import { escapeHtml } from './render.js';
import type { CardSkin } from './document.js';

/**
 * Baukasten-Layout eines Notiztyps: Blöcke statt Vorlagen-HTML.
 *
 * Der Notiztyp-Baukasten im Backend legt Blöcke an, dieses Modul übersetzt sie
 * in `qfmt`/`afmt`/`css`, die Anki lesen kann. Das Layout selbst wird daneben
 * gespeichert, damit es sich wieder öffnen lässt — aus dem HTML zurück in
 * Blöcke gibt es keinen Weg (siehe importierte Notiztypen: 29 KB HTML mit
 * 14 Skripten).
 *
 * Warum hier und nicht im Backend: Die Blöcke erzeugen Klassen (`nb-*`), die
 * der Skin der App kennen muss, sonst sähe die Karte auf dem Handy anders aus
 * als im Baukasten. Erzeuger und Skin gehören in dieselbe Datei, damit sie
 * nicht auseinanderlaufen.
 */

export type BlockSize = 'small' | 'normal' | 'large';
export type BlockAlign = 'left' | 'center';
export type BlockTone = 'normal' | 'muted' | 'accent';

export type LayoutBlock =
    /** Feldinhalt, wie er ist. */
    | { id: string; type: 'field'; field: string; size?: BlockSize; align?: BlockAlign; tone?: BlockTone; hideIfEmpty?: boolean }
    /** Lückentext — `{{cloze:Feld}}`. */
    | { id: string; type: 'cloze'; field: string; size?: BlockSize; align?: BlockAlign }
    /** Bild aus einem Feld, in einem Rahmen mit maximaler Breite. */
    | { id: string; type: 'image'; field: string }
    /** Überschrift — entweder aus einem Feld oder fester Text. */
    | { id: string; type: 'heading'; field?: string; text?: string }
    /** Hinweisbox, nur wenn das Feld gefüllt ist; mit optionaler Beschriftung. */
    | { id: string; type: 'hint'; field: string; label?: string }
    /** Kurze Trennlinie. */
    | { id: string; type: 'divider' }
    /** Fester Text, auf jeder Karte gleich. */
    | { id: string; type: 'text'; text: string; align?: BlockAlign; tone?: BlockTone }
    /** Eingabefeld zum Abtippen — `{{type:Feld}}`. */
    | { id: string; type: 'type'; field: string }
    /** Die Vorderseite noch einmal (nur Rückseite) — `{{FrontSide}}`. */
    | { id: string; type: 'frontside' };

export type BlockType = LayoutBlock['type'];

export type NoteLayout = {
    /** Formatversion, damit sich gespeicherte Layouts später wandeln lassen. */
    v: 1;
    front: LayoutBlock[];
    back: LayoutBlock[];
};

export type CompiledLayout = { qfmt: string; afmt: string; css: string };

/** Blockarten, die ein Feld brauchen. */
export const FIELD_BLOCKS: ReadonlySet<BlockType> = new Set(['field', 'cloze', 'image', 'hint', 'type']);

let counter = 0;

/** Kennung für einen neuen Block — nur innerhalb eines Layouts eindeutig. */
export function newBlockId(): string {
    counter += 1;

    return `b${Date.now().toString(36)}${counter.toString(36)}`;
}

export function emptyLayout(): NoteLayout {
    return { v: 1, front: [], back: [] };
}

/**
 * Brauchbarer Anfang für einen neuen Notiztyp: erstes Feld vorn, hinten die
 * Vorderseite, eine Linie, das zweite Feld, alle weiteren als Hinweisboxen.
 * Das ist die Karte, die die meisten wollen — der Baukasten ist für den Rest.
 */
export function defaultLayout(fieldNames: string[]): NoteLayout {
    const [first, second, ...rest] = fieldNames;

    if (!first) {
        return emptyLayout();
    }

    const back: LayoutBlock[] = [{ id: newBlockId(), type: 'frontside' }, { id: newBlockId(), type: 'divider' }];

    if (second) {
        back.push({ id: newBlockId(), type: 'field', field: second, size: 'normal', tone: 'accent' });
    }

    for (const name of rest) {
        back.push({ id: newBlockId(), type: 'hint', field: name, label: name });
    }

    return {
        v: 1,
        front: [{ id: newBlockId(), type: 'field', field: first, size: 'large' }],
        back,
    };
}

/**
 * Lückentext-Variante: `{{cloze:…}}` auf beiden Seiten, Hinweise nur hinten.
 * Anki verlangt bei Cloze-Notiztypen genau das — ohne `cloze:` vorn entstehen
 * keine Karten.
 */
export function defaultClozeLayout(fieldNames: string[]): NoteLayout {
    const [first, ...rest] = fieldNames;

    if (!first) {
        return emptyLayout();
    }

    return {
        v: 1,
        front: [{ id: newBlockId(), type: 'cloze', field: first }],
        back: [
            { id: newBlockId(), type: 'cloze', field: first },
            ...rest.map((name): LayoutBlock => ({ id: newBlockId(), type: 'hint', field: name, label: name })),
        ],
    };
}

/** Anki verbietet in Feldnamen `{`, `}` und `:` — mehr Schutz braucht es nicht. */
function ref(field: string): string {
    return field.replace(/[{}:]/g, '').trim();
}

/** Fester Text: escaped, Zeilenumbrüche bleiben Umbrüche. */
function text(value: string): string {
    return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

function classes(...parts: (string | false | undefined)[]): string {
    return parts.filter(Boolean).join(' ');
}

function wrapIf(cond: boolean, field: string, inner: string): string {
    return cond ? `{{#${field}}}${inner}{{/${field}}}` : inner;
}

/** Einen Block in Vorlagen-HTML übersetzen. */
export function compileBlock(b: LayoutBlock): string {
    switch (b.type) {
        case 'field': {
            const f = ref(b.field);
            const cls = classes(
                'nb nb-field',
                b.size && b.size !== 'normal' && `nb-size-${b.size}`,
                b.align === 'left' && 'nb-align-left',
                b.tone && b.tone !== 'normal' && `nb-tone-${b.tone}`,
            );

            return wrapIf(b.hideIfEmpty !== false, f, `<div class="${cls}">{{${f}}}</div>`);
        }
        case 'cloze': {
            const f = ref(b.field);
            const cls = classes(
                'nb nb-cloze',
                b.size && b.size !== 'normal' && `nb-size-${b.size}`,
                b.align === 'left' && 'nb-align-left',
            );

            return `<div class="${cls}">{{cloze:${f}}}</div>`;
        }
        case 'image': {
            const f = ref(b.field);

            return `{{#${f}}}<div class="nb nb-image">{{${f}}}</div>{{/${f}}}`;
        }
        case 'heading': {
            if (b.field) {
                const f = ref(b.field);

                return `{{#${f}}}<div class="nb nb-heading">{{${f}}}</div>{{/${f}}}`;
            }

            return `<div class="nb nb-heading">${text(b.text ?? '')}</div>`;
        }
        case 'hint': {
            const f = ref(b.field);
            const label = b.label?.trim() ? `<span class="nb-label">${text(b.label)}</span>` : '';

            return `{{#${f}}}<div class="nb nb-hint">${label}{{${f}}}</div>{{/${f}}}`;
        }
        case 'divider':
            return '<hr class="nb nb-divider">';
        case 'text': {
            const cls = classes(
                'nb nb-text',
                b.align === 'left' && 'nb-align-left',
                b.tone && b.tone !== 'normal' && `nb-tone-${b.tone}`,
            );

            return `<div class="${cls}">${text(b.text)}</div>`;
        }
        case 'type':
            return `<div class="nb nb-type">{{type:${ref(b.field)}}}</div>`;
        case 'frontside':
            return '{{FrontSide}}';
    }
}

/**
 * Regeln für die `nb-*`-Klassen, mit den Farben eines Skins. Die App bindet
 * sie über `cardSkinCss()` ein; für Anki Desktop erzeugt `compileLayout()`
 * dieselben Regeln mit festen Farben (Anki hat keinen Skin).
 */
export function layoutCss(s: Pick<CardSkin, 'secondary' | 'muted' | 'accent' | 'heading' | 'border'>): string {
    return `
    .nb{margin:8px 0;}
    .nb-size-small{font-size:.85em;}
    .nb-size-large{font-size:1.3em;font-weight:600;}
    .nb-align-left{text-align:left;}
    .nb-tone-muted{color:${s.secondary};}
    .nb-tone-accent{color:${s.accent};font-weight:600;}
    .nb-heading{color:${s.heading};font-weight:700;font-size:1.15em;margin:14px 0 6px;}
    .nb-hint{display:block;text-align:left;border-left:3px solid ${s.accent};padding:6px 10px;margin:12px 0;color:${s.secondary};font-size:.9em;border-radius:0 8px 8px 0;background:rgba(127,127,127,.08);}
    .nb-hint .nb-label{display:block;font-size:.75em;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:${s.muted};margin-bottom:2px;}
    .nb-image img{display:block;margin:8px auto;}
    .nb-divider{border:none;border-top:1px solid ${s.border};width:56px;margin:15px auto;}
    .nb-type input{font:inherit;width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid ${s.border};border-radius:8px;background:transparent;color:inherit;}
  `;
}

/** Anki-Desktop-Farben: kein Skin, also feste Werte, die auf Weiß lesbar sind. */
const ANKI_COLORS = { secondary: '#6b6b75', muted: '#9a9aa6', accent: '#6b5be6', heading: '#17171c', border: '#d9d9de' };

/** Vorlagen und CSS aus einem Layout — das, was in `catalog_note_types` landet. */
export function compileLayout(layout: NoteLayout): CompiledLayout {
    const join = (blocks: LayoutBlock[]) => blocks.map(compileBlock).join('\n');

    return {
        qfmt: join(layout.front),
        afmt: join(layout.back),
        css: `.card{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:20px;text-align:center;color:${ANKI_COLORS.heading};background-color:#fff;line-height:1.5;}
img{max-width:100%;height:auto;}
.cloze{color:${ANKI_COLORS.accent};font-weight:700;}
${layoutCss(ANKI_COLORS).trim()}`,
    };
}

/** Felder, die das Layout benutzt — für die Prüfung gegen die Feldliste. */
export function usedFields(layout: NoteLayout): string[] {
    const out = new Set<string>();

    for (const b of [...layout.front, ...layout.back]) {
        if ('field' in b && b.field) {
            out.add(b.field);
        }
    }

    return [...out];
}
