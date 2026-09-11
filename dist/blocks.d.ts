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
{
    id: string;
    type: 'field';
    field: string;
    size?: BlockSize;
    align?: BlockAlign;
    tone?: BlockTone;
    hideIfEmpty?: boolean;
}
/** Lückentext — `{{cloze:Feld}}`. */
 | {
    id: string;
    type: 'cloze';
    field: string;
    size?: BlockSize;
    align?: BlockAlign;
}
/** Bild aus einem Feld, in einem Rahmen mit maximaler Breite. */
 | {
    id: string;
    type: 'image';
    field: string;
}
/** Überschrift — entweder aus einem Feld oder fester Text. */
 | {
    id: string;
    type: 'heading';
    field?: string;
    text?: string;
}
/** Hinweisbox, nur wenn das Feld gefüllt ist; mit optionaler Beschriftung. */
 | {
    id: string;
    type: 'hint';
    field: string;
    label?: string;
}
/** Kurze Trennlinie. */
 | {
    id: string;
    type: 'divider';
}
/** Fester Text, auf jeder Karte gleich. */
 | {
    id: string;
    type: 'text';
    text: string;
    align?: BlockAlign;
    tone?: BlockTone;
}
/** Eingabefeld zum Abtippen — `{{type:Feld}}`. */
 | {
    id: string;
    type: 'type';
    field: string;
}
/** Die Vorderseite noch einmal (nur Rückseite) — `{{FrontSide}}`. */
 | {
    id: string;
    type: 'frontside';
};
export type BlockType = LayoutBlock['type'];
export type NoteLayout = {
    /** Formatversion, damit sich gespeicherte Layouts später wandeln lassen. */
    v: 1;
    front: LayoutBlock[];
    back: LayoutBlock[];
};
export type CompiledLayout = {
    qfmt: string;
    afmt: string;
    css: string;
};
/** Blockarten, die ein Feld brauchen. */
export declare const FIELD_BLOCKS: ReadonlySet<BlockType>;
/** Kennung für einen neuen Block — nur innerhalb eines Layouts eindeutig. */
export declare function newBlockId(): string;
export declare function emptyLayout(): NoteLayout;
/**
 * Brauchbarer Anfang für einen neuen Notiztyp: erstes Feld vorn, hinten die
 * Vorderseite, eine Linie, das zweite Feld, alle weiteren als Hinweisboxen.
 * Das ist die Karte, die die meisten wollen — der Baukasten ist für den Rest.
 */
export declare function defaultLayout(fieldNames: string[]): NoteLayout;
/**
 * Lückentext-Variante: `{{cloze:…}}` auf beiden Seiten, Hinweise nur hinten.
 * Anki verlangt bei Cloze-Notiztypen genau das — ohne `cloze:` vorn entstehen
 * keine Karten.
 */
export declare function defaultClozeLayout(fieldNames: string[]): NoteLayout;
/** Einen Block in Vorlagen-HTML übersetzen. */
export declare function compileBlock(b: LayoutBlock): string;
/**
 * Regeln für die `nb-*`-Klassen, mit den Farben eines Skins. Die App bindet
 * sie über `cardSkinCss()` ein; für Anki Desktop erzeugt `compileLayout()`
 * dieselben Regeln mit festen Farben (Anki hat keinen Skin).
 */
export declare function layoutCss(s: Pick<CardSkin, 'secondary' | 'muted' | 'accent' | 'heading' | 'border'>): string;
/** Vorlagen und CSS aus einem Layout — das, was in `catalog_note_types` landet. */
export declare function compileLayout(layout: NoteLayout): CompiledLayout;
/** Felder, die das Layout benutzt — für die Prüfung gegen die Feldliste. */
export declare function usedFields(layout: NoteLayout): string[];
//# sourceMappingURL=blocks.d.ts.map