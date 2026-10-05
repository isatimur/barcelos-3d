// Torre de Menagem de Barcelos (Torre da Porta Nova), metric builder.
// OSM way 108359868 (12.1 x 13.2 m). data/dimensions.json: 20 m total (a
// source says "cerca de 20 metros"; the front photo scales to about 19 m).
//
// Photos (assets/img/torre-menagem*.jpg): a square granite keep on a rubble
// plinth about a third of the height. In the front face, a deep pointed
// arch frames a smaller pointed door with an iron grille. Above the plinth,
// dressed ashlar with big quoins and small framed rectangular windows with
// dark red-brown sashes: one row of two at the plinth top, then two rows of
// two. The wall top is carried on a course of corbels and ends in a parapet
// whose merlons are small pyramids, with a taller finial at each corner. A
// narrow pointed door and slit windows pierce the side faces.
//
// Frame (fit.js): the OSM edge normal at 21 deg is the gate front, so +z is
// the gate face (north-north-east) and +x is west-north-west.
// Heights follow the 20 m: plinth 7.0, corbels 16.6..17.3, parapet to 18.3,
// merlon tips and corner finials at 20.0.
import * as THREE from 'three';
import { MAT, mulberry32, pointedPath } from '../kit.js';
import { bbox, offset } from '../geom.js';
import { win } from '../parts.js';

const R = 'granite'; // weathered rubble of the plinth
const A = 'graniteWarm'; // sandy ashlar of the shaft (photos)
const L = 'graniteLight'; // dressed trim
const D = 'graniteDark';
const W = 'graniteWarm';

// Quoin stack up a corner: alternating long and short blocks.
function quoins(k, x, z, sx, sz, y0, y1) {
  let i = 0;
  for (let y = y0; y < y1 - 0.05; y += 0.6, i++) {
    const long = i % 2 === 0;
    const h = Math.min(0.56, y1 - y);
    k.box(long ? 1.15 : 0.7, h, long ? 0.7 : 1.15, i % 3 ? L : W, x - sx * (long ? 0.05 : 0), y, z - sz * (long ? 0 : 0.05), { jit: 0.06 });
  }
}

// Framed window of the photographed type: granite surround, red-brown sash
// with a white cross bar.
function sash(k, x, y, w, h, z) {
  win(k, x, y, w, h, z, { trim: L, pane: 'rust', bw: 0.17, depth: 0.2, sill: true });
  k.box(0.07, h, 0.06, 'white', x, y, z + 0.08);
  k.box(w, 0.07, 0.06, 'white', x, y + h * 0.5, z + 0.08);
}

// Narrow loophole slit with a dressed frame.
function slit(k, x, y, h, z) {
  k.box(0.5, h + 0.3, 0.14, L, x, y - 0.15, z + 0.04);
  k.box(0.2, h, 0.16, 'dark', x, y, z + 0.06);
}

function torre(k, { footprint: f, dims }) {
  const H = dims?.height_m?.total ?? 20;
  const b = bbox(f.outline);
  const yP = H * 0.35; // plinth top
  const yC = H - 3.4; // corbel course starts
  const yB = H - 1.4; // parapet top
  const T = 1.2; // depth of the gate wall
  const IN = 0.35; // the shaft stands back from the plinth and the parapet
  const shaft = offset(f.outline, -IN);

  k.begin('main');
  // ---------------------------------------------------------------- plinth
  // rubble body behind the gate wall
  const rear = f.outline.map(([x, z]) => [x, Math.min(z, b.z1 - T)]);
  k.prism(rear, 0, yP, R, { jit: 0.07 });
  k.prism(f.outline, 0, 0.7, D); // footing
  // gate wall: a pointed outer arch, 3.6 m wide
  k.gate(b.w, yP, T, [{ x: 0, w: 3.6, h: 4.9, pointed: true }], R, b.cx, 0, b.z1 - T / 2, { jit: 0.07 });
  k.surround({ x: b.cx, y: 0, w: 3.6, h: 4.9, arch: 'pointed' }, 0.3, 0.2, L, b.z1);
  // inner pointed door with an iron grille, set back
  k.surround({ x: b.cx, y: 0, w: 2.2, h: 3.9, arch: 'pointed' }, 0.22, 0.2, L, b.z1 - T);
  const door = new THREE.Shape();
  pointedPath(door, b.cx, 0, 2.2, 3.9, 5);
  k.plane(door, 'dark', 0, 0, b.z1 - T + 0.05, { mat: MAT.flat });
  for (let i = -3; i <= 3; i++) k.box(0.07, 3.2, 0.07, 'iron', b.cx + i * 0.3, 0.2, b.z1 - T + 0.14);
  for (const y of [0.9, 1.9, 2.8]) k.box(2.0, 0.07, 0.07, 'iron', b.cx, y, b.z1 - T + 0.14);
  // rubble: irregular proud blocks on the four plinth faces (photo: coursed
  // rubble with dressed quoins)
  const rnd = mulberry32(108359868);
  const tones = [R, D, 'graniteGrey', W, R];
  for (const [fx, fz, ry, len, skipGate] of [[b.cx, b.z1, 0, b.w, true], [b.cx, b.z0, Math.PI, b.w, false], [b.x1, b.cz, Math.PI / 2, b.d, false], [b.x0, b.cz, -Math.PI / 2, b.d, false]]) {
    k.push({ x: fx, z: fz, ry });
    for (let i = 0; i < 34; i++) {
      const u = (rnd() - 0.5) * (len - 1.6);
      const y = 0.9 + rnd() * (yP - 1.4);
      if (skipGate && Math.abs(u) < 2.5 && y < 6.0) continue;
      k.box(0.5 + rnd() * 0.7, 0.3 + rnd() * 0.3, 0.14, tones[i % tones.length], u, y, 0.03, { jit: 0.09 });
    }
    k.pop();
  }
  // the plinth top: a sloped ledge (set-off) all round
  k.prism(f.outline, yP, 0.3, L);
  k.prism(offset(f.outline, -0.12), yP + 0.3, 0.12, L);

  // ----------------------------------------------------------------- shaft
  k.prism(shaft, yP + 0.42, yC - yP - 0.42, A, { jit: 0.04 });
  // a string course halfway up
  k.prism(offset(shaft, 0.1), yP + (yC - yP) * 0.52, 0.28, L, { holes: [shaft] });
  // quoins on the four corners
  const xs0 = b.x0 + IN, xs1 = b.x1 - IN, zs0 = b.z0 + IN, zs1 = b.z1 - IN;
  for (const [x, z, sx, sz] of [[xs1 - 0.45, zs1 - 0.3, 1, 1], [xs0 + 0.45, zs1 - 0.3, -1, 1], [xs1 - 0.45, zs0 + 0.3, 1, -1], [xs0 + 0.45, zs0 + 0.3, -1, -1]]) {
    quoins(k, x, z, sx, sz, yP + 0.42, yC);
  }

  // --------------------------------------------------------------- windows
  // front face (+z): two rows of two above the gate and a low row beside it
  k.push({ x: b.cx, z: zs1, ry: 0 });
  for (const [x, y, w, h] of [
    [-2.4, yP + 0.9, 0.95, 1.2], [2.6, yP + 0.55, 1.0, 1.3],
    [-1.3, 10.7, 1.0, 1.25], [1.7, 10.7, 1.0, 1.25],
    [-1.3, 14.4, 1.05, 1.35], [1.7, 14.4, 1.05, 1.35],
  ]) sash(k, x, y, w, h, 0);
  k.pop();
  // back face (-z): a plain row of three and a high pair
  k.push({ x: b.cx, z: zs0, ry: Math.PI });
  for (const x of [-2.6, 0, 2.6]) sash(k, x, 10.5, 0.95, 1.2, 0);
  for (const x of [-1.5, 1.5]) sash(k, x, 14.4, 1.0, 1.3, 0);
  slit(k, -4.2, 8.4, 1.1, 0);
  slit(k, 4.2, 8.4, 1.1, 0);
  k.pop();
  // side faces: slits on three levels, a narrow pointed door in the west one
  for (const s of [1, -1]) {
    k.push({ x: s > 0 ? xs1 : xs0, z: b.cz, ry: s * Math.PI / 2 });
    for (const [u, y] of [[-3.6, 9.3], [0.2, 12.4], [3.6, 9.3], [-3.0, 15.6], [3.0, 15.6]]) slit(k, u, y, 1.15, 0);
    sash(k, 0.2, 14.2, 0.95, 1.25, 0);
    k.pop();
  }
  // the narrow pointed side door at the foot of the +x face (photo, left face)
  k.push({ x: b.x1, z: b.cz + 3.4, ry: Math.PI / 2 });
  k.surround({ x: 0, y: 0, w: 1.3, h: 2.7, arch: 'pointed' }, 0.2, 0.18, L, 0);
  const sd = new THREE.Shape();
  pointedPath(sd, 0, 0, 1.3, 2.7, 5);
  k.plane(sd, 'wood', 0, 0, -0.04, { mat: MAT.smooth });
  k.pop();

  // ------------------------------------------------- corbels and parapet
  // the battlement overhangs the wall on a course of corbels
  k.prism(offset(shaft, 0.12), yC, 0.3, L, { holes: [offset(shaft, -0.4)] });
  for (const e of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const alongX = e[1] !== 0;
    const len = alongX ? b.w - 0.9 : b.d - 0.9;
    const n = Math.floor(len / 1.0);
    for (let i = 0; i < n; i++) {
      const u = -len / 2 + (i + 0.5) * (len / n);
      const x = alongX ? b.cx + u : b.cx + e[0] * (b.w / 2 - IN - 0.12);
      const z = alongX ? b.cz + e[1] * (b.d / 2 - IN - 0.12) : b.cz + u;
      // three-step corbel: wide at the top, narrow at the bottom
      k.box(alongX ? 0.5 : 0.4, 0.34, alongX ? 0.4 : 0.5, L, x + e[0] * 0.08, yC + 0.3, z + e[1] * 0.08);
      k.box(alongX ? 0.4 : 0.3, 0.3, alongX ? 0.3 : 0.4, L, x + e[0] * 0.14, yC + 0.64, z + e[1] * 0.14);
    }
  }
  // wall-walk floor and parapet ring (flush with the OSM outline)
  k.prism(f.outline, yC + 0.94, 0.3, A, { holes: [offset(f.outline, -0.7)] });
  k.prism(offset(f.outline, -0.7), yC + 0.94, 0.1, 'lead');
  k.prism(f.outline, yC + 1.24, yB - yC - 1.24, A, { holes: [offset(f.outline, -0.7)], jit: 0.04 });
  // merlons: small pyramids on stone blocks (photo), spaced about 1.5 m
  const mh = (H - yB) / 1.55;
  k.crenels(b.w - 0.1, b.d - 0.1, A, b.cx, yB, b.cz, { mw: 0.85, mh, t: 0.7, pointed: true });
  // taller finials on the four corners
  for (const [x, z] of [[b.x0 + 0.5, b.z0 + 0.5], [b.x1 - 0.5, b.z0 + 0.5], [b.x0 + 0.5, b.z1 - 0.5], [b.x1 - 0.5, b.z1 - 0.5]]) {
    k.box(0.8, H - yB - 0.5, 0.8, A, x, yB, z);
    k.cone(0.62, 0.55, 4, L, x, H - 0.55, z);
    k.sphere(0.12, L, x, H - 0.05, z, { seg: 5, rings: 3, flat: true });
  }
  k.end('main');
}

torre.metric = true;
torre.rule = {
  front: 21,
  view: 0.5,
  note: 'gate front (rule.front 21): square granite keep on its OSM outline with a rubble plinth to 7 m, pointed outer arch and grilled inner door, ashlar shaft with quoins and framed sash windows, corbelled battlement with pyramid merlons and corner finials; 20 m tall (source: cerca de 20 metros).',
};

export default { 'torre-menagem': torre };
