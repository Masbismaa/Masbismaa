// Small debris bursts drawn above the page: concrete chips and a few sparks.
import { $, rand, reduceMotion, fitCanvas } from './util.js';

const canvas = $('fx'), ctx = canvas.getContext('2d');
let bits = [], raf = null;
const resize = () => fitCanvas(canvas);
resize();
addEventListener('resize', resize);

function loop() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  bits = bits.filter(b => b.life < b.max && b.y < innerHeight + 20);
  for (const b of bits) {
    b.life++; b.vx *= .96; b.vy += .28; b.x += b.vx; b.y += b.vy; b.rot += b.vr;
    ctx.globalAlpha = Math.min(1, (b.max - b.life) / 14);
    ctx.fillStyle = b.c;
    if (b.spark) { ctx.fillRect(b.x, b.y, 2, 2); continue; }
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
    ctx.fillRect(-b.r, -b.r * .6, b.r * 2, b.r * 1.2);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  raf = bits.length ? requestAnimationFrame(loop) : (ctx.clearRect(0, 0, innerWidth, innerHeight), null);
}

export function burstAt(x, y, n = 18) {
  if (reduceMotion) return;
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), v = rand(1.5, 7), spark = Math.random() < .25;
    bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, r: rand(1, 3), rot: rand(0, 6), vr: rand(-.3, .3), life: 0, max: rand(28, 60), spark, c: spark ? '#e4be5a' : ['#8c8b84', '#6f6e68', '#b2b0a6'][i % 3] });
  }
  if (!raf) raf = requestAnimationFrame(loop);
}

export function burst(el, n) {
  const r = el.getBoundingClientRect();
  burstAt(r.left + r.width / 2, r.top + r.height / 2, n);
}
