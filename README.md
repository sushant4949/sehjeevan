# Sehjeevan · The World of Stories

A small static site for **Sehjeevan Foundation's** online storytelling circle.

- **`index.html`**: home page with two rows of featured storytellers and a link to the [Sehjeevan YouTube channel](https://www.youtube.com/@Sehjeevan/videos) to listen to past sessions.
- **`storytellers.html`**: every storyteller and poet from the poster archive, with search, edition filters (Hindi / English / Children / Poetry) and full bios in Hindi and English.
- **`poster.html`** (Poster Studio): builds an A4 poster in four steps: edition (sets the colour theme), when & where (a registration link with QR code is optional), storytellers, and finishing touches. Download as **PNG, JPG or PDF** at the poster's exact size, or print. Someone not in the archive? **Add someone new** takes a photo (JPG, PNG, WebP, HEIC… any size, shrunk in the browser) with names and bios in English and/or Hindi; they're saved only in that browser.

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
index.html · storytellers.html · poster.html
css/     base.css (tokens, shared UI) · site.css (home + directory) · poster.css (studio + poster themes)
js/      common.js (data helpers) · site.js · poster.js (builder + export)
data/    storytellers.js
assets/  photos/ · img/ (logo, illustrations, textures) · fonts/ (Inter, League Spartan for all-caps titles, Anek Devanagari)
vendor/  html-to-image, jsPDF, qrcode-generator, heic2any (loaded only for HEIC photos)
```
