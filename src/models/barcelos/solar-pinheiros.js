// Solar dos Pinheiros (Barcelos), metric builder.
// OSM outline: an L of 20.6 x 27.2 m. data/dimensions.json: 14 m total
// (estimate; the tower is the tallest part).
//
// Photos (assets/img/solar-pinheiros*.jpg): bare granite ashlar in uneven
// courses with orange lichen, no render. A square keep-like tower with a
// low tile eave: top, a pair of small leaded windows; below, a Manueline
// window with a carved ogee frame; lower, a mullioned pair under a plain
// lintel and a coat of arms on a granite plaque; at the foot a small
// pointed door and a corbelled slit. Against it a lower range with
// red-framed sash windows, a heavy round-arched door of studded pink wood
// in a roll moulding, and a low-pitched tile roof.
//
// Frame (fit.js): rule.front 167 snaps to the tower front, so +z is the
// tower face (south-south-east) and +x is east-north-east.
//   long block  x -10.31..-1.9, z -13.57..13.57; the tower is its +z end
//               (8.4 x 8.4, z 5.17..13.57), the lower range the rest
//   rear wing   x -1.9..10.31, z -13.57..-5.35
// Every detail stays inside the outline or within 0.2 m of it.
import * as THREE from 'three';
import { MAT, archPath, pointedPath } from '../kit.js';
import { win } from '../parts.js';
import { roofOver } from '../metric.js';

const G = 'graniteWarm';
const L = 'graniteLight';
const D = 'graniteDark';
const RED = 'rust';

const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

function at(k, x, z, ry, fn) {
  k.push({ x, z, ry });
  fn();
  k.pop();
}
const OUT = { south: 0, north: Math.PI, east: Math.PI / 2, west: -Math.PI / 2 }; // local +z of the push = the face's outward

// Framed sash window, red-brown frame, white glazing bars.
function sash(k, x, y, w, h, o = {}) {
  win(k, x, y, w, h, 0, { trim: o.trim ?? L, pane: o.pane ?? 'glass', bw: 0.14, depth: 0.12, sill: o.sill ?? true });
  k.box(0.06, h, 0.05, o.frame ?? RED, x, y, 0.1);
  k.box(w, 0.06, 0.05, o.frame ?? RED, x, y + h * 0.5, 0.1);
  k.box(w + 0.1, 0.07, 0.06, o.frame ?? RED, x, y, 0.1);
  k.box(w + 0.1, 0.07, 0.06, o.frame ?? RED, x, y + h, 0.1);
}

function solar(k, { dims }) {
  const H = dims?.height_m?.total ?? 14;
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

  const tx0 = -10.31, tx1 = -1.9; // the long block
  const tzT = 5.17; // tower back wall
  const yTw = H - 1.25; // tower wall top (tile eave over it)
  const yLow = 8.6; // lower range eave
  const yWing = 7.4; // rear wing eave

  k.begin('main');
  // ---------------------------------------------------------------- masses
  k.box(tx1 - tx0, yTw, 13.57 - tzT, G, (tx0 + tx1) / 2, 0, (13.57 + tzT) / 2, { jit: 0.05 });
  k.prism(rect(tx0, tx1, -13.57, tzT), 0, yLow, G, { jit: 0.05 });
  k.prism(rect(-1.9, 10.31, -13.57, -5.35), 0, yWing, G, { jit: 0.05 });
  // footing and a plinth course
  k.prism([[tx0, -13.57], [tx1, -13.57], [tx1, 13.57], [tx0, 13.57]], 0, 0.7, D, { jit: 0.06 });
  k.prism(rect(-1.9, 10.31, -13.57, -5.35), 0, 0.7, D, { jit: 0.06 });
  // roofs: low-pitched hips of old tile; the tower's eave band carries one
  roofOver(k, rect(tx0, tx1, tzT, 13.57), yTw, 1.2, 'terracotta', 'hip', { over: 0.12 });
  roofOver(k, rect(tx0, tx1, -13.57, tzT), yLow, 1.8, 'terracotta', 'hip', { over: 0.12 });
  roofOver(k, rect(-1.9, 10.31, -13.57, -5.35), yWing, 1.6, 'terracotta', 'hip', { over: 0.12 });
  // eave band on the tower
  k.box(tx1 - tx0 + 0.3, 0.35, 13.57 - tzT + 0.3, L, (tx0 + tx1) / 2, yTw - 0.35, (13.57 + tzT) / 2 + 0.0);

  // ----------------------------------------------- random ashlar quoins
  for (let i = 0; i < 4; i++) {
    const [x, z] = [[tx0, 13.57], [tx1, 13.57], [tx0, tzT], [tx1, tzT]][i];
    for (let y = 0.9; y < yTw - 0.8; y += 0.62) {
      const long = Math.floor(y / 0.62) % 2 === 0;
      k.box(long ? 1.0 : 0.6, 0.58, long ? 0.6 : 1.0, Math.floor(y / 0.62) % 3 ? 'granite' : G, x + (x === tx0 ? 0.3 : -0.3), y, z + (z === 13.57 ? -0.3 : 0.3), { jit: 0.08 });
    }
  }
  // irregular proud stones on the tower faces: granite blocks of uneven size
  for (const [face, len, ax] of [[OUT.south, 8.4, (tx0 + tx1) / 2], [OUT.west, 8.4, 0], [OUT.east, 8.4, 0]]) {
    const px = face === OUT.south ? ax : face === OUT.west ? tx0 : tx1;
    const pz = face === OUT.south ? 13.57 : (tzT + 13.57) / 2;
    k.push({ x: px, z: pz, ry: face });
    for (let i = 0; i < 46; i++) {
      const u = (rnd() - 0.5) * (len - 1.8);
      const y = 1.0 + rnd() * (yTw - 2.4);
      k.box(0.5 + rnd() * 0.7, 0.28 + rnd() * 0.3, 0.08, rnd() > 0.5 ? 'granite' : 'graniteGrey', u, y, 0.0, { jit: 0.12 });
    }
    k.pop();
  }

  // ------------------------------------------------------------ tower front
  at(k, (tx0 + tx1) / 2, 13.57, OUT.south, () => {
    // top: a pair of small leaded windows
    for (const x of [-1.3, -0.1]) sash(k, x - 0.65, 10.7, 0.8, 1.3, { frame: 'iron' });
    // Manueline window: ogee frame in carved granite, two lights
    win(k, -2.15, 7.0, 1.7, 1.55, 0, { trim: L, pane: 'glass', bw: 0.22, depth: 0.16, sill: true });
    k.box(0.1, 1.55, 0.06, 'iron', -2.15, 7.0, 0.12);
    k.cone(0.55, 0.75, 4, L, -2.15, 8.85, 0.05, { sz: 0.25 });
    for (const dx of [-0.9, 0.9]) k.cone(0.2, 0.45, 4, L, -2.15 + dx, 8.65, 0.05, { sz: 0.3 });
    // mullioned pair under a lintel
    for (const x of [-0.45, 0.45]) sash(k, -2.55 + x, 4.4, 0.62, 1.15, { frame: 'iron' });
    k.box(1.7, 0.2, 0.3, L, -2.55, 5.8, 0.1);
    // the coat of arms on its plaque, right of the lower windows
    k.box(1.55, 1.6, 0.14, L, 0.95, 3.7, 0.0);
    k.box(0.9, 1.05, 0.08, D, 0.95, 3.95, 0.1);
    k.cone(0.4, 0.4, 4, 'gold', 0.95, 4.45, 0.12, { sz: 0.2 });
    // the slit above the door on a corbel, and the small pointed door
    k.box(0.9, 0.4, 0.25, L, -1.3, 2.35, 0.0);
    k.box(0.55, 0.28, 0.1, 'dark', -1.3, 2.4, 0.12);
    k.surround({ x: 1.5, y: 0.0, w: 1.0, h: 2.1, arch: 'pointed' }, 0.2, 0.16, L, 0);
    const door = new THREE.Shape();
    pointedPath(door, 1.5, 0.0, 1.0, 2.1, 5);
    k.plane(door, 'dark', 0, 0, 0.03, { mat: MAT.flat });
  });
  // the other tower faces: a window pair high up, a slit lower
  at(k, tx1, (tzT + 13.57) / 2, OUT.east, () => {
    sash(k, 0.0, 10.5, 0.9, 1.3, { frame: 'iron' });
    sash(k, 1.8, 6.4, 0.9, 1.3, { frame: 'iron' });
  });
  at(k, tx0, (tzT + 13.57) / 2, OUT.west, () => {
    sash(k, 0.0, 10.5, 0.9, 1.3, { frame: 'iron' });
    sash(k, -1.8, 6.4, 0.9, 1.3, { frame: 'iron' });
  });

  // ---------------------------------------------------- lower range, east face
  at(k, tx1, -4.2, OUT.east, () => {
    // row of red-framed sash windows, upper floor; a coat plaque between
    for (const x of [-6.2, -3.9, -1.6, 4.4, 6.5]) sash(k, x, 4.5, 0.85, 1.55);
    // heavy round-arched door: studded pink wood in a roll moulding
    k.surround({ x: 1.0, y: 0.0, w: 2.5, h: 3.5, arch: 'round' }, 0.34, 0.2, L, 0);
    const dp = new THREE.Shape();
    archPath(dp, 1.0, 0.0, 2.5, 3.5, 10);
    k.plane(dp, 'rose', 0, 0, 0.04, { mat: MAT.smooth });
    for (let i = 0; i < 40; i++) {
      const col = i % 8, row = Math.floor(i / 8);
      const y = 0.3 + row * 0.55;
      if (y > 2.1 && (col < 1 || col > 6)) continue;
      k.box(0.07, 0.07, 0.05, 'iron', -0.1 + col * 0.31, y, 0.09);
    }
  });
  // lower range, west face: two rows of plain windows
  at(k, tx0, -4.2, OUT.west, () => {
    for (const x of [-7, -3.5, 0, 3.5]) {
      sash(k, x, 1.6, 0.85, 1.3);
      sash(k, x, 4.9, 0.85, 1.55);
    }
  });
  // rear wing: windows on its three free faces
  at(k, 2.2, -5.35, OUT.south, () => {
    for (const x of [-3.4, -0.8, 1.8, 4.4]) sash(k, x, 4.3, 0.85, 1.5);
  });
  at(k, 2.2, -13.57, OUT.north, () => {
    for (const x of [-3.4, -0.8, 1.8, 4.4]) { sash(k, x, 1.5, 0.85, 1.3); sash(k, x, 4.3, 0.85, 1.5); }
  });
  at(k, 10.31, -9.46, OUT.east, () => {
    for (const x of [-2, 2]) sash(k, x, 4.3, 0.85, 1.5);
  });
  // chimney stacks on the ridge of the lower range and the wing (inside the outline)
  for (const [x, z, y] of [[-6.1, -2, yLow + 1.1], [2.8, -9.4, yWing + 1.0]]) {
    k.box(0.9, 1.8, 0.9, G, x, y, z);
    k.box(1.1, 0.2, 1.1, L, x, y + 1.8, z);
  }
  k.end('main');
}

solar.metric = true;
solar.rule = {
  front: 167,
  view: 0.5,
  note: 'tower front (rule.front 167): bare granite ashlar, 8.4 m square tower to 14 m with the carved Manueline window, mullioned pair, coat of arms and pointed door; lower range with red sash windows and the studded round-arched door; rear wing; all detail inside the OSM outline.',
};

export default { 'solar-pinheiros': solar };
