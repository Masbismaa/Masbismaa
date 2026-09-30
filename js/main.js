// Boot order: page interactivity first (works without WebGL), then the 3D location and the opening sequence.
import { $, rand, reduceMotion } from './util.js';
import { audio } from './audio.js';
import { SUBTITLES } from './data.js';
import * as sections from './ui/sections.js';
import { initHajar } from './games/hajar.js';
import { initLorong } from './games/lorong.js';

const body = document.body;
let stage = null, introDone = false, active = null, progress = 0;

// ---------- page pieces ----------
sections.initJourney();
sections.initAlr();
sections.initProjects();
sections.initScan();
sections.initFlow();
sections.initTests();
sections.initCommit();
sections.initStack();
sections.initContact();

let gamesOnScreen = false;
new IntersectionObserver(([e]) => { gamesOnScreen = e.isIntersecting; }).observe($('main'));
initHajar();
const lorong = initLorong({ isVisible: () => gamesOnScreen && !$('paneLorong').hidden });
document.querySelectorAll('[data-pane]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-pane]').forEach(x => { x.setAttribute('aria-selected', x === b); $(x.dataset.pane).hidden = x !== b; });
  audio.tick();
  if (b.dataset.pane !== 'paneLorong') lorong.pause();
  dispatchEvent(new Event('resize'));
}));

$('soundBtn').addEventListener('click', e => {
  const on = audio.toggle();
  e.currentTarget.setAttribute('aria-pressed', on);
  e.currentTarget.textContent = on ? 'Suara nyala' : 'Suara mati';
});

// ---------- timecode in the corner, 24 frames per second ----------
const t0 = performance.now();
(function tc() {
  const f = Math.floor((performance.now() - t0) / 1000 * 24), p = n => String(n).padStart(2, '0');
  $('timecode').textContent = `${p(Math.floor(f / 86400))}:${p(Math.floor(f / 1440) % 60)}:${p(Math.floor(f / 24) % 60)}:${p(f % 24)}`;
  requestAnimationFrame(tc);
})();

// ---------- subtitles while the opening shot is on screen ----------
let subI = 0;
setInterval(() => {
  const el = $('subtitle');
  if (!introDone || active?.id !== 'pembuka') { el.classList.remove('on'); return; }
  el.classList.remove('on');
  setTimeout(() => { el.textContent = SUBTITLES[subI++ % SUBTITLES.length]; el.classList.add('on'); }, 350);
}, 3600);

// ---------- which section is in the middle of the screen decides the shot ----------
const scenes = [...document.querySelectorAll('[data-shot]')];
function track() {
  const mid = innerHeight * .5;
  for (const s of scenes) {
    const r = s.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) {
      progress = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      if (s !== active) enter(s);
      return;
    }
  }
}
function enter(s) {
  active = s;
  body.dataset.side = s.dataset.side || 'left';
  s.classList.remove('cut'); void s.offsetWidth; if (introDone) s.classList.add('cut');
  document.querySelectorAll('.hud-nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + s.id));
  if (introDone && stage) stage.director.go(s.dataset.shot);
}
addEventListener('scroll', track, { passive: true });
addEventListener('resize', track);
track();

// ---------- the 3D location ----------
const sleepOr = (ms, skip) => new Promise(r => { const id = setTimeout(r, ms); skip.then(() => { clearTimeout(id); r(); }); });

async function intro() {
  let skipNow;
  const skipped = new Promise(r => { skipNow = r; });
  let wasSkipped = false;
  const skip = () => { wasSkipped = true; skipNow(); };
  const events = ['wheel', 'touchmove', 'keydown', 'pointerdown'];
  events.forEach(ev => addEventListener(ev, skip, { once: true, passive: true }));

  body.classList.remove('is-loading');
  if (reduceMotion || scrollY > innerHeight * .4) wasSkipped = true;
  if (!wasSkipped) {
    body.classList.add('is-intro');
    stage.director.set('aerial');
    stage.fadeIn();
    await sleepOr(700, skipped);
    $('credit').classList.add('on');
    await sleepOr(3000, skipped);
    $('credit').classList.remove('on');
  }
  if (!wasSkipped) {
    stage.director.go('hero', { type: 'crash' });
    audio.whoosh(.5);
    await sleepOr(620, skipped);
  }
  if (!wasSkipped) {
    stage.freeze(1.5);
    audio.impact();
    $('namecard').classList.add('on');
    await sleepOr(1600, skipped);
  }
  $('namecard').classList.remove('on');
  events.forEach(ev => removeEventListener(ev, skip));
  if (wasSkipped) { stage.fadeIn(); stage.director.set(active ? active.dataset.shot : 'hero'); }
  body.classList.remove('is-intro');
  body.classList.add('is-ready');
  introDone = true;
  track();
}

function noStage() {
  body.classList.remove('is-loading');
  body.classList.add('no-webgl', 'is-ready');
  introDone = true;
}

async function boot() {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return noStage();
  try {
    const { createStage } = await import('./stage/stage.js');
    stage = await createStage($('stage'), { reduce: reduceMotion, onProgress: p => { $('loadBar').style.transform = `scaleX(${p})`; } });
  } catch (err) {
    console.error(err);
    return noStage();
  }
  stage.setProgress(() => progress);
  stage.on('strike', () => audio.thunder(rand(.2, .8)));
  stage.director.onMove(kind => {
    if (kind === 'whip') audio.whoosh(.45);
    else if (kind === 'cut') audio.tick(260);
    else if (kind === 'dollyzoom' || kind === 'crane') audio.whoosh(1.4);
  });
  $('strikeBtn').addEventListener('click', () => stage.strike());
  intro();
}
boot();
