// Wires the editor: photo upload and drag-and-drop, sample photos, layout and grade
// switches, caption editing, per-panel crop (drag to pan, wheel to zoom, slider to zoom),
// and one-click PNG export at the common post sizes. A `?shot=` query sets up a fixed
// scene for a screenshot instead (./shots.js). Photos are read on this machine only and
// never leave it.
import { drawCoverArt, LAYOUTS, EXPORT_SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('preview');
const status = document.getElementById('status');
const state = {
  layout: 'triptych',
  grade: 'sunset',
  caption: 'Sunset Heist',
  tagline: 'A Leonida Story',
  captionPos: 'bottom',
  captionStyle: 'outline',
  size: 'square',
  panels: [
    { photo: null, zoom: 1, dx: 0, dy: 0 },
    { photo: null, zoom: 1, dx: 0, dy: 0 },
    { photo: null, zoom: 1, dx: 0, dy: 0 },
    { photo: null, zoom: 1, dx: 0, dy: 0 },
  ],
  selected: 0,
};

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Renders the preview canvas at a small size that keeps the export aspect. */
export function renderPreview() {
  const size = EXPORT_SIZES[state.size];
  const longSide = 640;
  const scale = longSide / Math.max(size.w, size.h);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  drawCoverArt(canvas, state);
  syncPanelControls();
}

/** Renders an export-size canvas and returns it (the preview never changes). */
export function renderExport(sizeKey) {
  const size = EXPORT_SIZES[sizeKey ?? state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCoverArt(off, state);
  return off;
}

/** Keeps the panel controls honest about the selected panel. */
export function syncPanelControls() {
  const panel = state.panels[state.selected];
  const zoom = document.getElementById('zoom');
  zoom.value = String(Math.round((panel.zoom || 1) * 100));
  document.getElementById('zoomValue').textContent = `${Math.round((panel.zoom || 1) * 100)}%`;
  document.getElementById('panelLabel').textContent = `Panel ${state.selected + 1} of ${LAYOUTS[state.layout].panels}`;
  for (const btn of document.querySelectorAll('[data-layout]')) {
    btn.classList.toggle('active', btn.dataset.layout === state.layout);
  }
  for (const btn of document.querySelectorAll('[data-grade]')) {
    btn.classList.toggle('active', btn.dataset.grade === state.grade);
  }
  for (const btn of document.querySelectorAll('[data-caption-style]')) {
    btn.classList.toggle('active', btn.dataset.captionStyle === state.captionStyle);
  }
  for (const btn of document.querySelectorAll('[data-size]')) {
    btn.classList.toggle('active', btn.dataset.size === state.size);
  }
  for (const btn of document.querySelectorAll('[data-caption-pos]')) {
    btn.classList.toggle('active', btn.dataset.captionPos === state.captionPos);
  }
}

/** Puts one loaded photo into a panel slot. */
export function setPanelPhoto(index, img) {
  state.panels[index] = { photo: img, zoom: 1, dx: 0, dy: 0 };
}

/** A different crop of the same photo for each panel, so a multi-panel cover reads
 *  as a poster instead of one image repeated: a close-up leaning left, a near-full
 *  centre view, a closer detail leaning right, then the wide shot. Each panel keeps
 *  its own pan/zoom afterwards — drag, wheel or the slider to diverge further. */
const VARIED_CROPS = [
  { zoom: 1.35, dx: 0.12, dy: 0.06 },
  { zoom: 1.15, dx: 0.02, dy: 0.02 },
  { zoom: 1.7, dx: -0.14, dy: -0.1 },
  { zoom: 1, dx: 0, dy: 0 },
];

/** Puts one photo into every panel of the current layout, each with its own crop. */
export function fillAllPanels(img) {
  for (let i = 0; i < LAYOUTS[state.layout].panels; i++) {
    const crop = VARIED_CROPS[i % VARIED_CROPS.length];
    state.panels[i] = { photo: img, zoom: crop.zoom, dx: crop.dx, dy: crop.dy };
  }
}

async function loadSample(name, fillAll) {
  const img = await loadImage(`samples/${name}.jpg`);
  if (fillAll) fillAllPanels(img);
  else setPanelPhoto(state.selected, img);
  renderPreview();
}

/** Reads an uploaded file into the selected panel. */
export async function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    status.textContent = 'That file is not an image.';
    return;
  }
  const img = await loadImage(URL.createObjectURL(file));
  setPanelPhoto(state.selected, img);
  status.textContent = `${file.name} is in panel ${state.selected + 1}.`;
  renderPreview();
}

/** Finds which panel a preview point falls in, in canvas pixels. */
export function panelAt(x, y) {
  const rect = canvas.getBoundingClientRect();
  const px = ((x - rect.left) / rect.width) * canvas.width;
  const py = ((y - rect.top) / rect.height) * canvas.height;
  const drawn = drawCoverArt(canvas, state);
  for (let i = drawn.rects.length - 1; i >= 0; i--) {
    const r = drawn.rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function bindControls() {
  document.getElementById('photoFile').addEventListener('change', (e) => {
    loadFile(e.target.files[0]);
    e.target.value = '';
  });
  const drop = document.getElementById('dropzone');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    loadFile(e.dataTransfer.files[0]);
  });
  document.getElementById('samplePier').addEventListener('click', () => loadSample('pier', true));
  document.getElementById('sampleBoulevard').addEventListener('click', () => loadSample('boulevard', true));
  document.getElementById('fillAll').addEventListener('click', () => {
    const img = state.panels[state.selected].photo;
    if (!img) { status.textContent = 'Load a photo into the selected panel first.'; return; }
    fillAllPanels(img);
    status.textContent = 'Each panel shows a different crop of the same photo.';
    renderPreview();
  });
  for (const btn of document.querySelectorAll('[data-layout]')) {
    btn.addEventListener('click', () => {
      state.layout = btn.dataset.layout;
      state.selected = 0;
      renderPreview();
    });
  }
  for (const btn of document.querySelectorAll('[data-grade]')) {
    btn.addEventListener('click', () => { state.grade = btn.dataset.grade; renderPreview(); });
  }
  for (const btn of document.querySelectorAll('[data-caption-style]')) {
    btn.addEventListener('click', () => { state.captionStyle = btn.dataset.captionStyle; renderPreview(); });
  }
  for (const btn of document.querySelectorAll('[data-caption-pos]')) {
    btn.addEventListener('click', () => { state.captionPos = btn.dataset.captionPos; renderPreview(); });
  }
  for (const btn of document.querySelectorAll('[data-size]')) {
    btn.addEventListener('click', () => { state.size = btn.dataset.size; renderPreview(); });
  }
  const caption = document.getElementById('caption');
  caption.addEventListener('input', () => { state.caption = caption.value; renderPreview(); });
  const tagline = document.getElementById('tagline');
  tagline.addEventListener('input', () => { state.tagline = tagline.value; renderPreview(); });
  document.getElementById('zoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value) / 100;
    renderPreview();
  });
  document.getElementById('resetCrop').addEventListener('click', () => {
    state.panels[state.selected] = { photo: state.panels[state.selected].photo, zoom: 1, dx: 0, dy: 0 };
    renderPreview();
  });
  document.getElementById('export').addEventListener('click', exportPNG);
}

function bindCanvas() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    const hit = panelAt(e.clientX, e.clientY);
    if (hit < 0) return;
    state.selected = hit;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    renderPreview();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const panel = state.panels[state.selected];
    const drawn = drawCoverArt(canvas, state);
    const r = drawn.rects[state.selected];
    if (!r) return;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    panel.dx = clamp(panel.dx + ((e.clientX - lastX) * scaleX) / r.w, -0.6, 0.6);
    panel.dy = clamp(panel.dy + ((e.clientY - lastY) * scaleY) / r.h, -0.6, 0.6);
    lastX = e.clientX;
    lastY = e.clientY;
    renderPreview();
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const hit = panelAt(e.clientX, e.clientY);
    if (hit < 0) return;
    state.selected = hit;
    const panel = state.panels[hit];
    panel.zoom = clamp((panel.zoom || 1) * (e.deltaY < 0 ? 1.12 : 1 / 1.12), 1, 3);
    renderPreview();
  }, { passive: false });
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** Exports the cover at the chosen size as a PNG download. */
export function exportPNG() {
  const size = EXPORT_SIZES[state.size];
  const off = renderExport(state.size);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved sunset-cover-${size.w}x${size.h}.png (${size.w} x ${size.h}).`;
  }, 'image/png');
}

/** The app's own handle, used by the screenshot scenes and by tests. */
export const coverApp = {
  state,
  renderPreview,
  renderExport,
  loadSample,
  loadFile,
  setPanelPhoto,
  fillAllPanels,
  exportPNG,
};
window.__coverApp = coverApp;

bindControls();
bindCanvas();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, coverApp);
} else {
  loadSample('pier', true).then(() => {
    renderPreview();
    status.textContent = 'A sample cover is loaded — swap in your own photo, or export it as it is.';
  });
}
