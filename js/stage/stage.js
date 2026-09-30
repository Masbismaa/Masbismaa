// Puts the location together and runs the render loop.
import * as THREE from 'three';
import { loadTextures } from './textures.js';
import { buildWorld } from './world.js';
import { buildSky } from './sky.js';
import { buildRain } from './rain.js';
import { createPost } from './post.js';
import { createDirector } from './director.js';

export async function createStage(canvas, { reduce, onProgress = () => {} }) {
  const mobile = matchMedia('(max-width: 820px), (pointer: coarse)').matches;
  const quality = mobile ? 'low' : 'high';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.shadowMap.enabled = quality === 'high';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, .1, 1200);
  const T = await loadTextures(renderer, onProgress);
  const sky = buildSky(scene, renderer, { quality });
  const world = buildWorld(T, { quality });
  scene.add(world.group);
  const rain = buildRain(scene, { count: mobile ? 2600 : 5200 });
  const post = createPost(renderer);
  const director = createDirector(camera, { reduce });

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    post.resize();
  };
  addEventListener('resize', resize);

  let simT = 0, last = performance.now() / 1000, freezeUntil = 0, fadeTarget = 0, progressFn = () => 0, running = true;
  const listeners = { strike: [] };
  const u = post.uniforms;

  function frame() {
    if (!running) return;
    const now = performance.now() / 1000, dt = Math.min(.05, now - last);
    last = now;
    const frozen = now < freezeUntil;
    if (!frozen) {
      simT += dt;
      sky.update(simT);
      if (sky.justStruck(simT)) listeners.strike.forEach(f => f());
      rain.update(simT, camera, sky.flash);
      director.update(now, dt, progressFn());
      world.lights.sodium.intensity = 60 + Math.sin(now * 31) * 3 * (Math.random() < .03 ? 8 : 1);
    }
    u.uTime.value = now;
    u.uFlash.value = frozen ? 0 : sky.flash;
    u.uFreeze.value += ((frozen ? 1 : 0) - u.uFreeze.value) * (frozen ? .5 : .12);
    u.uBlur.value.copy(frozen ? new THREE.Vector2() : director.blur);
    u.uFade.value += (fadeTarget - u.uFade.value) * Math.min(1, dt * 1.4);
    post.render(scene, camera);
    requestAnimationFrame(frame);
  }
  resize();
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now() / 1000; requestAnimationFrame(frame); }
  });

  return {
    director,
    fadeIn() { fadeTarget = 1; },
    freeze(sec) { freezeUntil = performance.now() / 1000 + sec; },
    strike() { sky.strike(simT); },
    setProgress(fn) { progressFn = fn; },
    on(evt, f) { listeners[evt].push(f); },
    snapshot() { post.render(scene, camera); return canvas.toDataURL('image/jpeg', .9); },
  };
}
