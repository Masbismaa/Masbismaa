// Shared drawing for both games. Everything is drawn around (0,0), facing +x.

export function beetle(g, r, t, ph, shell, edge, spots) {
  g.lineCap = 'round';
  g.strokeStyle = edge;
  g.lineWidth = Math.max(1.4, r * .08);
  for (let i = 0; i < 3; i++) {
    const bx = r * (.45 - i * .38), sw = Math.sin(t / 55 + ph + i * 2.1) * r * .22 * (i % 2 ? -1 : 1);
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(bx, sd * r * .3); g.lineTo(bx + sw * sd, sd * r * .95); g.lineTo(bx + sw * sd - r * .25, sd * r * 1.2); g.stroke(); }
  }
  g.lineWidth = Math.max(1.1, r * .05);
  for (const sd of [-1, 1]) { const w = Math.sin(t / 90 + ph + sd) * r * .15; g.beginPath(); g.moveTo(r * .9, sd * r * .12); g.quadraticCurveTo(r * 1.35, sd * r * .25 + w, r * 1.55, sd * r * .55 + w); g.stroke(); }
  const grd = g.createLinearGradient(0, -r * .6, 0, r * .6);
  grd.addColorStop(0, lighten(shell, 28)); grd.addColorStop(.45, shell); grd.addColorStop(1, lighten(shell, -18));
  g.fillStyle = grd; g.lineWidth = Math.max(1.2, r * .06);
  g.beginPath(); g.ellipse(-r * .3, 0, r * .8, r * .6, 0, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(r * .45, 0); g.lineTo(-r * 1.08, 0); g.stroke();
  g.fillStyle = shell;
  g.beginPath(); g.ellipse(r * .45, 0, r * .3, r * .38, 0, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.arc(r * .82, 0, r * .22, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#e6c25a';
  g.beginPath(); g.arc(r * .92, -r * .1, r * .06, 0, 7); g.arc(r * .92, r * .1, r * .06, 0, 7); g.fill();
  if (spots) {
    g.fillStyle = spots;
    for (const [a, b] of [[-.5, -.28], [-.5, .28], [-.05, -.3], [-.05, .3]]) { g.beginPath(); g.arc(r * a, r * b, r * .08, 0, 7); g.fill(); }
  }
  g.fillStyle = 'rgba(255,255,255,.12)';
  g.beginPath(); g.ellipse(-r * .4, -r * .28, r * .45, r * .12, -.1, 0, 7); g.fill();
}

export function sprayCan(g, s) {
  g.fillStyle = '#c9a23e'; g.strokeStyle = '#141414'; g.lineWidth = 1.6;
  g.fillRect(-s * .45, -s * .7, s * .9, s * 1.5); g.strokeRect(-s * .45, -s * .7, s * .9, s * 1.5);
  g.fillStyle = '#1b1b1b'; g.fillRect(-s * .45, -s * .12, s * .9, s * .26);
  g.fillStyle = '#8e9296'; g.beginPath(); g.moveTo(-s * .45, -s * .7); g.quadraticCurveTo(0, -s * 1.02, s * .45, -s * .7); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#141414'; g.fillRect(-s * .08, -s * 1.08, s * .16, s * .16);
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-s * .34, -s * .62, s * .1, s * 1.3);
}

export function server(g, w, h, t, ph) {
  g.fillStyle = '#1d1f20'; g.strokeStyle = '#5d6063'; g.lineWidth = 1.5;
  g.fillRect(-w / 2, -h / 2, w, h); g.strokeRect(-w / 2, -h / 2, w, h);
  for (let i = 0; i < 3; i++) {
    const y = -h / 2 + h * (.22 + i * .28), on = Math.floor(t / 180 + i + ph) % 2 === 0;
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(-w / 2 + 4, y - 2, w * .5, 4);
    g.fillStyle = on ? '#d8413a' : '#4a2624'; g.beginPath(); g.arc(w / 2 - 6, y, 2.4, 0, 7); g.fill();
  }
}

function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, v + amt));
  return `rgb(${c(n >> 16)},${c(n >> 8 & 255)},${c(n & 255)})`;
}

// Loads a texture image once for canvas patterns (falls back to flat colour if it fails).
const cache = {};
export function image(src) {
  if (!cache[src]) { const im = new Image(); im.src = src; cache[src] = im; }
  return cache[src];
}
