// Overcast evening sky, fog, lights and lightning.
import * as THREE from 'three';

const SKY_VERT = `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const SKY_FRAG = `
uniform float uTime, uFlash;
uniform vec3 uTop, uHorizon, uGlow;
varying vec3 vDir;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, -0.2, 1.0);
  vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.55, h));
  vec2 uv = d.xz / max(0.12, d.y + 0.25) * 1.4 + vec2(uTime * 0.012, uTime * 0.004);
  float c = fbm(uv);
  float c2 = fbm(uv * 2.7 + 11.0);
  col *= 0.72 + 0.5 * c;
  col = mix(col, col * 0.6, smoothstep(0.55, 0.8, c2));
  col += uGlow * pow(1.0 - abs(h), 5.0) * (0.6 + 0.4 * c);
  col += vec3(0.75, 0.8, 0.95) * uFlash * (0.4 + c);
  gl_FragColor = vec4(col, 1.0);
}`;

export function buildSky(scene, renderer, { quality }) {
  const uniforms = {
    uTime: { value: 0 }, uFlash: { value: 0 },
    uTop: { value: new THREE.Color(0x3a4346) }, uHorizon: { value: new THREE.Color(0x8b948f) }, uGlow: { value: new THREE.Color(0x6c5a42) },
  };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({ uniforms, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false }));
  sky.renderOrder = -1;
  scene.add(sky);
  scene.fog = new THREE.FogExp2(0x6c7571, .0085);

  const hemi = new THREE.HemisphereLight(0xb8c4c0, 0x5e584c, 1.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xd8d4c4, 1.4);
  sun.position.set(-60, 90, 70);
  if (quality === 'high') {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 10, far: 260 });
    sun.shadow.bias = -.0004;
    sun.shadow.normalBias = .04;
  }
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9fb0b2, .7);
  fill.position.set(90, 30, -30);
  scene.add(fill);

  // environment map from a copy of the sky, so wet ground and glass have something to reflect
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(sky.geometry, sky.material));
  scene.environment = pm.fromScene(envScene, .02).texture;
  pm.dispose();

  // lightning: a flicker envelope that other systems read through `flash`
  let next = 6, strikeT = -10;
  const api = {
    flash: 0,
    strike(now) { strikeT = now; next = now + 9 + Math.random() * 10; },
    update(t) {
      uniforms.uTime.value = t;
      if (t > next) api.strike(t);
      const a = t - strikeT;
      api.flash = a < 0 ? 0 : a < .06 ? 1 : a < .12 ? .25 : a < .2 ? .9 : Math.max(0, Math.exp(-(a - .2) * 4) * .8);
      uniforms.uFlash.value = api.flash;
      hemi.intensity = 1.9 + api.flash * 3;
      sun.intensity = 1.4 + api.flash * 2;
    },
    justStruck: t => t - strikeT < .05,
  };
  return api;
}
