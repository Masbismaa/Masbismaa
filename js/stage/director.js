// Camera work. Every section of the page asks for a shot; the director moves there
// with a camera move that fits: crash zoom, hard cut, whip pan, dolly, dolly zoom, crane.
import * as THREE from 'three';

export const SHOTS = {
  aerial: { pos: [-62, 46, 84], look: [0, 5, 10], fov: 34, shake: .12, drift: [10, -6, -8] },
  hero: { pos: [44, 1.35, 23], look: [12, 7.5, 0], fov: 50, shake: .9, drift: [-3, .3, -3], enter: 'crash' },
  roof: { pos: [-8, 16.1, 4.4], look: [26, 15.6, 1.5], fov: 46, shake: .55, drift: [3, 0, 0], enter: 'cut' },
  facade: { pos: [-26, 1.6, 12.5], look: [14, 4.6, 5], fov: 38, shake: .35, drift: [9, 0, 0], enter: 'dolly' },
  shed: { pos: [27.5, 1.45, 37], look: [35.5, 1.5, 31.4], fov: 40, shake: .5, drift: [1.5, 0, -1.2], enter: 'whip' },
  gate: { pos: [10, 2.1, 64], look: [2, 7.5, 0], fov: 34, shake: .25, drift: [0, 0, -8], enter: 'dollyzoom' },
  wall: { pos: [-3, 1.25, 41.5], look: [-13, 1.3, 50], fov: 44, roll: -.14, shake: .7, drift: [-2, 0, 1], enter: 'whip' },
  yard: { pos: [2, 34, 36], look: [0, 0, 22], fov: 48, shake: .2, drift: [0, -4, -2], enter: 'crane' },
  stairs: { pos: [27, 2.2, 15], look: [19, 17.5, -1], fov: 46, roll: .1, shake: .45, drift: [-2, 0, -1], enter: 'dolly' },
  window: { pos: [1.5, 8.6, 19], look: [4.5, 9.4, 0], fov: 34, shake: .3, drift: [0, 0, -4], enter: 'cut' },
  tank: { pos: [-3.5, 15.7, 4.2], look: [-14, 18.2, -1.5], fov: 42, shake: .5, drift: [-1.5, 0, 0], enter: 'whip' },
  endwall: { pos: [45, 1.6, 7], look: [32.4, 3.8, .6], fov: 42, shake: .4, drift: [-3, 0, 1.5], enter: 'dolly' },
  outro: { pos: [-68, 52, 92], look: [0, 6, 10], fov: 34, shake: .1, drift: [-10, 8, 12], enter: 'crane' },
};

const DUR = { crash: .6, cut: 0, whip: .62, dolly: 1.9, dollyzoom: 2.2, crane: 2.8 };
const ease = {
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  inQuart: t => t * t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
};
const v3 = a => new THREE.Vector3(...a);

export function createDirector(camera, { reduce }) {
  const pose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40, roll: 0 };
  let shotId = null, shot = null, tr = null, impulse = 0, overshoot = 0, drift = 0;
  const prevDir = new THREE.Vector3(), dir = new THREE.Vector3(), blur = new THREE.Vector2();
  const listeners = [];

  const base = (s, p = 0) => ({ pos: v3(s.pos).addScaledVector(v3(s.drift || [0, 0, 0]), p), look: v3(s.look), fov: s.fov, roll: s.roll || 0 });
  const copy = src => ({ pos: src.pos.clone(), look: src.look.clone(), fov: src.fov, roll: src.roll });
  const lerpPose = (a, b, k) => ({ pos: a.pos.clone().lerp(b.pos, k), look: a.look.clone().lerp(b.look, k), fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k });
  const yawAround = (p, ang) => { const d = p.look.clone().sub(p.pos); d.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang); return { ...p, look: p.pos.clone().add(d) }; };

  function go(id, { type, now = performance.now() / 1000 } = {}) {
    if (!SHOTS[id] || id === shotId) return;
    const kind = reduce ? 'dolly' : (type || SHOTS[id].enter || 'dolly');
    const from = shotId ? copy(pose) : null;
    shotId = id; shot = SHOTS[id]; drift = 0;
    if (!from || kind === 'cut') { Object.assign(pose, copy(base(shot))); tr = null; impulse = Math.max(impulse, kind === 'cut' ? .7 : 0); listeners.forEach(f => f('cut', id)); return; }
    tr = { from, kind, t0: now, dur: reduce ? 1 : DUR[kind], dir: Math.random() < .5 ? -1 : 1 };
    listeners.forEach(f => f(kind, id));
  }

  function update(now, dt, progress) {
    if (!shot) return;
    drift += (progress - drift) * Math.min(1, dt * 2.2);
    const target = base(shot, drift);
    let p = target;
    if (tr) {
      const k = Math.min(1, (now - tr.t0) / tr.dur);
      const f = tr.from;
      if (tr.kind === 'crash') {
        p = lerpPose(f, target, ease.inQuart(k));
        p.fov = f.fov + (target.fov * .72 - f.fov) * ease.inQuart(k);
      } else if (tr.kind === 'whip') {
        p = k < .5 ? yawAround(f, ease.inCubic(k / .5) * 1.25 * tr.dir) : yawAround(target, -(1 - ease.outCubic((k - .5) / .5)) * 1.25 * tr.dir);
      } else if (tr.kind === 'dollyzoom') {
        const d1 = target.pos.distanceTo(target.look), back = target.look.clone().sub(target.pos).normalize().multiplyScalar(-30);
        const start = { ...target, pos: target.pos.clone().add(back), fov: 2 * Math.atan(Math.tan(target.fov * Math.PI / 360) * d1 / (d1 + 30)) * 180 / Math.PI };
        p = k < .25 ? lerpPose(f, start, ease.inOut(k / .25)) : (() => {
          const kk = ease.inOut((k - .25) / .75), pos = start.pos.clone().lerp(target.pos, kk), d = pos.distanceTo(target.look);
          return { pos, look: target.look.clone(), fov: 2 * Math.atan(Math.tan(target.fov * Math.PI / 360) * d1 / d) * 180 / Math.PI, roll: target.roll * kk };
        })();
      } else if (tr.kind === 'crane') {
        p = lerpPose(f, target, ease.inOut(k));
        p.pos.y += Math.sin(Math.PI * k) * 14;
      } else p = lerpPose(f, target, ease.inOut(k));
      if (k >= 1) {
        if (tr.kind === 'crash') { impulse = 1.2; overshoot = 1; }
        tr = null;
      }
    }
    // after a crash zoom the lens settles with a little overshoot
    if (overshoot > 0) { overshoot = Math.max(0, overshoot - dt * 2.4); p.fov = target.fov * (1 - .28 * Math.sin(overshoot * Math.PI / 2) * overshoot); }
    Object.assign(pose, { pos: p.pos, look: p.look, fov: p.fov, roll: p.roll });
    apply(now, dt);
  }

  function apply(now, dt) {
    const s = reduce ? 0 : (shot.shake || 0) * .6 + impulse;
    impulse = Math.max(0, impulse - dt * 1.8);
    const hx = (Math.sin(now * 1.3) * .6 + Math.sin(now * 2.9 + 1) * .3 + Math.sin(now * 7.1) * impulse * .5) * s;
    const hy = (Math.sin(now * 1.7 + 2) * .5 + Math.sin(now * 3.7) * .3 + Math.cos(now * 8.3) * impulse * .5) * s;
    camera.position.copy(pose.pos);
    const aspect = camera.aspect;
    camera.fov = pose.fov * (aspect < 1 ? 1.5 : aspect < 1.4 ? 1.18 : 1);
    camera.updateProjectionMatrix();
    camera.lookAt(pose.look);
    camera.rotateX(hy * .006);
    camera.rotateY(hx * .008);
    camera.rotateZ(pose.roll + hx * .004);
    // motion blur follows how fast the view direction is sweeping across the screen
    camera.getWorldDirection(dir);
    if (dt > 0) {
      const d = dir.clone().sub(prevDir).applyQuaternion(camera.quaternion.clone().invert());
      blur.set(-d.x, d.y).multiplyScalar(Math.min(1, .016 / dt) * 1.4);
      if (blur.length() > .08) blur.setLength(.08);
    }
    prevDir.copy(dir);
  }

  return {
    go, update, blur, SHOTS,
    get shot() { return shotId; },
    get busy() { return !!tr; },
    onMove(f) { listeners.push(f); },
    set(id) { shotId = null; shot = null; go(id, { type: 'cut' }); impulse = 0; },
  };
}
