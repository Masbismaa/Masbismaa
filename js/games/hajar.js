// Round 1, "Hajar Bug": swipe through bugs crawling across the back wall. 30 seconds.
import { $, rand, store, fitCanvas } from '../util.js';
import { audio } from '../audio.js';
import { burst, burstAt } from '../fx.js';
import { beetle, sprayCan, server, image } from './sprites.js';

const NAMES = ['XSS', 'SQL Injection', 'NullPointer', '404', 'Race Condition', 'Memory Leak', 'CSRF', 'Off-by-one', 'Deadlock', 'Typo', 'N+1 Query', 'Undefined'];
const RANKS = [[0, 'Anak baru'], [15, 'Penghuni atap'], [35, 'Pemburu bug'], [60, 'Tukang debug'], [100, 'Penjaga atap']];
const WALL = image('assets/textures/wall.webp'), ART = image('assets/textures/graffiti.webp');

export function initHajar() {
  const canvas = $('hajar'), g = canvas.getContext('2d'), arena = $('hajarArena');
  let W = 0, H = 0, bg = null;
  const fit = () => { ({ w: W, h: H } = fitCanvas(canvas, arena)); bg = null; };
  fit(); addEventListener('resize', fit);
  WALL.addEventListener('load', () => { bg = null; }); ART.addEventListener('load', () => { bg = null; });

  let bugs = [], halves = [], pops = [], trail = [], rain = [];
  let state = 'idle', score = 0, combo = 1, lastHit = 0, timeLeft = 30, spawnT = 0, lastT = 0, boss = null, bossDone = false, bossBanner = 0;
  let best = +(store.get('mbp-hajar-best') || 0);
  $('hBest').textContent = best;

  const spawn = () => {
    const r = Math.random(), type = r < .1 ? 'can' : r < .22 ? 'prod' : 'bug', left = Math.random() < .5;
    bugs.push({ type, label: type === 'bug' ? NAMES[Math.floor(Math.random() * NAMES.length)] : type === 'can' ? '+5' : 'PROD', x: left ? -40 : W + 40, y: rand(H * .2, H * .85), vx: (left ? 1 : -1) * rand(1.1, 2.4) * (W / 900 + .4), vy: rand(-.5, .3), r: type === 'can' ? 18 : type === 'prod' ? 21 : 24, ph: rand(0, 6) });
  };

  const drawBackground = () => {
    if (!bg) {
      const d = Math.min(2, devicePixelRatio || 1);
      bg = document.createElement('canvas'); bg.width = W * d; bg.height = H * d;
      const k = bg.getContext('2d'); k.setTransform(d, 0, 0, d, 0, 0);
      k.fillStyle = '#56554f'; k.fillRect(0, 0, W, H);
      if (WALL.complete && WALL.naturalWidth) { k.globalAlpha = .9; k.fillStyle = k.createPattern(WALL, 'repeat'); k.fillRect(0, 0, W, H); k.globalAlpha = 1; }
      if (ART.complete && ART.naturalWidth) {
        k.globalAlpha = .55;
        k.drawImage(ART, 0, 0, 1024, 512, W * .08, H * .1, Math.min(420, W * .4), Math.min(210, W * .2));
        k.drawImage(ART, 1024, 512, 1024, 256, W * .45, H * .66, Math.min(460, W * .45), Math.min(115, W * .11));
        k.globalAlpha = 1;
      }
      const v = k.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
      k.fillStyle = v; k.fillRect(0, 0, W, H);
    }
    g.drawImage(bg, 0, 0, W, H);
  };

  const drawThing = (s, t, noLabel) => {
    const x = s.x, y = s.y + Math.sin(t / 240 + s.ph) * 3;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + s.r * 1.1, s.r * 1.1, s.r * .28, 0, 0, 7); g.fill();
    g.save(); g.translate(x, y);
    if (s.type === 'can') { g.rotate(Math.sin(t / 300 + s.ph) * .35 + .3); sprayCan(g, s.r); }
    else if (s.type === 'prod') server(g, s.r * 1.5, s.r * 1.9, t, s.ph);
    else { g.rotate(Math.atan2(s.vy, s.vx)); beetle(g, s.r, t, s.ph, '#2a2824', '#070707', '#a8352e'); }
    g.restore();
    if (noLabel) return;
    g.font = '500 11px "IBM Plex Mono", monospace'; g.textAlign = 'center';
    const w = g.measureText(s.label).width + 10, ly = y - s.r * 1.35 - 8;
    g.fillStyle = 'rgba(8,9,8,.72)'; g.fillRect(x - w / 2, ly - 11, w, 16);
    g.fillStyle = s.type === 'prod' ? '#e2574f' : s.type === 'can' ? '#e2c062' : '#e8e4d8';
    g.fillText(s.label, x, ly + 1);
  };

  const drawBoss = (b, t) => {
    const hurt = t - b.hitT < 120;
    g.save(); g.translate(b.x, b.y); g.rotate(b.ang || Math.PI);
    g.strokeStyle = hurt ? '#fff' : '#b8352c'; g.lineWidth = b.r * .1; g.lineCap = 'round';
    const snap = Math.sin(t / 120) * .25;
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(b.r * .95, sd * b.r * .15); g.quadraticCurveTo(b.r * 1.45, sd * b.r * (.5 + snap), b.r * 1.55, sd * b.r * (.05 + snap * .3)); g.stroke(); }
    beetle(g, b.r, t, 0, hurt ? '#d8d8d8' : '#1c1a17', '#000000', hurt ? '#ffffff' : '#b8352c');
    g.restore();
    const bw = b.r * 2.2;
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(b.x - bw / 2, b.y - b.r * 1.75, bw, 5);
    g.fillStyle = '#b8352c'; g.fillRect(b.x - bw / 2, b.y - b.r * 1.75, bw * b.hp / b.max, 5);
    g.font = '600 14px "Barlow Condensed", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#e8e4d8';
    g.fillText('BOS BUG', b.x, b.y - b.r * 1.95);
  };

  const segHit = (ax, ay, bx, by, cx, cy, r) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, k = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / l2)); return Math.hypot(ax + k * dx - cx, ay + k * dy - cy) < r; };
  const local = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };

  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture?.(e.pointerId); trail = [local(e)]; });
  canvas.addEventListener('pointermove', e => {
    const p = local(e); trail.push(p); if (trail.length > 14) trail.shift();
    if (state !== 'play' || trail.length < 2) return;
    const a = trail[trail.length - 2];
    if (Math.hypot(p.x - a.x, p.y - a.y) / Math.max(1, p.t - a.t) < .6) return;
    const t = performance.now(), R = canvas.getBoundingClientRect();
    if (boss && t - boss.hitT > 130 && segHit(a.x, a.y, p.x, p.y, boss.x, boss.y, boss.r * 1.1)) {
      boss.hp--; boss.hitT = t; audio.hit(260 + boss.hp * 30); burstAt(R.left + boss.x, R.top + boss.y, 10);
      pops.push({ x: boss.x + rand(-30, 30), y: boss.y - boss.r, txt: 'KENA', c: '#e2574f', life: 0 });
      if (boss.hp <= 0) { score += 50; bossDone = true; pops.push({ x: boss.x, y: boss.y, txt: '+50', c: '#e2c062', life: 0 }); burstAt(R.left + boss.x, R.top + boss.y, 50); audio.impact(); boss = null; }
      $('hScore').textContent = score;
    }
    for (let i = bugs.length - 1; i >= 0; i--) {
      const s = bugs[i];
      if (!segHit(a.x, a.y, p.x, p.y, s.x, s.y + Math.sin(t / 240 + s.ph) * 3, s.r + 8)) continue;
      bugs.splice(i, 1);
      if (s.type === 'prod') { score = Math.max(0, score - 10); combo = 1; audio.hit(120); pops.push({ x: s.x, y: s.y, txt: '-10', c: '#e2574f', life: 0 }); }
      else {
        combo = t - lastHit < 700 ? Math.min(8, combo + 1) : 1; lastHit = t;
        const gain = (s.type === 'can' ? 5 : 1) * combo; score += gain;
        audio.hit(s.type === 'can' ? 1200 : 480 + combo * 60);
        pops.push({ x: s.x, y: s.y, txt: '+' + gain, c: s.type === 'can' ? '#e2c062' : '#e8e4d8', life: 0 });
      }
      const ang = Math.atan2(p.y - a.y, p.x - a.x);
      for (const sd of [-1, 1]) halves.push({ ...s, sd, ang, vx: s.vx * .3 + Math.cos(ang + sd * Math.PI / 2) * 3, vy: Math.sin(ang + sd * Math.PI / 2) * 3 - 2, rot: 0, vr: sd * .08, life: 0 });
      burstAt(R.left + s.x, R.top + s.y, 8);
      $('hScore').textContent = score; $('hCombo').textContent = 'x' + combo;
    }
  });

  const drawHalf = (h, t) => {
    g.save(); g.translate(h.x, h.y); g.rotate(h.ang + h.rot);
    g.beginPath(); g.rect(-60, h.sd < 0 ? -60 : 0, 120, 60); g.clip();
    g.rotate(-h.ang - h.rot); g.globalAlpha = Math.max(0, 1 - h.life / 50);
    drawThing({ ...h, x: 0, y: 0 }, t, true); g.restore();
  };

  const start = () => {
    state = 'play'; score = 0; combo = 1; timeLeft = 30; bugs = []; halves = []; pops = []; spawnT = 0; lastT = performance.now(); boss = null; bossDone = false; bossBanner = 0;
    $('hScore').textContent = 0; $('hCombo').textContent = 'x1'; $('hTime').textContent = 30;
    $('hOverlay').hidden = true; $('hStart').textContent = 'Ulangi'; audio.impact();
  };
  const end = () => {
    state = 'over';
    if (score > best) { best = score; store.set('mbp-hajar-best', best); $('hBest').textContent = best; }
    $('hTitle').textContent = `Skor ${score}`;
    $('hMsg').innerHTML = `Gelar: <b>${RANKS.filter(r => score >= r[0]).pop()[1]}</b>. ${bossDone ? 'Bos bug tumbang.' : 'Bos bug lolos ke production.'} Rekor terbaikmu ${best}.`;
    boss = null; $('hStart2').textContent = 'Main lagi'; $('hOverlay').hidden = false; burst($('hStart2'), 20);
  };
  $('hStart').addEventListener('click', start);
  $('hStart2').addEventListener('click', start);

  function loop(t) {
    requestAnimationFrame(loop);
    if (canvas.offsetParent === null) return;
    const dt = Math.min(50, t - (lastT || t)); lastT = t;
    drawBackground();
    if (state === 'play') {
      timeLeft -= dt / 1000; spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = Math.max(260, 900 - (30 - timeLeft) * 18); }
      $('hTime').textContent = Math.max(0, Math.ceil(timeLeft));
      if (t - lastHit > 1200 && combo > 1) { combo = 1; $('hCombo').textContent = 'x1'; }
      if (!boss && !bossDone && timeLeft <= 12) { boss = { x: W + 90, y: H * .5, r: Math.min(62, W * .09 + 20), hp: 8, max: 8, hitT: 0 }; bossBanner = t; audio.thunder(); }
      if (boss) {
        const tx = W * .6 + Math.sin(t / 900) * W * .22, ty = H * .5 + Math.cos(t / 700) * H * .2, nx = boss.x + (tx - boss.x) * .03, ny = boss.y + (ty - boss.y) * .03;
        if (Math.hypot(nx - boss.x, ny - boss.y) > .2) boss.ang = Math.atan2(ny - boss.y, nx - boss.x);
        boss.x = nx; boss.y = ny;
      }
      if (timeLeft <= 0) end();
    } else if (state === 'idle' && bugs.length < 5 && Math.random() < .02) spawn();
    bugs.forEach(s => { s.x += s.vx * dt / 16; s.y += s.vy * dt / 16; });
    bugs = bugs.filter(s => s.x > -80 && s.x < W + 80);
    if (boss) {
      g.fillStyle = 'rgba(20,26,26,.35)'; g.fillRect(0, 0, W, H);
      if (rain.length < 110) rain.push({ x: rand(0, W + 100), y: rand(-H, 0), v: rand(9, 14) });
      g.strokeStyle = 'rgba(210,220,225,.4)'; g.lineWidth = 1;
      g.beginPath();
      rain.forEach(d => { d.y += d.v; d.x -= 2.2; if (d.y > H) { d.y = rand(-60, 0); d.x = rand(0, W + 100); } g.moveTo(d.x, d.y); g.lineTo(d.x - 3.5, d.y + 13); });
      g.stroke();
    } else rain = [];
    bugs.forEach(s => drawThing(s, t));
    if (boss) drawBoss(boss, t);
    halves.forEach(h => { h.life++; h.x += h.vx; h.y += h.vy; h.vy += .25; h.rot += h.vr; drawHalf(h, t); });
    halves = halves.filter(h => h.life < 50);
    pops.forEach(p => { p.life++; g.globalAlpha = 1 - p.life / 45; g.font = '700 24px "Barlow Condensed", sans-serif'; g.textAlign = 'center'; g.fillStyle = p.c; g.fillText(p.txt, p.x, p.y - p.life * .8); g.globalAlpha = 1; });
    pops = pops.filter(p => p.life < 45);
    if (bossBanner && t - bossBanner < 2200) {
      const k = (t - bossBanner) / 2200; g.globalAlpha = k < .1 ? k / .1 : k > .8 ? (1 - k) / .2 : 1;
      g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(0, H * .1 - 26, W, 40);
      g.font = `600 ${Math.max(16, Math.min(24, W * .03))}px "Barlow Condensed", sans-serif`; g.textAlign = 'center'; g.fillStyle = '#e8e4d8';
      g.fillText('Hujan makin deras. Bos bug datang.', W / 2, H * .1); g.globalAlpha = 1;
    }
    const now = performance.now(); trail = trail.filter(p => now - p.t < 150);
    if (trail.length > 1) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i], k = i / trail.length;
        g.strokeStyle = `rgba(232,228,216,${.18 * k})`; g.lineWidth = 18 * k; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        g.strokeStyle = `rgba(255,255,255,${.9 * k})`; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
    }
  }
  requestAnimationFrame(loop);
}
