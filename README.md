# Sehjeevan · The World of Stories

A small static site for **Sehjeevan Foundation's** online storytelling circle.

- **`index.html`**: an interactive directory of every storyteller and poet from the poster archive. It has search, edition filters (Hindi / English / Children / Poetry), full bios in Hindi and English, and a timeline of past sessions.
- **`poster.html`** (Poster Studio): builds a print-ready *The World of Stories* poster. Pick the edition, date, time, platform, registration text and link (rendered with a QR code), choose storytellers, reorder them, switch bio language or edit bios, then **Print / Download** as **PNG, JPG, PDF (A4 or poster size)** or send it straight to the printer.

Everything runs in the browser. There is no build step and no server code.

## Run locally

Export needs the page served over http (not opened as a `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Where the content comes from

`data/storytellers.js` and `assets/photos/` were extracted from `Story poster- Sehjeevan.pptx`:
each photo was taken out of its frame at original resolution and matched to the name and bio on the same poster.
Storytellers who appeared more than once were merged, keeping the most recent Hindi and English bio of each.

To add a storyteller, append an entry to `data/storytellers.js` and drop a photo in `assets/photos/`.
If a photo isn't a tight headshot, add a focal point for it in `FOCUS` in `js/common.js`.

## Structure

```
index.html · poster.html
css/     base.css (tokens, shared UI) · site.css · poster.css (studio + poster canvas)
js/      common.js (data helpers) · site.js · poster.js (builder + export)
data/    storytellers.js
assets/  photos/ · img/ (logo, illustrations, paper texture) · fonts/ (Archivo, Archivo Black, Hind)
vendor/  html-to-image, jsPDF, qrcode-generator
```
