// Loads every texture the scene needs and reports progress for the loader screen.
import * as THREE from 'three';

const FILES = {
  concrete: ['concrete', true], concreteRough: ['concrete_rough'], concreteBump: ['concrete_bump'],
  wall: ['wall', true], wallRough: ['wall_rough'],
  windows: ['windows', true], windowsEmit: ['windows_emit', true], windowsRough: ['windows_rough'],
  ground: ['ground', true], groundRough: ['ground_rough'], groundBump: ['ground_bump'],
  fence: ['fence', true], metal: ['metal', true], metalRough: ['metal_rough'],
  shutter: ['shutter', true], shutterBump: ['shutter_bump'],
  graffiti: ['graffiti', true],
};

export function loadTextures(renderer, onProgress) {
  const loader = new THREE.TextureLoader();
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const keys = Object.keys(FILES);
  let done = 0;
  const out = {};
  return Promise.all(keys.map(key => new Promise(resolve => {
    const [name, color] = FILES[key];
    loader.load(`assets/textures/${name}.webp`, tex => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = aniso;
      if (color) tex.colorSpace = THREE.SRGBColorSpace;
      out[key] = tex;
      onProgress(++done / keys.length);
      resolve();
    }, undefined, () => { onProgress(++done / keys.length); resolve(); });
  }))).then(() => out);
}

// Same texture, independent repeat/offset (textures share the image upload).
export function tiled(tex, rx, ry, ox = 0, oy = 0) {
  if (!tex) return null;
  const t = tex.clone();
  t.repeat.set(rx, ry);
  t.offset.set(ox, oy);
  t.needsUpdate = true;
  return t;
}
