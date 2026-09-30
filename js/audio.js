// Every sound is synthesised on the fly; nothing plays until the visitor turns sound on.
let ctx = null, on = false, rainNode = null;

const ensure = () => {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};
const noise = (len, brown) => {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = last * .97 + w * .03; d[i] = last * 7; } else d[i] = w; }
  return buf;
};
const env = (node, t, peak, attack, release) => {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + attack + release);
  node.connect(g).connect(ctx.destination);
  return g;
};

export const audio = {
  get on() { return on; },
  toggle() {
    on = !on;
    if (on && ensure()) {
      rainNode = ctx.createBufferSource(); rainNode.buffer = noise(2); rainNode.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = .4;
      const g = ctx.createGain(); g.gain.value = .05;
      rainNode.connect(bp).connect(g).connect(ctx.destination); rainNode.start();
    } else if (rainNode) { try { rainNode.stop(); } catch (e) {} rainNode = null; }
    return on;
  },
  thunder(delay = 0) {
    if (!on || !ensure()) return;
    const t = ctx.currentTime + delay, s = ctx.createBufferSource(); s.buffer = noise(3.2, true);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(800, t); lp.frequency.exponentialRampToValueAtTime(90, t + 3);
    s.connect(lp); env(lp, t, .9, .05, 3); s.start(t);
  },
  whoosh(len = .5) {
    if (!on || !ensure()) return;
    const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = noise(len);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .8; bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(2600, t + len * .5); bp.frequency.exponentialRampToValueAtTime(500, t + len);
    s.connect(bp); env(bp, t, .35, len * .4, len * .6); s.start(t);
  },
  impact() {
    if (!on || !ensure()) return;
    const t = ctx.currentTime, o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(38, t + .4);
    env(o, t, .7, .005, .45); o.start(t); o.stop(t + .5);
  },
  tick(f = 1800) {
    if (!on || !ensure()) return;
    const t = ctx.currentTime, o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    o.connect(hp); env(hp, t, .05, .001, .05); o.start(t); o.stop(t + .07);
  },
  hit(f = 520) {
    if (!on || !ensure()) return;
    const t = ctx.currentTime, o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .45, t + .12);
    env(o, t, .18, .002, .14); o.start(t); o.stop(t + .18);
  },
  ok() {
    if (!on || !ensure()) return;
    const t = ctx.currentTime;
    [392, 587].forEach((f, i) => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; env(o, t + i * .09, .1, .005, .35); o.start(t + i * .09); o.stop(t + i * .09 + .4); });
  },
};
