// Round 2, "Lorong Sekolah": collect every code bolt in the locker hallway without getting caught.
import { $, store } from '../util.js';
import { audio } from '../audio.js';
import { burstAt } from '../fx.js';
import { beetle, sprayCan, image } from './sprites.js';

const MAP = [
  '###################',
  '#o.......#.......o#',
  '#.##.###.#.###.##.#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.#..BBB..#.####',
  '#....#.#####.#....#',
  '#.##.....P.....##.#',
  '#o.#.###.#.###.#.o#',
  '#.................#',
  '#.#######.#######.#',
  '###################',
];
const ROWS = MAP.length, COLS = MAP[0].length;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const SHELLS = ['#a8352e', '#8c9096', '#c9a23e', '#d8d4c6'];
const FLOOR = image('assets/textures/concrete.webp');

export function initLorong({ isVisible }) {
  const canvas = $('lorong'), g = canvas.getContext('2d'), wrap = $('lorongWrap');
  let TS = 24, hall = null, hallKey = '';
  const fit = () => {
    if (!wrap.clientWidth) return;
    TS = Math.max(12, Math.min(34, Math.floor((wrap.clientWidth - 20) / COLS)));
    const d = Math.min(2, devicePixelRatio || 1);
    canvas.width = COLS * TS * d; canvas.height = ROWS * TS * d;
    canvas.style.width = COLS * TS + 'px'; canvas.style.height = ROWS * TS + 'px';
    g.setTransform(d, 0, 0, d, 0, 0);
  };
  fit(); addEventListener('resize', fit);
  FLOOR.addEventListener('load', () => { hallKey = ''; });

  const all = ch => { const out = []; MAP.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) out.push([x, y]); })); return out; };
  const HOME = all('B'), START = all('P')[0];
  const wall = (x, y) => y < 0 || y >= ROWS || x < 0 || x >= COLS || MAP[y][x] === '#';
  const isHome = (x, y) => MAP[y] && MAP[y][x] === 'B';
  const mz = { state: 'idle', score: 0, lives: 3, level: 1, seeds: null, left: 0, player: null, bugs: [], fright: 0, chain: 0, last: 0, deadT: 0, best: +(store.get('mbp-lorong-best') || 0) };
  $('lBest').textContent = mz.best;

  const entity = (x, y, speed) => ({ tx: x, ty: y, dir: [0, 0], next: [0, 0], prog: 0, speed });
  const reset = full => {
    if (full) { mz.seeds = MAP.map(r => [...r].map(c => c === '.' ? 1 : c === 'o' ? 2 : 0)); mz.left = mz.seeds.flat().filter(Boolean).length; }
    mz.player = entity(START[0], START[1], 5.2);
    mz.bugs = HOME.concat([HOME[1]]).map(([x, y], i) => ({ ...entity(x, y, 3.6 + mz.level * .35), id: i, release: i * 2.2, eaten: false, ph: Math.random() * 6 }));
    mz.fright = 0; mz.chain = 0;
  };
  const hud = () => { $('lScore').textContent = mz.score; $('lLives').textContent = mz.lives; $('lLevel').textContent = mz.level; };
  const start = () => {
    mz.score = 0; mz.lives = 3; mz.level = 1; reset(true); hud();
    mz.state = 'play'; mz.last = performance.now(); $('lOverlay').hidden = true; $('lStart').textContent = 'Ulangi';
    audio.impact(); canvas.focus({ preventScroll: true });
  };
  const pause = () => { mz.state = 'paused'; $('lTitle').textContent = 'Dijeda'; $('lMsg').textContent = 'Lanjutkan kapan saja.'; $('lStart2').textContent = 'Lanjutkan'; $('lOverlay').hidden = false; };
  const over = () => {
    mz.state = 'over';
    if (mz.score > mz.best) { mz.best = mz.score; store.set('mbp-lorong-best', mz.best); $('lBest').textContent = mz.best; }
    $('lTitle').textContent = `Skor ${mz.score}`;
    $('lMsg').innerHTML = `Sampai level <b>${mz.level}</b>. Rekor terbaikmu ${mz.best}.`;
    $('lStart2').textContent = 'Main lagi'; $('lOverlay').hidden = false;
  };
  $('lStart').addEventListener('click', start);
  $('lStart2').addEventListener('click', () => { if (mz.state === 'paused') { mz.state = 'play'; mz.last = performance.now(); $('lOverlay').hidden = true; canvas.focus({ preventScroll: true }); } else start(); });

  const steer = d => { if (mz.player) mz.player.next = DIRS[d]; };
  addEventListener('keydown', e => {
    if (mz.state !== 'play' || !isVisible()) return;
    const k = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' }[e.code];
    if (!k) { if (e.code === 'KeyP' || e.code === 'Escape') pause(); return; }
    e.preventDefault(); steer(k);
  });
  document.querySelectorAll('.dpad [data-d]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); steer(b.dataset.d); }));
  let swipe = null;
  wrap.addEventListener('pointerdown', e => { swipe = [e.clientX, e.clientY]; });
  wrap.addEventListener('pointermove', e => {
    if (!swipe) return;
    const dx = e.clientX - swipe[0], dy = e.clientY - swipe[1];
    if (Math.hypot(dx, dy) < 22) return;
    steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    swipe = [e.clientX, e.clientY];
  });
  addEventListener('pointerup', () => { swipe = null; });

  const pos = e => [e.tx + e.dir[0] * e.prog, e.ty + e.dir[1] * e.prog];
  const opposite = (a, b) => a[0] === -b[0] && a[1] === -b[1] && (a[0] || a[1]);
  const move = (e, dt, decide, arrive) => {
    let step = e.speed * dt;
    while (step > 0) {
      if (e.prog === 0) { if (arrive) arrive(e); decide(e); if (!e.dir[0] && !e.dir[1]) return; }
      const need = 1 - e.prog;
      if (step >= need) { e.tx += e.dir[0]; e.ty += e.dir[1]; e.prog = 0; step -= need; } else { e.prog += step; step = 0; }
    }
  };
  const decidePlayer = e => {
    const n = e.next;
    if ((n[0] || n[1]) && !wall(e.tx + n[0], e.ty + n[1]) && !isHome(e.tx + n[0], e.ty + n[1])) e.dir = n;
    if (wall(e.tx + e.dir[0], e.ty + e.dir[1]) || isHome(e.tx + e.dir[0], e.ty + e.dir[1])) e.dir = [0, 0];
  };
  const decideBug = b => {
    const p = mz.player, opts = Object.values(DIRS).filter(d => !wall(b.tx + d[0], b.ty + d[1]));
    let choices = opts.filter(d => !opposite(d, b.dir)); if (!choices.length) choices = opts;
    let target;
    if (b.eaten) target = HOME[1];
    else if (mz.fright > 0 || Math.random() < .08) { b.dir = choices[Math.floor(Math.random() * choices.length)]; return; }
    else { target = [p.tx + p.dir[0] * b.id * 2, p.ty + p.dir[1] * b.id * 2]; if (b.id === 3 && Math.hypot(p.tx - b.tx, p.ty - b.ty) < 5) target = [1, ROWS - 2]; }
    choices.sort((a, c) => Math.hypot(b.tx + a[0] - target[0], b.ty + a[1] - target[1]) - Math.hypot(b.tx + c[0] - target[0], b.ty + c[1] - target[1]));
    b.dir = choices[0];
  };
  function eat(p) {
    const cell = mz.seeds && mz.seeds[p.ty] && mz.seeds[p.ty][p.tx];
    if (!cell || mz.state !== 'play') return;
    mz.seeds[p.ty][p.tx] = 0; mz.left--;
    if (cell === 1) { mz.score += 1; if (mz.score % 4 === 0) audio.tick(1600); }
    else { mz.score += 5; mz.fright = 6; mz.chain = 0; audio.ok(); mz.bugs.forEach(b => { if (!b.eaten) b.dir = [-b.dir[0], -b.dir[1]]; }); }
    hud();
    if (mz.left <= 0) { mz.level++; audio.ok(); reset(true); hud(); }
  }

  const drawHall = () => {
    const key = String(TS);
    if (key !== hallKey) {
      hallKey = key;
      const d = Math.min(2, devicePixelRatio || 1), w = COLS * TS, h = ROWS * TS;
      hall = document.createElement('canvas'); hall.width = w * d; hall.height = h * d;
      const k = hall.getContext('2d'); k.setTransform(d, 0, 0, d, 0, 0);
      k.fillStyle = '#4b4a45'; k.fillRect(0, 0, w, h);
      if (FLOOR.complete && FLOOR.naturalWidth) { k.save(); k.scale(.35, .35); k.fillStyle = k.createPattern(FLOOR, 'repeat'); k.globalAlpha = .75; k.fillRect(0, 0, w / .35, h / .35); k.restore(); }
      k.strokeStyle = 'rgba(0,0,0,.22)'; k.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) { k.beginPath(); k.moveTo(x * TS + .5, 0); k.lineTo(x * TS + .5, h); k.stroke(); }
      for (let y = 0; y <= ROWS; y++) { k.beginPath(); k.moveTo(0, y * TS + .5); k.lineTo(w, y * TS + .5); k.stroke(); }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        if (MAP[y][x] !== '#') continue;
        const X = x * TS, Y = y * TS;
        if (y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) { k.fillStyle = '#26261f'; k.fillRect(X, Y, TS, TS); continue; }
        k.fillStyle = '#5e6366'; k.fillRect(X + 1, Y + 1, TS - 2, TS - 2);
        k.fillStyle = '#44484b'; k.fillRect(X + TS / 2 - .5, Y + 2, 1, TS - 4);
        k.fillStyle = 'rgba(0,0,0,.35)';
        for (let i = 0; i < 3; i++) { k.fillRect(X + TS * .14, Y + TS * (.18 + i * .09), TS * .26, 1); k.fillRect(X + TS * .6, Y + TS * (.18 + i * .09), TS * .26, 1); }
        k.fillStyle = 'rgba(255,255,255,.1)'; k.fillRect(X + 1, Y + 1, TS - 2, 1.5);
        k.fillStyle = 'rgba(0,0,0,.35)'; k.fillRect(X + 1, Y + TS - 3, TS - 2, 2);
        if ((x * 7 + y * 3) % 11 === 0) { k.fillStyle = 'rgba(120,64,34,.45)'; k.fillRect(X + TS * .2, Y + TS * .5, TS * .5, TS * .35); }
      }
      k.fillStyle = '#a8352e'; HOME.forEach(([x, y]) => k.fillRect(x * TS + 2, y * TS + TS / 2 - 1, TS - 4, 2));
    }
    g.drawImage(hall, 0, 0, COLS * TS, ROWS * TS);
  };
  const drawSeed = (x, y, kind, t) => {
    const cx = x * TS + TS / 2, cy = y * TS + TS / 2;
    if (kind === 1) {
      const r = TS * .12; g.fillStyle = '#b9b6aa'; g.beginPath();
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + .5; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
      g.closePath(); g.fill(); g.fillStyle = '#3c3b37'; g.beginPath(); g.arc(cx, cy, r * .42, 0, 7); g.fill();
    } else { g.save(); g.translate(cx, cy); g.rotate(Math.sin(t / 300) * .3); sprayCan(g, TS * .3); g.restore(); }
  };
  const drawPlayer = (e, t) => {
    const [px, py] = pos(e), X = px * TS + TS / 2, Y = py * TS + TS / 2, r = TS * .44;
    const dx = e.dir[0] || 0, dy = e.dir[1] || (e.dir[0] ? 0 : 1), sw = (e.dir[0] || e.dir[1]) ? Math.sin(t / 60) : 0;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(X, Y + r * .8, r * .85, r * .26, 0, 0, 7); g.fill();
    g.save(); g.translate(X, Y); g.rotate(Math.atan2(dy, dx) - Math.PI / 2);
    g.fillStyle = '#161616'; for (const sd of [-1, 1]) g.fillRect(sd * r * .38 - r * .14, r * (.1 + sw * .25 * sd), r * .28, r * .55);
    g.fillStyle = '#0b0b0b'; g.strokeStyle = '#d6b04a'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(0, 0, r * .92, r * .58, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#0b0b0b'; g.beginPath(); g.arc(0, r * .22, r * .44, 0, 7); g.fill();
    g.fillStyle = '#2a2522'; g.beginPath(); g.arc(0, r * .24, r * .38, 0, 7); g.fill();
    g.restore();
  };
  const drawBug = (b, t) => {
    const [px, py] = pos(b), X = px * TS + TS / 2, Y = py * TS + TS / 2, r = TS * .36;
    if (b.eaten) {
      g.fillStyle = '#e8e4d8'; for (const s of [-1, 1]) { g.beginPath(); g.arc(X + s * r * .35, Y, r * .22, 0, 7); g.fill(); }
      g.fillStyle = '#111'; for (const s of [-1, 1]) { g.beginPath(); g.arc(X + s * r * .35 + b.dir[0] * r * .1, Y + b.dir[1] * r * .1, r * .1, 0, 7); g.fill(); }
      return;
    }
    const weak = mz.fright > 0, blink = weak && mz.fright < 2 && Math.floor(t / 180) % 2;
    g.save(); g.translate(X + (weak ? Math.sin(t / 30 + b.ph) * 1.2 : 0), Y); g.rotate(Math.atan2(b.dir[1] || 0, b.dir[0] || 1));
    beetle(g, r, t, b.ph, weak ? (blink ? '#ffffff' : '#3f4245') : SHELLS[b.id % 4], weak ? '#1a1b1d' : '#0b0b0b', weak ? null : '#141414');
    g.restore();
  };

  function loop(t) {
    requestAnimationFrame(loop);
    if (!isVisible()) { mz.last = t; return; }
    const dt = Math.min(.05, (t - (mz.last || t)) / 1000); mz.last = t;
    if (mz.state === 'play' && mz.player) {
      if (mz.deadT > 0) { mz.deadT -= dt; if (mz.deadT <= 0) { if (mz.lives <= 0) over(); else reset(false); } }
      else {
        move(mz.player, dt, decidePlayer, eat);
        if (mz.player.prog === 0) eat(mz.player);
        if (mz.fright > 0) mz.fright = Math.max(0, mz.fright - dt);
        const R = canvas.getBoundingClientRect();
        mz.bugs.forEach(b => {
          if (b.release > 0) { b.release -= dt; return; }
          b.homeOk = true;
          b.speed = b.eaten ? 9 : mz.fright > 0 ? 2.4 : 3.6 + mz.level * .35;
          move(b, dt, decideBug, e => { if (e.eaten && e.tx === HOME[1][0] && e.ty === HOME[1][1]) { e.eaten = false; e.release = 1; e.dir = [0, 0]; } });
          const [bx, by] = pos(b), [qx, qy] = pos(mz.player);
          if (!b.eaten && Math.hypot(bx - qx, by - qy) < .6) {
            if (mz.fright > 0) { b.eaten = true; mz.chain++; mz.score += 20 * 2 ** (mz.chain - 1); hud(); audio.hit(1100); burstAt(R.left + (bx + .5) * TS, R.top + (by + .5) * TS, 10); }
            else { mz.lives--; hud(); mz.deadT = 1.1; audio.impact(); burstAt(R.left + (qx + .5) * TS, R.top + (qy + .5) * TS, 14); }
          }
        });
      }
    }
    drawHall();
    if (mz.seeds) mz.seeds.forEach((row, y) => row.forEach((k, x) => { if (k) drawSeed(x, y, k, t); }));
    else MAP.forEach((row, y) => [...row].forEach((c, x) => { if (c === '.' || c === 'o') drawSeed(x, y, c === '.' ? 1 : 2, t); }));
    if (mz.player) { mz.bugs.forEach(b => drawBug(b, t)); if (!(mz.deadT > 0 && Math.floor(t / 100) % 2)) drawPlayer(mz.player, t); }
    if (mz.fright > 0) { g.fillStyle = 'rgba(168,53,46,.1)'; g.fillRect(0, 0, COLS * TS, ROWS * TS); }
  }
  requestAnimationFrame(loop);
  return { pause: () => { if (mz.state === 'play') pause(); }, refit: fit };
}
