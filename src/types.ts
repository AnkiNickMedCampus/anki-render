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
export const BASIC_NOTE_TYPE: CardNoteType = {
  name: 'Einfach',
  fieldNames: ['Vorderseite', 'Rückseite', 'Notiz'],
  qfmt: '{{Vorderseite}}',
  afmt: '{{Vorderseite}}\n<hr>\n{{Rückseite}}\n{{#Notiz}}<div class="hint">{{Notiz}}</div>{{/Notiz}}',
  css: '',
};

/** Eingebauter Cloze-Notiztyp (Anki-kompatibel) für selbst erstellte Lückentexte. */
export const CLOZE_NOTE_TYPE: CardNoteType = {
  name: 'Cloze',
  fieldNames: ['Text', 'Extra'],
  qfmt: '{{cloze:Text}}',
  afmt: '{{cloze:Text}}{{#Extra}}<div class="hint">{{Extra}}</div>{{/Extra}}',
  css: '',
};
