// Real CC0 surface materials (Poly Haven), loaded once and used as
// world-space (triplanar) detail on the ground, walls and roofs. They carry
// the photographic grain and variation the procedural shaders cannot, while
// the shading, colour and lighting stay in code. See data/CREDITS.md.
import * as THREE from 'three';
import { assetUrl } from './data.js';

const loader = new THREE.TextureLoader();

function load(file, { srgb = true } = {}) {
  const t = loader.load(assetUrl(`assets/tex/${file}`));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.name = file;
  return t;
}

export const TEX = {};
let loaded = false;
export function loadMaterials() {
  if (loaded || typeof document === 'undefined') return TEX;
  loaded = true;
  TEX.ground = load('ground.jpg');
  TEX.plaster = load('wall_plaster.jpg');
  TEX.granite = load('wall_granite.jpg');
  TEX.roof = load('roof_tiles.jpg');
  TEX.cobble = load('cobble.jpg');
  return TEX;
}

// Triplanar sample by world normal and position (no UVs needed on the
// generated geometry). Returns the diffuse at `scale` metres per tile.
export const TRIPLANAR = /* glsl */ `
vec3 brgTriplanar(sampler2D tex, vec3 wp, vec3 n, float scale) {
  vec3 w = abs(normalize(n));
  w = pow(w, vec3(4.0));
  w /= (w.x + w.y + w.z);
  vec3 cx = texture2D(tex, wp.zy * scale).rgb;
  vec3 cy = texture2D(tex, wp.xz * scale).rgb;
  vec3 cz = texture2D(tex, wp.xy * scale).rgb;
  return cx * w.x + cy * w.y + cz * w.z;
}
`;
