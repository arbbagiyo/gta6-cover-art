// Draws a GTA-poster-style cover: a multi-panel photo collage on a dark frame, a colour
// grade (sunset, neon night or palm dusk) with its own sky motif, and a big bold caption
// band. Everything is drawn by hand on a 2D canvas — no image is borrowed, and no
// Rockstar logo, artwork or font is used anywhere. The same function draws the live
// preview and the exported PNG, so what the maker sees is what the file holds.

export const LAYOUTS = {
  hero: { panels: 1, cols: 1, rows: 1 },
  split: { panels: 2, cols: 2, rows: 1 },
  triptych: { panels: 3, cols: 3, rows: 1 },
  grid: { panels: 4, cols: 2, rows: 2 },
};

export const GRADES = {
  sunset: {
    base: '#241031',
    band: '#2b0f3d',
    accent: '#ff7a3d',
    sun: true,
    tintTop: 'rgba(255, 120, 40, 0.06)',
    tintBottom: 'rgba(200, 30, 110, 0.38)',
    wash: 'rgba(255, 140, 60, 0.08)',
  },
  neon: {
    base: '#0b0620',
    band: '#12082e',
    accent: '#00e5ff',
    horizon: true,
    tintTop: 'rgba(0, 220, 255, 0.10)',
    tintBottom: 'rgba(255, 0, 180, 0.30)',
    wash: 'rgba(120, 0, 255, 0.10)',
  },
  dusk: {
    base: '#1c1038',
    band: '#241544',
    accent: '#ffd166',
    moon: true,
    tintTop: 'rgba(60, 40, 120, 0.16)',
    tintBottom: 'rgba(255, 180, 80, 0.22)',
    wash: 'rgba(90, 60, 180, 0.08)',
  },
};

export const CAPTION_STYLES = ['outline', 'gradient', 'neon'];

/** The common post sizes the app exports, with their exact pixel dimensions. */
export const EXPORT_SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

/** The panel rectangles for a layout, inside the photo area, with white gutters. */
export function panelRects(layout, w, h, photoTop, photoBottom) {
  const spec = LAYOUTS[layout] ?? LAYOUTS.triptych;
  const gutter = Math.max(4, Math.round(w * 0.011));
  const frame = Math.max(6, Math.round(w * 0.016));
  const areaX = frame;
  const areaY = photoTop;
  const areaW = w - frame * 2;
  const areaH = photoBottom - photoTop;
  const cellW = (areaW - gutter * (spec.cols - 1)) / spec.cols;
  const cellH = (areaH - gutter * (spec.rows - 1)) / spec.rows;
  const rects = [];
  for (let i = 0; i < spec.panels; i++) {
    const col = i % spec.cols;
    const row = Math.floor(i / spec.cols);
    rects.push({
      x: areaX + col * (cellW + gutter),
      y: areaY + row * (cellH + gutter),
      w: cellW,
      h: cellH,
    });
  }
  return { rects, gutter, frame };
}

/** Cover-fits one photo into a panel rect, honouring its zoom and pan. */
export function drawPanelPhoto(ctx, rect, panel) {
  const img = panel.photo;
  if (!img || !img.naturalWidth) {
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    grad.addColorStop(0, '#3a2350');
    grad.addColorStop(1, '#1c0f2e');
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = `700 ${Math.max(12, rect.w * 0.045)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DROP A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    return;
  }
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const cx = rect.x + rect.w / 2 + (panel.dx || 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (panel.dy || 0) * rect.h;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

/** The grade's wash over one panel, after its photo. */
export function gradePanelTint(ctx, rect, grade) {
  const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  tint.addColorStop(0, grade.tintTop);
  tint.addColorStop(1, grade.tintBottom);
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** The grade's sky motif, drawn once over the whole photo area. */
export function drawSkyMotif(ctx, w, photoTop, photoBottom, grade) {
  const photoH = photoBottom - photoTop;
  if (grade.sun) {
    // A half sun setting on the boundary between the photos and the caption band:
    // its lower half hides behind the band, so it never flares over a face.
    const r = Math.min(w, photoH) * 0.15;
    const cx = w * 0.85;
    const cy = photoBottom;
    const sun = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    sun.addColorStop(0, 'rgba(255, 247, 192, 0.95)');
    sun.addColorStop(0.45, 'rgba(255, 179, 71, 0.75)');
    sun.addColorStop(1, 'rgba(255, 120, 60, 0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (grade.horizon) {
    // Two neon lines along the bottom edge of the photo area, just above the
    // caption band: a horizon glow that never crosses a face or a subject.
    const yTop = photoBottom - photoH * 0.05;
    const yBot = photoBottom - photoH * 0.022;
    ctx.save();
    ctx.shadowBlur = w * 0.02;
    ctx.shadowColor = '#00e5ff';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.beginPath();
    ctx.moveTo(w * 0.06, yTop);
    ctx.lineTo(w * 0.94, yTop);
    ctx.stroke();
    ctx.shadowColor = '#ff2bd6';
    ctx.strokeStyle = '#ff2bd6';
    ctx.beginPath();
    ctx.moveTo(w * 0.06, yBot);
    ctx.lineTo(w * 0.94, yBot);
    ctx.stroke();
    ctx.restore();
  }
  if (grade.moon) {
    const cx = w * 0.88;
    const cy = photoTop + photoH * 0.1;
    const r = Math.min(w, photoH) * 0.055;
    ctx.save();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(28, 16, 56, 0.9)';
    ctx.beginPath();
    ctx.arc(cx + r * 0.45, cy - r * 0.2, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (const [sx, sy, sr] of [[0.14, 0.12, 2.2], [0.3, 0.07, 1.6], [0.62, 0.1, 2.0], [0.9, 0.3, 1.5]]) {
      ctx.beginPath();
      ctx.arc(w * sx, photoTop + (photoBottom - photoTop) * sy, Math.max(1, w * 0.002 * sr), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/** Fits a caption to one line inside `maxWidth`, returning the font size. */
export function fitCaptionSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px "Archivo Black", "Arial Black", sans-serif`;
  while (size > 14 && ctx.measureText(text).width * 0.88 > maxWidth) {
    size = Math.max(14, size - Math.max(2, size * 0.04));
    ctx.font = `${size}px "Archivo Black", "Arial Black", sans-serif`;
  }
  return size;
}

/** Draws the caption band: accent rule, tagline, and the big condensed lettering. */
export function drawCaptionBand(ctx, w, h, bandY, bandH, grade, caption, tagline, style) {
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandY, w, Math.max(3, h * 0.004));
  const text = (caption || '').trim().toUpperCase() || 'SUNSET HEIST';
  const tag = (tagline || '').trim().toUpperCase();
  const pad = w * 0.04;
  let textY = bandY + bandH * 0.62;
  if (tag) {
    ctx.fillStyle = grade.accent;
    ctx.font = `700 ${Math.max(12, bandH * 0.13)}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    try { ctx.letterSpacing = `${Math.max(2, bandH * 0.03)}px`; } catch { /* older canvas */ }
    ctx.fillText(tag, pad, bandY + bandH * 0.22);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    textY = bandY + bandH * 0.78;
  }
  const size = fitCaptionSize(ctx, text, w - pad * 2, bandH * (tag ? 0.52 : 0.58));
  ctx.save();
  ctx.translate(pad, textY);
  ctx.scale(0.88, 1);
  ctx.font = `${size}px "Archivo Black", "Arial Black", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.04;
  if (style === 'neon') {
    ctx.shadowColor = '#ff2bd6';
    ctx.shadowBlur = size * 0.3;
  }
  ctx.strokeStyle = '#14092b';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeText(text, 0, 0);
  if (style === 'gradient') {
    const grad = ctx.createLinearGradient(0, -size * 0.8, 0, size * 0.2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#ffd166');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Draws the whole cover onto `canvas`'s 2D context at the canvas's own size. */
export function drawCoverArt(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const spec = LAYOUTS[state.layout] ?? LAYOUTS.triptych;
  ctx.fillStyle = grade.base;
  ctx.fillRect(0, 0, w, h);
  const bandH = Math.round(h * (state.captionPos === 'top' ? 0.17 : 0.17));
  const bandY = state.captionPos === 'top' ? 0 : h - bandH;
  const photoTop = state.captionPos === 'top' ? bandH : 0;
  const photoBottom = state.captionPos === 'top' ? h : h - bandH;
  const { rects, gutter, frame } = panelRects(state.layout, w, h, photoTop, photoBottom);
  for (let i = 0; i < spec.panels; i++) {
    const rect = rects[i];
    const panel = state.panels[i] ?? { photo: null, zoom: 1, dx: 0, dy: 0 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    drawPanelPhoto(ctx, rect, panel);
    gradePanelTint(ctx, rect, grade);
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, gutter * 0.45);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }
  drawSkyMotif(ctx, w, photoTop, photoBottom, grade);
  drawCaptionBand(ctx, w, h, bandY, bandH, grade, state.caption, state.tagline, state.captionStyle);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, frame * 0.5);
  ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);
  return { rects, bandY, bandH };
}
