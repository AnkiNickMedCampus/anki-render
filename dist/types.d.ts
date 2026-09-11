/**
 * Typen, die der Renderer selbst braucht. Bewusst klein gehalten: Alles Weitere
 * (Card, CardSrs, …) bleibt in der App — dieses Paket rendert nur.
 */
/**
 * Anki-Notiztyp einer Karte — Quelle der Wahrheit für verlustfreies Rendern
 * und späteren Export. `qfmt`/`afmt` sind die Vorlagen des konkreten Kartentyps
 * (ord), `css` das Styling des Notiztyps.
 */
export interface CardNoteType {
    name: string;
    fieldNames: string[];
    qfmt: string;
    afmt: string;
    css: string;
}
/** Eingebauter „Einfach"-Notiztyp für selbst erstellte Karten. */
export declare const BASIC_NOTE_TYPE: CardNoteType;
/** Eingebauter Cloze-Notiztyp (Anki-kompatibel) für selbst erstellte Lückentexte. */
export declare const CLOZE_NOTE_TYPE: CardNoteType;
//# sourceMappingURL=types.d.ts.map