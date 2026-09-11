/**
 * Typen, die der Renderer selbst braucht. Bewusst klein gehalten: Alles Weitere
 * (Card, CardSrs, …) bleibt in der App — dieses Paket rendert nur.
 */
/** Eingebauter „Einfach"-Notiztyp für selbst erstellte Karten. */
export const BASIC_NOTE_TYPE = {
    name: 'Einfach',
    fieldNames: ['Vorderseite', 'Rückseite', 'Notiz'],
    qfmt: '{{Vorderseite}}',
    afmt: '{{Vorderseite}}\n<hr>\n{{Rückseite}}\n{{#Notiz}}<div class="hint">{{Notiz}}</div>{{/Notiz}}',
    css: '',
};
/** Eingebauter Cloze-Notiztyp (Anki-kompatibel) für selbst erstellte Lückentexte. */
export const CLOZE_NOTE_TYPE = {
    name: 'Cloze',
    fieldNames: ['Text', 'Extra'],
    qfmt: '{{cloze:Text}}',
    afmt: '{{cloze:Text}}{{#Extra}}<div class="hint">{{Extra}}</div>{{/Extra}}',
    css: '',
};
//# sourceMappingURL=types.js.map