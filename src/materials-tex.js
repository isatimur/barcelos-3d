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
  TEX.groundN = load('ground_nor.jpg', { srgb: false });
  TEX.plasterN = load('wall_plaster_nor.jpg', { srgb: false });
  TEX.graniteN = load('wall_granite_nor.jpg', { srgb: false });
  TEX.roofN = load('roof_tiles_nor.jpg', { srgb: false });
  TEX.cobbleN = load('cobble_nor.jpg', { srgb: false });
  TEX.groundRough = load('ground_rough.jpg', { srgb: false });
  TEX.plasterRough = load('wall_plaster_rough.jpg', { srgb: false });
  TEX.graniteRough = load('wall_granite_rough.jpg', { srgb: false });
  TEX.roofRough = load('roof_tiles_rough.jpg', { srgb: false });
  TEX.cobbleRough = load('cobble_rough.jpg', { srgb: false });
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

// Tangent-free triplanar normal (whiteout blend, Golus): sample the normal
// map on the three planes (x plane = zy, y plane = xz, z plane = xy), lay each
// tangent-space normal onto the world normal's own axis, swizzle it back to
// world axes and blend by the world normal's dominant axes. The result is a
// world-space normal that stays on the surface it perturbs, on x, y and z
// faces alike (the earlier version read every plane's z as world z).
export const TRIPLANAR_NORMAL = /* glsl */ `
vec3 brgTriplanarNormal(sampler2D tex, vec3 wp, vec3 n, float scale, float strength) {
  vec3 wn = normalize(n);
  vec3 w = pow(abs(wn), vec3(4.0));
  w /= (w.x + w.y + w.z);
  vec3 nx = texture2D(tex, wp.zy * scale).xyz * 2.0 - 1.0;
  vec3 ny = texture2D(tex, wp.xz * scale).xyz * 2.0 - 1.0;
  vec3 nz = texture2D(tex, wp.xy * scale).xyz * 2.0 - 1.0;
  nx = vec3(nx.xy * strength + wn.zy, abs(nx.z) * wn.x);
  ny = vec3(ny.xy * strength + wn.xz, abs(ny.z) * wn.y);
  nz = vec3(nz.xy * strength + wn.xy, abs(nz.z) * wn.z);
  return normalize(nx.zyx * w.x + ny.xzy * w.y + nz.xyz * w.z);
}
`;

// Scalar triplanar roughness sample. Uses the green channel, matching three's
// conventional roughness-map packing, and returns a raw 0..1 value.
export const TRIPLANAR_ROUGH = /* glsl */ `
float brgTriplanarRough(sampler2D tex, vec3 wp, vec3 n, float scale) {
  vec3 w = abs(normalize(n));
  w = pow(w, vec3(4.0));
  w /= (w.x + w.y + w.z);
  float rx = texture2D(tex, wp.zy * scale).g;
  float ry = texture2D(tex, wp.xz * scale).g;
  float rz = texture2D(tex, wp.xy * scale).g;
  return rx * w.x + ry * w.y + rz * w.z;
}
`;
