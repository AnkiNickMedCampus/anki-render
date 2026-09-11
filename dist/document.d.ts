/**
 * Farben und Maße des Karten-Skins. Die Anwendung liefert sie aus ihrem
 * Theme; dieses Modul kennt kein Theme, nur diese acht Werte.
 */
export type CardSkin = {
    text: string;
    muted: string;
    secondary: string;
    border: string;
    accent: string;
    heading: string;
    size: number;
    dark: boolean;
};
export type CardDocumentOptions = {
    /** Zusätzliches <head>-Markup, etwa KaTeX-Stile und -Skript. */
    head?: string;
    /**
     * Höhe des Inhalts an `window.ReactNativeWebView.postMessage` melden —
     * nur in der App gebraucht, wo die WebView ihre Höhe vom Inhalt bezieht.
     * Im Browser (iframe) gibt es diese Brücke nicht.
     */
    reportHeight?: boolean;
};
/** Enthält der Inhalt LaTeX/Mathe (Anki- oder MathJax-Delimiter)? */
export declare function hasMath(html: string): boolean;
/**
 * Anki-/MathJax-Mathe in <span>-Container umwandeln, die KaTeX dann rendert.
 * Inhalt wird escaped — `<` und `&` in Formeln dürfen nicht als Markup gelten.
 */
export declare function convertAnkiMath(html: string): string;
/**
 * Das CSS des Rekall-Skins — „Anki-HTML, nur in schön".
 *
 * Bewusst NICHT das Deck-eigene CSS: Viele Decks setzen `.card{background:
 * white}` und würden den Look zerreißen. Inline-Formatierung der Felder
 * (fett, kursiv, Tabellen, Bilder) bleibt erhalten, alles Weitere bestimmt
 * der Skin.
 */
export declare function cardSkinCss(s: CardSkin): string;
/**
 * Vollständiges HTML-Dokument für eine Karte — dasselbe für die WebView der
 * App und das iframe der Backend-Vorschau. Das ist der Zweck: Eine Vorschau,
 * die anders aussieht als die App, führt in die Irre.
 */
export declare function buildCardDocument(body: string, skin: CardSkin, opts?: CardDocumentOptions): string;
//# sourceMappingURL=document.d.ts.map