// Rain as GPU line segments that live in a box around the camera.
import * as THREE from 'three';

const VERT = `
attribute vec3 aSeed;
attribute float aEnd;
uniform float uTime, uLen;
uniform vec3 uCam, uBox;
uniform vec2 uWind;
varying float vA;
void main() {
  vec3 p = aSeed * uBox;
  float speed = 16.0 + aSeed.x * 6.0;
  p.y = mod(p.y - uTime * speed, uBox.y);
  p.xz = mod(p.xz - uCam.xz + uBox.xz * 0.5 - uWind * (uBox.y - p.y) * 0.08, uBox.xz) + uCam.xz - uBox.xz * 0.5;
  p.y += uCam.y - uBox.y * 0.5;
  vec3 dir = normalize(vec3(uWind.x * 0.08, -1.0, uWind.y * 0.08));
  p -= dir * uLen * aEnd;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = (1.0 - aEnd * 0.85) * smoothstep(40.0, 2.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = `
uniform float uFlash;
varying float vA;
void main() { gl_FragColor = vec4(vec3(0.78, 0.82, 0.84) + uFlash * 0.4, vA * (0.2 + uFlash * 0.25)); }`;

export function buildRain(scene, { count }) {
  const seeds = new Float32Array(count * 2 * 3), ends = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const s = [Math.random(), Math.random(), Math.random()];
    seeds.set(s, i * 6); seeds.set(s, i * 6 + 3);
    ends[i * 2 + 1] = 1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  g.setAttribute('aEnd', new THREE.BufferAttribute(ends, 1));
  const uniforms = { uTime: { value: 0 }, uLen: { value: .42 }, uCam: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(44, 30, 44) }, uWind: { value: new THREE.Vector2(-1.6, .6) }, uFlash: { value: 0 } };
  const lines = new THREE.LineSegments(g, new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false }));
  lines.frustumCulled = false;
  scene.add(lines);
  return {
    update(t, cam, flash) { uniforms.uTime.value = t; uniforms.uCam.value.copy(cam.position); uniforms.uFlash.value = flash; },
  };
}
