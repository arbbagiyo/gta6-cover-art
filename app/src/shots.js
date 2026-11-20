// Fixed scenes for screenshots: ?shot=editor shows the page with a sample photo loaded;
// ?shot=cover shows the exported cover alone, at the export size the query names.
// `layout`, `grade`, `caption`, `tagline`, `photo` and `size` come from the query.
// window.__shotReady is set once painted.
import { EXPORT_SIZES } from './cover.js';

export async function runShot(shot, query, app) {
  const layout = query.get('layout') ?? 'triptych';
  const grade = query.get('grade') ?? 'sunset';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const tagline = query.get('tagline') ?? 'A Leonida Story';
  const photo = query.get('photo') ?? 'pier';
  const sizeKey = query.get('size') ?? 'square';
  app.state.layout = layout;
  app.state.grade = grade;
  app.state.caption = caption;
  app.state.tagline = tagline;
  app.state.size = sizeKey;
  await app.loadSample(photo, true);
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = EXPORT_SIZES[sizeKey];
    const cover = app.renderExport(sizeKey);
    const view = document.getElementById('preview');
    view.width = size.w;
    view.height = size.h;
    const ctx = view.getContext('2d');
    ctx.drawImage(cover, 0, 0);
  } else {
    app.renderPreview();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
