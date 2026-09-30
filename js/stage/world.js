// The location: an old concrete high school on a rainy evening.
// Units are metres. The main block faces +z onto a dirt schoolyard; a wing closes the yard on the left.
import * as THREE from 'three';
import { tiled } from './textures.js';

const GRAFFITI = { // pixel rects inside graffiti.webp (2048 x 1024), mirrors tools/textures.py
  mbp: [0, 0, 1024, 512], bisma: [1024, 0, 1024, 256], stencil: [1024, 256, 1024, 256],
  tags: [0, 512, 512, 512], bug: [512, 512, 512, 512], jumat: [1024, 512, 1024, 256],
  tally: [1024, 768, 512, 256], prod: [1536, 768, 512, 256],
};
const FLOOR_H = 3.6, BAY = 3.6;

export function buildWorld(T, { quality }) {
  const world = new THREE.Group();
  const M = materials(T);
  const shadows = quality === 'high';
  const add = (mesh, parent = world) => { mesh.castShadow = shadows; mesh.receiveShadow = shadows; parent.add(mesh); return mesh; };

  // ---------- ground ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), M.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = shadows;
  world.add(ground);
  add(box(66, .12, 4, M.slab, 2.4), world).position.set(0, .06, 8);
  puddles(world, M);
  add(box(4, .12, 40, M.slab, 2.4), world).position.set(-31, .06, 14);

  // ---------- school blocks ----------
  const main = block({ len: 18 * BAY, floors: 4, depth: 12, M, add, row: 0 });
  world.add(main);
  const wing = block({ len: 11 * BAY, floors: 3, depth: 12, M, add, row: 1 });
  wing.rotation.y = Math.PI / 2;
  wing.position.set(-39.6, 0, 14);
  world.add(wing);

  // graffiti on the ends of the main block and on the wing's ground floor
  decal(world, M, 'mbp', 9, 4.5, [32.45, 3.2, 0], Math.PI / 2);
  decal(world, M, 'bisma', 7, 1.75, [32.46, 6.6, -2.4], Math.PI / 2);
  decal(world, M, 'tags', 3.2, 3.2, [32.46, 1.7, 4.2], Math.PI / 2);
  decal(world, M, 'stencil', 6, 1.5, [-32.45, 2.2, 1], -Math.PI / 2);
  decal(world, M, 'bug', 2.6, 2.6, [6, .55, 6.04], 0, .9);

  // ---------- roof: parapet fence, stair house, water tank ----------
  const roofY = 4 * FLOOR_H;
  fenceRun(world, M, add, [-32.2, roofY + 1.05, 5.85], [32.2, roofY + 1.05, 5.85]);
  fenceRun(world, M, add, [32.2, roofY + 1.05, 5.85], [32.2, roofY + 1.05, -5.85]);
  fenceRun(world, M, add, [-32.2, roofY + 1.05, -5.85], [-32.2, roofY + 1.05, 5.85]);
  const stair = add(box(6, 3.4, 4.6, M.wall, 3.6));
  stair.position.set(18, roofY + 1.7, -2);
  add(box(6.6, .22, 5.2, M.slab, 2.4)).position.set(18, roofY + 3.5, -2);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.1), M.door);
  door.position.set(17, roofY + 1.05, .31);
  world.add(door);
  const exit = new THREE.Mesh(new THREE.BoxGeometry(.5, .18, .06), new THREE.MeshBasicMaterial({ color: 0x46e08c, fog: false }));
  exit.position.set(17, roofY + 2.4, .34);
  world.add(exit);
  decal(world, M, 'tally', 1.8, .9, [19.6, roofY + 1.8, .32], 0);
  decal(world, M, 'prod', 2.6, 1.3, [21, roofY + 1.6, -2], Math.PI / 2);
  const tank = add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 3, 28), M.metal));
  tank.position.set(-14, roofY + 4, -1.5);
  const cap = add(new THREE.Mesh(new THREE.ConeGeometry(1.7, .7, 28), M.metal));
  cap.position.set(-14, roofY + 5.85, -1.5);
  for (const [dx, dz] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) {
    add(box(.14, 2.5, .14, M.metal, 1)).position.set(-14 + dx, roofY + 1.25, -1.5 + dz);
  }
  for (let i = 0; i < 5; i++) add(box(1.1, .8, .7, M.metal, 1)).position.set(-24 + i * 2.2, roofY + .4, -4.5);

  // ---------- perimeter wall with a gate, shed, goal ----------
  wallRun(world, M, add, -62, 50, 6, 50);
  wallRun(world, M, add, 14, 50, 62, 50);
  wallRun(world, M, add, 46, -12, 46, 50);
  for (const x of [6, 14]) add(box(.8, 2.8, .8, M.slab, 2.4)).position.set(x, 1.4, 50);
  decal(world, M, 'jumat', 8, 2, [-12, 1.25, 49.86], Math.PI);
  decal(world, M, 'tags', 2.2, 2.2, [-24, 1.1, 49.86], Math.PI);
  decal(world, M, 'mbp', 5, 2.5, [30, 1.2, 49.86], Math.PI, .85);
  decal(world, M, 'stencil', 5, 1.25, [45.86, 1.3, 20], -Math.PI / 2);

  const shed = add(box(5, 3, 7, M.wall, 3.6));
  shed.position.set(38, 1.5, 32);
  add(box(5.6, .18, 7.6, M.slab, 2.4)).position.set(38, 3.05, 32);
  const shutter = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.5), M.shutter);
  shutter.rotation.y = -Math.PI / 2;
  shutter.position.set(35.48, 1.25, 32);
  world.add(shutter);
  decal(world, M, 'prod', 2.4, 1.2, [35.47, 2.55, 29.4], -Math.PI / 2);
  decal(world, M, 'bug', 1.6, 1.6, [35.47, 1, 35.2], -Math.PI / 2, .9);

  const goal = new THREE.Group();
  const pipe = (len, x, y, z, rx = 0, rz = 0) => { const p = add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, len, 8), M.goal), goal); p.position.set(x, y, z); p.rotation.set(rx, 0, rz); };
  pipe(2.4, -3.6, 1.2, 0); pipe(2.4, 3.6, 1.2, 0); pipe(7.2, 0, 2.4, 0, 0, Math.PI / 2);
  pipe(2.6, -3.6, 1.2, -1.2, .5); pipe(2.6, 3.6, 1.2, -1.2, .5);
  goal.position.set(-6, 0, 45);
  world.add(goal);

  // ---------- utility poles and sagging wires outside the wall ----------
  const poles = [];
  for (let x = -84; x <= 84; x += 24) {
    const p = add(new THREE.Mesh(new THREE.CylinderGeometry(.14, .2, 11, 10), M.pole));
    p.position.set(x, 5.5, 56);
    add(box(2.2, .14, .14, M.pole, 1)).position.set(x, 10, 56);
    poles.push(x);
  }
  const wireMat = new THREE.LineBasicMaterial({ color: 0x141515 });
  for (let i = 0; i < poles.length - 1; i++) {
    for (const off of [-.9, 0, .9]) {
      const a = new THREE.Vector3(poles[i] + off, 10.05, 56), b = new THREE.Vector3(poles[i + 1] + off, 10.05, 56);
      const mid = a.clone().lerp(b, .5); mid.y -= .9;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(16)), wireMat));
    }
  }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.18, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb35c, fog: false }));
  lamp.position.set(12, 9.2, 55.2);
  world.add(lamp);
  const sodium = new THREE.PointLight(0xff9a3c, 60, 36, 1.6);
  sodium.position.set(12, 9, 54.6);
  world.add(sodium);

  // ---------- distant town and hills (mostly fog) ----------
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M.city, 90);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), rnd = mulberry(7);
  for (let i = 0; i < 90; i++) {
    const a = rnd() * Math.PI * 2, r = 170 + rnd() * 190;
    const w = 14 + rnd() * 26, h = 8 + rnd() * rnd() * 48, d = 12 + rnd() * 20;
    m4.compose(new THREE.Vector3(Math.cos(a) * r, h / 2, Math.sin(a) * r + 20), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 3), new THREE.Vector3(w, h, d));
    city.setMatrixAt(i, m4);
  }
  world.add(city);
  for (let i = 0; i < 7; i++) {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(90 + i * 12, 55 + (i % 3) * 20, 7), M.hill);
    const a = -2.4 + i * .55;
    hill.position.set(Math.cos(a) * 360, 20, Math.sin(a) * 360);
    world.add(hill);
  }

  return { group: world, lights: { sodium }, exitSign: exit };
}

// Irregular puddles scattered over the yard; they reflect the sky through the environment map.
function puddles(world, M) {
  const rnd = mulberry(21);
  for (let i = 0; i < 22; i++) {
    const n = 18, pts = [];
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, r = .7 + rnd() * .45 + Math.sin(a * 3 + i) * .12; pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
    const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), M.puddle);
    const s = .8 + rnd() * 2.6;
    m.scale.set(s * (1 + rnd()), s, 1);
    m.rotation.set(-Math.PI / 2, 0, rnd() * Math.PI);
    m.position.set(-28 + rnd() * 70, .02, 11 + rnd() * 36);
    m.receiveShadow = true;
    world.add(m);
  }
}

// A school block: body, recessed window bands, spandrels, eaves, pillars, roof slab, parapet.
function block({ len, floors, depth, M, add, row }) {
  const g = new THREE.Group();
  const H = floors * FLOOR_H, front = depth / 2;
  const body = add(box(len, H, depth - .6, M.wall, 3.6), g);
  body.position.set(0, H / 2, -.3);
  for (let f = 0; f < floors; f++) {
    const y0 = f * FLOOR_H;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.9), M.windows);
    const v0 = 1 - ((f + row) % 4 + 1) / 4, v1 = v0 + .25, u = len / (4 * BAY);
    win.geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, v1, u, v1, 0, v0, u, v0], 2));
    win.position.set(0, y0 + 1.95, front - .29);
    g.add(win);
    add(box(len, 1.0, .3, M.wall, 3.6), g).position.set(0, y0 + .5, front - .15);
    add(box(len, .7, .3, M.wall, 3.6), g).position.set(0, y0 + 3.25, front - .15);
    add(box(len + .4, .16, .9, M.slab, 2.4), g).position.set(0, y0 + 2.95, front + .3);
    add(box(len, .08, .18, M.slab, 2.4), g).position.set(0, y0 + 1.0, front + .06);
    for (let k = 0; k <= len / BAY; k++) add(box(.42, 1.9, .3, M.slab, 2.4), g).position.set(-len / 2 + k * BAY + .2, y0 + 1.95, front - .15);
  }
  add(box(len + .2, .3, depth + .2, M.slab, 2.4), g).position.set(0, H + .15, 0);
  add(box(len + .4, 1.0, .25, M.slab, 2.4), g).position.set(0, H + .8, front);
  add(box(len + .4, 1.0, .25, M.slab, 2.4), g).position.set(0, H + .8, -front);
  add(box(.25, 1.0, depth, M.slab, 2.4), g).position.set(len / 2 + .1, H + .8, 0);
  add(box(.25, 1.0, depth, M.slab, 2.4), g).position.set(-len / 2 - .1, H + .8, 0);
  return g;
}

function fenceRun(world, M, add, a, b) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B), h = 2.4;
  const mat = M.fence.clone();
  mat.map = tiled(M.fence.map, len / 1.1, h / 1.1);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, h), mat);
  mesh.position.copy(A).lerp(B, .5).setY(A.y + h / 2);
  mesh.rotation.y = Math.atan2(-(B.z - A.z), B.x - A.x);
  mesh.castShadow = true;
  world.add(mesh);
  const n = Math.ceil(len / 3);
  for (let i = 0; i <= n; i++) {
    const p = A.clone().lerp(B, i / n);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, h + .1, 6), M.pole)).position.set(p.x, A.y + h / 2, p.z);
  }
  const rail = add(new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, len, 6), M.pole));
  rail.position.copy(A).lerp(B, .5).setY(A.y + h);
  rail.rotation.z = Math.PI / 2;
  rail.rotation.y = mesh.rotation.y;
}

function wallRun(world, M, add, x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const w = add(box(len, 2.2, .25, M.wall, 3.6));
  w.position.set((x0 + x1) / 2, 1.1, (z0 + z1) / 2);
  w.rotation.y = Math.atan2(-(z1 - z0), x1 - x0);
  const capM = add(box(len, .12, .4, M.slab, 2.4));
  capM.position.set(w.position.x, 2.26, w.position.z);
  capM.rotation.y = w.rotation.y;
}

function decal(world, M, key, w, h, pos, rotY, opacity = 1) {
  const [x, y, pw, ph] = GRAFFITI[key];
  const g = new THREE.PlaneGeometry(w, h);
  const u0 = x / 2048, u1 = (x + pw) / 2048, v1 = 1 - y / 1024, v0 = 1 - (y + ph) / 1024;
  g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v1, u1, v1, u0, v0, u1, v0], 2));
  const mat = opacity === 1 ? M.decal : Object.assign(M.decal.clone(), { opacity });
  const m = new THREE.Mesh(g, mat);
  m.position.set(...pos);
  m.rotation.y = rotY;
  m.receiveShadow = true;
  world.add(m);
}

// BoxGeometry with UVs scaled to real size, so texel density is the same on every face.
function box(w, h, d, mat, tile) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i;
    uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile);
  }
  return new THREE.Mesh(g, mat);
}

function materials(T) {
  const std = o => new THREE.MeshStandardMaterial(o);
  return {
    wall: std({ map: T.wall, roughnessMap: T.wallRough, bumpMap: T.concreteBump, bumpScale: .04, color: 0xa9a79e }),
    slab: std({ map: T.concrete, roughnessMap: T.concreteRough, bumpMap: T.concreteBump, bumpScale: .04, color: 0xa4a39b }),
    windows: std({ map: T.windows, emissiveMap: T.windowsEmit, emissive: 0xffe9c4, emissiveIntensity: .75, roughnessMap: T.windowsRough, metalness: .35, envMapIntensity: 1.3 }),
    ground: std({ map: tiled(T.ground, 48, 48), roughnessMap: tiled(T.groundRough, 48, 48), bumpMap: tiled(T.groundBump, 48, 48), bumpScale: .05, envMapIntensity: .55 }),
    fence: std({ map: T.fence, alphaTest: .45, side: THREE.DoubleSide, metalness: .6, roughness: .45, color: 0x9a9e9a }),
    metal: std({ map: T.metal, roughnessMap: T.metalRough, metalness: .45 }),
    pole: std({ color: 0x3a3c3b, roughness: .7, metalness: .3 }),
    goal: std({ color: 0xb8b8b0, roughness: .6, metalness: .2 }),
    door: std({ color: 0x1f2221, roughness: .5, metalness: .6 }),
    shutter: std({ map: T.shutter, bumpMap: T.shutterBump, bumpScale: .08, metalness: .5, roughness: .55 }),
    decal: std({ map: T.graffiti, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, roughness: .75 }),
    city: std({ color: 0x2a2e2e, roughness: .9, emissiveMap: tiled(T.windowsEmit, 3, 6), emissive: 0xffd9a0, emissiveIntensity: .7, map: tiled(T.windows, 3, 6) }),
    hill: new THREE.MeshLambertMaterial({ color: 0x2c3431 }),
    puddle: std({ color: 0x0f1111, roughness: .14, metalness: 0, envMapIntensity: .45, polygonOffset: true, polygonOffsetFactor: -1 }),
  };
}

function mulberry(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
