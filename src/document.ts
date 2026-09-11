import { escapeHtml } from './render.js';

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
export function hasMath(html: string): boolean {
    return /\\\(|\\\[|\[latex\]|\[\$/i.test(html);
}

/**
 * Anki-/MathJax-Mathe in <span>-Container umwandeln, die KaTeX dann rendert.
 * Inhalt wird escaped — `<` und `&` in Formeln dürfen nicht als Markup gelten.
 */
export function convertAnkiMath(html: string): string {
    const inline = (x: string) => `<span class="katex-inline">${escapeHtml(x.trim())}</span>`;
    const block = (x: string) => `<span class="katex-block">${escapeHtml(x.trim())}</span>`;

    return html
        .replace(/\[\$\$\]([\s\S]*?)\[\/\$\$\]/g, (_m, x) => block(x))
        .replace(/\[latex\]([\s\S]*?)\[\/latex\]/gi, (_m, x) => block(x))
        .replace(/\[\$\]([\s\S]*?)\[\/\$\]/g, (_m, x) => inline(x))
        .replace(/\\\[([\s\S]*?)\\\]/g, (_m, x) => block(x))
        .replace(/\\\(([\s\S]*?)\\\)/g, (_m, x) => inline(x));
}

/**
 * Das CSS des Rekall-Skins — „Anki-HTML, nur in schön".
 *
 * Bewusst NICHT das Deck-eigene CSS: Viele Decks setzen `.card{background:
 * white}` und würden den Look zerreißen. Inline-Formatierung der Felder
 * (fett, kursiv, Tabellen, Bilder) bleibt erhalten, alles Weitere bestimmt
 * der Skin.
 */
export function cardSkinCss(s: CardSkin): string {
    return `
    html,body{margin:0;padding:0;background:transparent;}
    .katex-block{display:block;margin:10px 0;} .katex{font-size:1.05em;}
    body{
      color:${s.text};
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;
      font-size:${s.size}px; line-height:1.5;
      text-align:center; padding:2px 2px; box-sizing:border-box;
      -webkit-text-size-adjust:100%;
      word-break:break-word; overflow-wrap:anywhere;
    }
    b,strong{font-weight:700;color:${s.heading};}
    i,em{color:${s.muted};font-style:italic;}
    hr{border:none;border-top:1px solid ${s.border};width:56px;margin:15px auto;}
    img{max-width:100%;height:auto;border-radius:14px;margin:8px 0;}
    a{color:${s.accent};text-decoration:none;}
    .hint,small{display:block;color:${s.secondary};font-size:.82em;margin-top:12px;}
    .cloze{color:${s.accent};font-weight:700;}
    table{margin:8px auto;border-collapse:collapse;}
    td,th{border:1px solid ${s.border};padding:4px 9px;}
    ul,ol{display:inline-block;text-align:left;margin:6px 0;}
  `;
}

/**
 * Vollständiges HTML-Dokument für eine Karte — dasselbe für die WebView der
 * App und das iframe der Backend-Vorschau. Das ist der Zweck: Eine Vorschau,
 * die anders aussieht als die App, führt in die Irre.
 */
export function buildCardDocument(body: string, skin: CardSkin, opts: CardDocumentOptions = {}): string {
    const head = opts.head ?? '';
    const mathJs = head
        ? "document.querySelectorAll('.katex-inline,.katex-block').forEach(function(el){try{katex.render(el.textContent,el,{displayMode:el.className.indexOf('katex-block')>=0,throwOnError:false});}catch(e){}});"
        : '';
    const heightJs = opts.reportHeight
        ? `
    function post(){try{window.ReactNativeWebView.postMessage(String(Math.ceil(document.body.getBoundingClientRect().height)));}catch(e){}}
    post();window.addEventListener('load',post);setTimeout(post,60);setTimeout(post,300);
    if(window.ResizeObserver){new ResizeObserver(post).observe(document.body);}`
        : '';
    const js = `${mathJs}${heightJs}\n    true;`;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><style>${cardSkinCss(skin)}</style>${head}</head><body>${body}<script>${js}</script></body></html>`;
}
