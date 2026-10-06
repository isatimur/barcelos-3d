// Casa da Azenha (Barcelos), metric builder: the old water mill on the
// Cávado bank under the Paço terrace. OSM outline 6.4 x 12.2 m (a rectangle
// with one extra vertex on the east side). data/dimensions.json: 6.4 m total
// (estimate; the ridge).
//
// Photos (assets/img/casa-azenha*.jpg): a two-storey mill house. The lower
// storey is rough granite rubble with a few small, deep-set windows, an
// elliptical window and, at one end of the river face, a round-arched
// sluice opening with an iron grille beside the wooden overshot water
// wheel (an eight-spoke wheel of timber, 3.3 m across, standing in a
// granite wheel pit). The upper storey is white lime plaster with a row of
// granite-framed windows with red sashes, and the roof is a low hip of old
// tile with a plain eave.
//
// Frame (fit.js): rule.front 99.7 snaps to the east end, so +z = east and
// +x = north (the town side); the river face is -x (south), and the wheel
// stands on it near the west end (z < 0).
// The wheel is the only element that stands off the wall (0.5 m); the
// roof eave overhangs 0.1 m. Both keep the model inside the 10 % fit limit.
import * as THREE from 'three';
import { MAT, archPath } from '../kit.js';
import { bbox, edges } from '../geom.js';
import { win } from '../parts.js';
import { roofOver } from '../metric.js';

const R = 'granite'; // rubble
const L = 'graniteLight';
const D = 'graniteDark';

function sash(k, x, y, w, h, o = {}) {
  win(k, x, y, w, h, 0, { trim: L, pane: 'glass', bw: 0.12, depth: 0.1, sill: false });
  k.box(w + 0.4, 0.1, 0.16, L, x, y - 0.2, 0.0); // a thin sill (win's own sill stands 0.45 m out)
  const c = o.frame ?? 'flowerRed';
  k.box(0.05, h, 0.04, c, x, y, 0.08);
  k.box(w, 0.05, 0.04, c, x, y + h * 0.5, 0.08);
  k.box(w + 0.08, 0.06, 0.05, c, x, y, 0.08);
  k.box(w + 0.08, 0.06, 0.05, c, x, y + h, 0.08);
}

// A small deep-set window of the granite storey.
function small(k, x, y, w, h) {
  win(k, x, y, w, h, 0, { trim: L, pane: 'dark', bw: 0.1, depth: 0.1, sill: false });
  k.box(w + 0.3, 0.09, 0.14, L, x, y - 0.17, 0.0);
}

function azenha(k, { footprint: f, dims }) {
  const H = dims?.height_m?.total ?? 6.4;
  const out = f.outline;
  const b = bbox(out);
  const yG = 2.85; // top of the granite storey
  const yE = 4.9; // eave
  const rnd = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

  k.begin('main');
  // walls: rubble below, plaster above, a string course between
  k.prism(out, 0, yG, R, { jit: 0.06 });
  k.prism(out, yG, yE - yG, 'plaster', { jit: 0.02 });
  for (const e of edges(out)) {
    if (e.len < 2) continue;
    k.push({ x: e.mx, y: yG - 0.1, z: e.mz, ry: e.ry });
    k.box(e.len, 0.2, 0.18, L, 0, 0, -0.07);
    k.pop();
  }
  roofOver(k, out, yE, H - yE, 'terracotta', 'hip', { over: 0.1 });

  // proud rubble blocks on the granite storey (uneven courses)
  for (const e of edges(out)) {
    if (e.len < 3) continue;
    k.push({ x: e.mx, z: e.mz, ry: e.ry });
    const n = Math.floor(e.len * 3.2);
    for (let i = 0; i < n; i++) {
      const u = (rnd() - 0.5) * (e.len - 0.5);
      const y = 0.2 + rnd() * (yG - 0.7);
      k.box(0.4 + rnd() * 0.55, 0.22 + rnd() * 0.24, 0.08, rnd() > 0.55 ? 'graniteWarm' : 'graniteGrey', u, y, -0.02, { jit: 0.1 });
    }
    k.pop();
  }

  // ---------------------------------------------- river face (south, -x)
  const south = edges(out).filter((e) => Math.abs(e.nx + 1) < 0.1).sort((a, c) => c.len - a.len)[0];
  k.push({ x: south.mx, z: south.mz, ry: south.ry });
  // local x along the face: from the photo (looking from the south) the wheel
  // is right of centre, the sluice to its right. The face's local x runs
  // toward the building's -z (west), so right of centre = +u.
  // upper floor: four granite-framed sash windows
  for (const u of [-4.2, -1.4, 1.4, 4.2]) sash(k, u, 3.4, 0.8, 1.2);
  // lower floor: small deep windows, an elliptical one above the sluice
  for (const u of [-4.6, -2.8]) small(k, u, 0.9, 0.55, 1.1);
  k.box(1.3, 0.55, 0.06, 'glass', 4.4, 1.6, 0.0, { emit: 0.1 });
  k.add(new THREE.TorusGeometry(0.45, 0.07, 4, 16), L, { x: 4.4, y: 1.9, z: 0.04, sy: 0.6 });
  // the sluice: a round-arched opening with a grille
  k.surround({ x: 3.35, y: 0.0, w: 1.3, h: 1.45, arch: 'round' }, 0.16, 0.1, L, 0);
  const sl = new THREE.Shape();
  archPath(sl, 3.35, 0.0, 1.3, 1.45, 8);
  k.plane(sl, 'dark', 0, 0, 0.03, { mat: MAT.flat });
  for (let i = -3; i <= 3; i++) k.box(0.04, 1.2, 0.04, 'iron', 3.35 + i * 0.18, 0.1, 0.07);
  // the wooden water wheel: ring, hub, eight spokes, paddles, in its pit
  const wu = 1.2;
  const WR = 1.65;
  const wy = WR + 0.15;
  k.box(1.6, 0.4, 0.3, D, wu, 0.0, 0.14); // the granite sill under the wheel
  for (const dz of [0.1, 0.34]) {
    const rim = new THREE.TorusGeometry(WR, 0.05, 4, 28);
    k.add(rim, 'wood', { x: wu, y: wy, z: dz, flat: false });
  }
  k.cyl(0.12, 0.12, 0.5, 8, 'wood', wu, wy, 0.22, { rx: Math.PI / 2 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    for (const dz of [0.1, 0.34]) k.box(0.06, WR * 0.96, 0.06, 'wood', wu, wy, dz, { rz: a });
    // paddles between the rims
    const px = wu + Math.cos(a + Math.PI / 8) * (WR - 0.05);
    const py = wy + Math.sin(a + Math.PI / 8) * (WR - 0.05);
    k.box(0.5, 0.05, 0.3, 'wood', px, py, 0.22, { rz: a + Math.PI / 8 + Math.PI / 2 });
  }
  // the timber flume that fed the wheel, on posts, and the stone lip of the weir
  k.box(2.0, 0.12, 0.34, 'wood', wu + 0.1, 2.95, 0.17);
  for (const dx of [-0.9, 0.9]) k.box(0.1, 0.7, 0.1, 'wood', wu + dx, 2.25, 0.22);
  for (const dx of [-0.95, 0.95]) k.box(0.1, 0.34, 0.06, 'wood', wu + dx, 2.95, 0.04, { rz: 0 });
  // an iron downpipe at the corner and the eave gutter
  k.cyl(0.05, 0.05, yE - 0.6, 6, 'iron', -5.9, 0.3, 0.06);
  k.box(0.1, 0.1, 0.05, 'iron', -5.9, yE - 0.2, 0.06);
  k.pop();

  // ------------------------------------------------ the other faces
  // east end (the front): two windows above, a small round-arched door below
  k.push({ x: b.cx, z: b.z1, ry: 0 });
  for (const u of [-1.4, 1.4]) sash(k, u, 3.4, 0.8, 1.2);
  k.surround({ x: 0, y: 0, w: 1.0, h: 2.0, arch: 'round' }, 0.14, 0.1, L, 0);
  const dp = new THREE.Shape();
  archPath(dp, 0, 0, 1.0, 2.0, 8);
  k.plane(dp, 'wood', 0, 0, 0.03, { mat: MAT.smooth });
  k.pop();
  // north face: five windows on the upper floor, two small ones below
  k.push({ x: b.x1, z: b.cz, ry: Math.PI / 2 });
  for (const u of [-4.2, -2.1, 0, 2.1, 4.2]) sash(k, u, 3.4, 0.8, 1.2);
  for (const u of [-3, 1.5]) small(k, u, 0.9, 0.55, 1.0);
  k.pop();
  // chimney on the ridge
  k.box(0.6, 0.85, 0.6, 'plaster', b.cx, H - 0.85, b.cz + 3.0);
  k.box(0.76, 0.12, 0.76, L, b.cx, H - 0.05, b.cz + 3.0);
  k.end('main');
}

azenha.metric = true;
azenha.rule = {
  front: 99.7,
  view: 0.5,
  note: 'east end (rule.front 99.7): rubble granite ground storey, white plaster upper storey with red-sash windows, hip roof, and on the river face (south) the round sluice arch and the eight-spoke timber water wheel (the only element that stands off the wall).',
};

export default { 'casa-azenha': azenha };
