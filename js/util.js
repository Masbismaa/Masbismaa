export const $ = id => document.getElementById(id);
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
export const rand = (a, b) => a + Math.random() * (b - a);
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const wait = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));

export const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};

// Canvas sized to its element, redrawn at device pixel ratio.
export function fitCanvas(canvas, el = canvas) {
  const d = Math.min(2, devicePixelRatio || 1), w = el.clientWidth, h = el.clientHeight;
  canvas.width = Math.max(1, w * d); canvas.height = Math.max(1, h * d);
  canvas.getContext('2d').setTransform(d, 0, 0, d, 0, 0);
  return { w, h };
}

export function countTo(el, to) {
  const from = +el.dataset.v || 0;
  el.dataset.v = to;
  if (reduceMotion) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = t => { const p = Math.min(1, (t - t0) / 450); el.textContent = Math.round(from + (to - from) * p); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

export function copyText(text, btn, idle, source) {
  const done = () => { btn.textContent = 'Tersalin'; setTimeout(() => btn.textContent = idle, 1500); };
  const fallback = () => { const r = document.createRange(); r.selectNodeContents(source); getSelection().removeAllRanges(); getSelection().addRange(r); btn.textContent = 'Tekan Ctrl+C'; setTimeout(() => btn.textContent = idle, 2000); };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(fallback); else fallback();
}
