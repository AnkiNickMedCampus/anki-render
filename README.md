# @ankinick/anki-render

Rendert Anki-Karten aus **Feldern + Notiztyp** — Cloze, Type-in-Answer,
Image Occlusion, Medien-Auflösung, Klartext-Vorschau.

Genutzt von **beiden** Anwendungen:

| | wofür |
|---|---|
| `ankinick-app` (Expo) | die Lernkarte im Study-Screen |
| `ankinick-web-backend` (Inertia/React) | die Live-Vorschau im Redaktions-Editor |

Das ist der Zweck des Pakets: Eine Editor-Vorschau, die anders rendert als die
App, führt in die Irre. Zwei Implementierungen laufen unweigerlich auseinander —
ein Cloze- oder LaTeX-Fix müsste sonst jedes Mal doppelt gemacht werden.

## Grenzen

Bewusst frei von Plattform-APIs: kein `react-native`, kein `expo-*`, kein DOM,
kein `fetch`. Reine Zeichenketten-Verarbeitung, damit es unter Hermes genauso
läuft wie im Browser.

Medien werden **nicht** geladen — `resolveHtmlMedia` setzt nur URIs aus einer
mitgegebenen Map ein. Woher die kommen (lokaler Cache, Manifest, Objektspeicher),
entscheidet die Anwendung.

## Ausrollen

`dist/` liegt nicht im Repo, sondern wird beim Installieren über `prepare`
gebaut.

**Achtung — die Falle aus dem Wiki:** Das `package-lock.json` der Anwendung
friert einen konkreten Commit ein. Ein Push hierher erreicht **keine**
Anwendung, solange dort nicht

```bash
npm install @ankinick/anki-render
```

läuft. Das gilt für App und Backend getrennt.
