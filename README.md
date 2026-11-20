[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun rank](https://make.fun/badge/gta6-cover-art-01/arbbagiyo/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun reward](https://make.fun/badge/gta6-cover-art-01/arbbagiyo/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Built for the make.fun bounty [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01).

# Sunset Cover Studio

A web app that turns your photo and a caption into poster cover art in the style of
GTA 6's posters — a multi-panel collage, big bold lettering, and a Vice City sunset or
neon colour grade — exported as a PNG to share. It runs offline in a desktop browser
from its own static files; photos are read on your machine and never leave it.

## What it does

- **Your photo, any photo:** pick a file, drag one onto the cover, or use the two
  built-in samples. Each panel holds its own photo, so one cover can mix several.
- **Four layouts:** Hero (one full panel), Split (two), Triptych (three) and Grid
  (a 2 × 2 comic strip).
- **Crop per panel:** click a panel to select it, drag to move its photo, scroll over
  it to zoom, or use the zoom slider. "Fill all panels" puts one photo in every
  panel with a different crop in each — a face close-up, a near-full view, a
  closer detail, then the wide shot — so a multi-panel cover never repeats one
  image. The neon grade's horizon lines sit along the bottom edge of the photo
  area, clear of faces.
- **Caption:** free text plus a tagline, above or below the panels, in three
  lettering styles — Outline, Gradient and Neon — set in Archivo Black (SIL Open
  Font License, vendored under `app/fonts/`).
- **Three colour grades:** Sunset (warm orange-pink wash with a setting sun),
  Neon night (cyan/magenta horizon glow) and Palm dusk (purple-gold wash with a
  crescent moon).
- **One-click export:** PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080, at the
  exact pixel size. A sample cover is loaded on arrival, so it is one click from
  opening the page to a finished cover.

## Run it locally

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Hand it in with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/cover.js` — the cover renderer: panel layout, photo cover-fit, grade
  tints and sky motifs, caption band lettering.
- `app/src/main.js` — the editor: upload, drag-and-drop, panel crop, export.
- `app/src/shots.js` — fixed scenes for the screenshots (`?shot=editor`,
  `?shot=cover`).
- `app/fonts/ArchivoBlack-Regular.ttf` — the display font, SIL OFL 1.1 (see
  `app/fonts/OFL.txt`).
- `app/samples/` — the two sample photos, made with an image model for make.fun.
- `screenshots/` — the cover, the editor, and two more exported covers.

## Originality

All art is drawn by this app. It uses no Rockstar Games logo, wordmark, official
artwork, character or font.
