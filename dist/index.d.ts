/**
 * @ankinick/anki-render — Anki-Karten aus Feldern und Notiztyp rendern.
 *
 * Eine Implementierung für beide Anwendungen: die Expo-App zeigt damit die
 * Lernkarte, das Backend-Frontend die Vorschau im Redaktions-Editor. Das ist
 * der Punkt — eine Vorschau, die anders rendert als die App, ist wertlos.
 *
 * Bewusst frei von Plattform-APIs: kein react-native, kein expo-*, kein DOM.
 * Reine Zeichenketten-Verarbeitung, damit es in Hermes wie im Browser läuft.
 */
export { BASIC_NOTE_TYPE, CLOZE_NOTE_TYPE, type CardNoteType, } from './types.js';
export { buildClozeCards, buildImageOcclusion, buildManualContent, escapeHtml, isBasicNoteType, isImageOcclusion, isInsideTag, renderFromFields, renderTemplate, resolveHtmlMedia, stripHtml, typeFieldOf, type ClozeCard, type ManualContent, type RenderedContent, type RenderOpts, } from './render.js';
//# sourceMappingURL=index.d.ts.map