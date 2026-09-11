/**
 * Karten-Rendering — geteilt von Import (apkg), Karten-Editor und dem
 * <CardHtml>-WebView-Renderer. Quelle der Wahrheit sind die benannten Felder
 * eines Anki-Notiztyps; daraus werden Vorder-/Rückseiten-HTML (verlustfrei,
 * inkl. Inline-Formatierung) und ein flacher Text-Preview (Listen/Suche)
 * gerendert.
 */
import { CardNoteType } from './types.js';
/** Rohtext → HTML-sicher (für selbst erstellte „Einfach"-Karten). */
export declare function escapeHtml(s: string): string;
/** HTML → flacher Text (Zeilenstruktur bleibt erhalten). Für Listen/Suche/Dedup. */
/**
 * Liegt `pos` innerhalb eines HTML-Tags?
 *
 * Für Werkzeuge, die in rohes Karten-HTML schreiben. Steht das letzte `<` vor
 * `pos` hinter dem letzten `>`, ist eine Marke offen — eine Lücke an dieser
 * Stelle würde das Tag zerschneiden (`</{{c2::u}}>` statt `</u>`).
 */
export declare function isInsideTag(html: string, pos: number): boolean;
export declare function stripHtml(s: string): string;
export type RenderOpts = {
    clozeOrd?: number;
    isBack?: boolean;
};
export declare function renderTemplate(tmpl: string, fields: Record<string, string>, frontSide: string, opts?: RenderOpts): string;
/** Ersetzt <img src="dateiname"> durch lokale URIs und entfernt [sound:]-Marker
 *  (Audio läuft nativ im Footer). Rein, nutzt eine vorgebaute Datei→URI-Map. */
export declare function resolveHtmlMedia(html: string, map: Record<string, string>): string;
export type RenderedContent = {
    frontHtml: string;
    backHtml: string;
    front: string;
    back: string;
};
/** Rendert Vorder-/Rückseite aus Feldern + Notiztyp (Editor-Speichern, importierte Karten).
 *  Rückseite ohne {{FrontSide}}-Doppelung — der Flip hat die Frage schon gezeigt. */
export declare function renderFromFields(noteType: CardNoteType, fields: Record<string, string>, mediaMap: Record<string, string>, ord?: number): RenderedContent;
export type ManualContent = RenderedContent & {
    fields: Record<string, string>;
    noteType: CardNoteType;
};
/** Baut den Inhalt einer selbst erstellten „Einfach"-Karte (Rohtext → sicheres HTML). */
export declare function buildManualContent(front: string, back: string, hint?: string): ManualContent;
/** Ist die Karte ein selbst erstellter „Einfach"-Typ? */
export declare function isBasicNoteType(noteType?: CardNoteType): boolean;
/** Feldname bei Type-in-Answer-Karten ({{type:Feld}} in der Vorderseiten-Vorlage), sonst undefined. */
export declare function typeFieldOf(noteType?: CardNoteType): string | undefined;
/** Ist der Notiztyp ein Image-Occlusion-Typ (eingebautes Anki-IO oder IO-Enhanced)? */
export declare function isImageOcclusion(noteType?: CardNoteType): boolean;
/** Baut Vorder-/Rückseite einer IO-Karte: Bild + SVG-Masken.
 *  Front: alle Masken (aktive Gruppe hervorgehoben). Back: alle außer aktiver Gruppe (aufgedeckt).
 *  `imageField` = Inhalt des Image-Felds (<img …>). Media-URI wird später aufgelöst. */
export declare function buildImageOcclusion(occlusion: string, imageField: string, ord: number): {
    front: string;
    back: string;
};
export type ClozeCard = RenderedContent & {
    fields: Record<string, string>;
    noteType: CardNoteType;
    ord: number;
};
/** Baut aus Lückentext echte Cloze-Karten (Anki-kompatibel).
 *  Nutzer markiert Lücken mit {{ }} → wird fortlaufend zu {{c1::…}}, {{c2::…}} …;
 *  bereits vorhandene {{cN::…}} bleiben. Eine Karte je Cloze-Nummer. */
export declare function buildClozeCards(rawText: string, extra?: string): ClozeCard[];
//# sourceMappingURL=render.d.ts.map