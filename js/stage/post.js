// Film look: ACES tone map, bleach-bypass style grade with green-teal shadows,
// motion blur for whip pans, chromatic fringe, grain, vignette, freeze-frame.
import * as THREE from 'three';

const FRAG = `
precision highp float;
uniform sampler2D tScene;
uniform vec2 uRes, uBlur;
uniform float uTime, uFlash, uFreeze, uFade, uExposure;
varying vec2 vUv;

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 fetch(vec2 uv) {
  vec2 c = uv - 0.5;
  float ca = 0.0018 + dot(c, c) * 0.006;
  return vec3(texture2D(tScene, uv + c * ca).r, texture2D(tScene, uv).g, texture2D(tScene, uv - c * ca).b);
}

void main() {
  vec3 col = vec3(0.0);
  float n = 1.0;
  if (length(uBlur) > 0.0005) {
    n = 0.0;
    for (int i = 0; i < 10; i++) { float k = float(i) / 9.0 - 0.5; col += fetch(vUv + uBlur * k); n += 1.0; }
  } else col = fetch(vUv);
  col = col / n * uExposure;
  col = aces(col);

  // grade: pull saturation, green-teal shadows, sickly warm highlights, crushed contrast
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, 0.62 - uFreeze * 0.45);
  col = mix(col, col * vec3(0.86, 1.02, 0.94), smoothstep(0.55, 0.0, l));
  col = mix(col, col * vec3(1.06, 1.03, 0.88), smoothstep(0.35, 1.0, l));
  col = clamp((col - 0.5) * (1.12 + uFreeze * 0.35) + 0.5, 0.0, 1.0);
  col = pow(col, vec3(1.0 / 2.2));

  vec2 c = vUv - 0.5;
  col *= mix(1.0, smoothstep(0.95, 0.25, length(c * vec2(uRes.x / uRes.y, 1.0) * 0.9)), 0.75);
  float g = hash(vUv * uRes + fract(uTime * 7.13) * 100.0) - 0.5;
  col += g * (0.07 + uFreeze * 0.05);
  col += uFlash * 0.18;
  col *= uFade;
  gl_FragColor = vec4(col, 1.0);
}`;

export function createPost(renderer) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const uniforms = {
    tScene: { value: target.texture }, uRes: { value: size.clone() }, uBlur: { value: new THREE.Vector2() },
    uTime: { value: 0 }, uFlash: { value: 0 }, uFreeze: { value: 0 }, uFade: { value: 0 }, uExposure: { value: 1.35 },
  };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms, fragmentShader: FRAG, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  }));
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(quad);
  return {
    uniforms,
    resize() { renderer.getDrawingBufferSize(size); target.setSize(size.x, size.y); uniforms.uRes.value.copy(size); },
    render(world, camera) {
      renderer.setRenderTarget(target);
      renderer.render(world, camera);
      renderer.setRenderTarget(null);
      renderer.render(scene, cam);
    },
  };
}
