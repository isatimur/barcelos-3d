// Paço dos Condes de Barcelos (Paço dos Duques de Bragança), metric builder.
// OSM way 108362147 (tag ruins, 50.0 x 42.4 m) is the whole terrace above
// the Cávado: the walled platform that carries the roofless ruin of the
// 15th-century palace, today an open-air archaeological museum.
// data/dimensions.json: 12 m total (estimate).
//
// Photos (assets/img/paco-condes*.jpg): an aerial view from the river side
// shows the granite retaining wall of the terrace with a parapet, two large
// round azulejo medallions and a cluster of small ones (the Festas das
// Cruzes emblem) on its south face; on the terrace, in the north-west part
// next to the church, the roofless palace walls: a long north range with
// two rows of square window openings, a front block with a round-arched
// window, a square block with a round-arched doorway, and a tall round
// chimney shaft (the palace's famous chimneys, also on the 1786 azulejo
// panel). The open terrace holds a stone cross, sarcophagi and carved
// fragments of the museum, gravel paths and a lawn.
//
// Frame (fit.js): rule.front 175 snaps to the south wall (bearing 182.8),
// so +z = south (the river side) and +x = east. The north edge of the
// outline runs at about -9.5 deg to x; the ruin is drawn in its own frame
// turned to that edge (u along it, v to the south).
// The terrace stands 3.6 m above the base (the site really falls about 8 m
// to the river, but the whole model has to stay inside the 12 m height of
// dimensions.json: terrace 3.6 m + walls to 11 m + chimney to 13 m).
import * as THREE from 'three';
import { MAT, mulberry32, archPath, rectPath } from '../kit.js';
import { offset } from '../geom.js';

const G = 'graniteGrey';
const L = 'granite';
const D = 'graniteDark';

const P = 3.6; // terrace level above the base

// Ruined wall along local x (length len, thickness t, centred on z): door
// notches from the ground, window holes, a broken top (rough) with deeper
// breaks (drops: [{ u, w, d }]). Window/door: { x, y, w, h, arch }.
function ruinWall(k, rnd, len, h, t, o = {}) {
  const s = new THREE.Shape();
  const doors = [...(o.doors || [])].sort((a, b) => a.x - b.x);
  s.moveTo(-len / 2, 0);
  for (const d of doors) {
    const r = d.w / 2;
    s.lineTo(d.x - r, 0);
    if (d.arch === 'round') {
      s.lineTo(d.x - r, d.h - r);
      s.absarc(d.x, d.h - r, r, Math.PI, 0, true);
    } else {
      s.lineTo(d.x - r, d.h);
      s.lineTo(d.x + r, d.h);
    }
    s.lineTo(d.x + r, 0);
  }
  s.lineTo(len / 2, 0);
  const n = Math.max(2, Math.round(len / (o.step ?? 0.8)));
  const rough = o.rough ?? 0.5;
  for (let i = 0; i <= n; i++) {
    const u = len / 2 - (len * i) / n;
    let y = h;
    if (i > 0 && i < n) y -= rnd() * rough;
    for (const dr of o.drops || []) {
      const f = 1 - Math.abs(u - dr.u) / (dr.w / 2);
      if (f > 0) y -= dr.d * Math.min(1, f * 1.6) * (0.8 + rnd() * 0.3);
    }
    s.lineTo(u, Math.max(0.6, y));
  }
  for (const w of o.windows || []) {
    const p = new THREE.Path();
    if (w.arch === 'round') archPath(p, w.x, w.y, w.w, w.h, 8);
    else rectPath(p, w.x - w.w / 2, w.y, w.x + w.w / 2, w.y + w.h);
    s.holes.push(p);
  }
  k.extrude(s, t, o.color ?? G, 0, 0, 0, { jit: 0.05 });
  // dressed sills and lintels on the openings (both faces)
  for (const w of o.windows || []) {
    k.box(w.w + 0.35, 0.2, t + 0.16, L, w.x, w.y - 0.2, 0);
    if (w.arch !== 'round') k.box(w.w + 0.45, 0.32, t + 0.1, L, w.x, w.y + w.h, 0);
  }
  for (const d of doors) {
    for (const sx of [-1, 1]) k.box(0.3, d.h - (d.arch === 'round' ? d.w / 2 : 0), t + 0.12, L, d.x + sx * (d.w / 2 + 0.15), 0, 0);
  }
}

// Push a transform on the plan line a -> b ([u, v]) at its midpoint, local
// x along the line; call fn(len) to draw, then pop.
function seg(k, a, b, y, fn) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  k.push({ x: (a[0] + b[0]) / 2, y, z: (a[1] + b[1]) / 2, ry: Math.atan2(-dz, dx) });
  fn(len);
  k.pop();
}

// Round azulejo medallion on a wall face (local +z out): granite ring,
// white tiled field, blue border, a red-and-gold device in the centre.
function medallion(k, x, y, R, z) {
  k.add(new THREE.TorusGeometry(R, R * 0.07, 4, 32), D, { x, y, z: z + 0.06 });
  k.cyl(R * 0.97, R * 0.97, 0.06, 32, 'azulejo', x, y - 0.03, z + 0.03, { rx: Math.PI / 2, smooth: true });
  k.add(new THREE.TorusGeometry(R * 0.86, R * 0.05, 3, 32), 'doorBlue', { x, y, z: z + 0.07 });
  k.add(new THREE.TorusGeometry(R * 0.45, R * 0.04, 3, 24), 'doorBlue', { x, y, z: z + 0.07 });
  k.cyl(R * 0.3, R * 0.3, 0.05, 16, 'flowerRed', x, y - 0.025, z + 0.08, { rx: Math.PI / 2 });
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    k.box(R * 0.06, R * 0.32, 0.05, 'doorBlue', x + Math.cos(a) * R * 0.63, y + Math.sin(a) * R * 0.63 - R * 0.16, z + 0.08, { rz: a - Math.PI / 2 });
  }
  k.cyl(R * 0.1, R * 0.1, 0.06, 10, 'gold', x, y - 0.03, z + 0.1, { rx: Math.PI / 2 });
}

function smallMedallion(k, x, y, R, z, accent) {
  k.cyl(R, R, 0.06, 18, 'doorBlue', x, y - 0.03, z + 0.03, { rx: Math.PI / 2 });
  k.cyl(R * 0.78, R * 0.78, 0.06, 18, 'azulejo', x, y - 0.03, z + 0.06, { rx: Math.PI / 2 });
  k.cyl(R * 0.4, R * 0.4, 0.05, 12, accent, x, y - 0.025, z + 0.09, { rx: Math.PI / 2 });
}

// Stone sarcophagus (chest and gabled lid), long side along x.
function sarcophagus(k, x, z, ry, l = 2.1) {
  k.push({ x, y: P, z, ry });
  k.box(l, 0.6, 0.8, D, 0, 0, 0, { jit: 0.06 });
  k.box(l + 0.1, 0.16, 0.9, L, 0, 0.6, 0);
  k.box(l, 0.18, 0.5, L, 0, 0.76, 0);
  k.pop();
}

// Granite wayside cross on two steps.
function cruzeiro(k, x, z) {
  k.box(2.4, 0.35, 2.4, D, x, P, z);
  k.box(1.6, 0.35, 1.6, L, x, P + 0.35, z);
  k.box(0.7, 0.6, 0.7, L, x, P + 0.7, z);
  k.cyl(0.16, 0.2, 2.8, 8, L, x, P + 1.3, z);
  k.box(0.26, 0.9, 0.22, L, x, P + 4.1, z);
  k.box(1.1, 0.24, 0.22, L, x, P + 4.4, z);
}

function paco(k, { footprint, dims }) {
  const H = dims?.height_m?.total ?? 12;
  const rnd = mulberry32(108362147);
  const outline = footprint.outline;
  const inner = offset(outline, -0.55);

  k.begin('main');
  // ---------------------------------------------------------------- terrace
  k.prism(outline, -0.9, P + 0.9, G, { jit: 0.03 });
  k.prism(offset(outline, 0.2), -0.9, 1.5, D);
  // gravel top and the parapet with its coping
  k.prism(inner, P, 0.06, 'sand');
  k.prism(outline, P, 1.0, G, { holes: [inner] });
  k.prism(offset(outline, 0.06), P + 1.0, 0.14, L, { holes: [offset(outline, -0.62)] });
  // a lawn on the east part of the terrace (aerial photo)
  k.prism([[7, -3], [19.2, -3.6], [20.6, 10.8], [8, 11.5]], P + 0.06, 0.04, 'grass');
  // a low square bastion at the south-east corner of the retaining wall
  k.box(2.6, P + 2.4, 2.6, G, 13.4, -0.9, 19.8, { jit: 0.04 });
  k.box(2.9, 0.2, 2.9, L, 13.4, P + 1.5, 19.8);

  // ---------------------------------------------------------------- south wall
  // (local +z out, at z 21.72, x -16.36..15.31): azulejo medallions
  k.push({ x: 0, y: 0, z: 21.72, ry: 0 });
  medallion(k, 0.0, 2.3, 1.75, 0);
  medallion(k, 8.3, 2.3, 1.75, 0);
  const cl = [[-9.2, 2.9, 'flowerRed'], [-7.95, 3.25, 'flowerYellow'], [-6.7, 3.25, 'flowerRed'], [-5.45, 2.9, 'flowerYellow'], [-7.3, 1.75, 'flowerPink']];
  for (const [x, y, c] of cl) smallMedallion(k, x, y, 0.55, 0, c);
  k.box(4.2, 0.08, 0.05, 'doorBlue', -7.3, 1.0, 0.04);
  k.pop();

  // ---------------------------------------------------------------- the ruin
  // Ruin frame: origin (1.5, -9), u along the north edge, v to the south.
  const th = 0.164835; // atan(5.12 / 30.77)
  k.push({ x: 1.5, y: P, z: -9, ry: th });
  const T = 1.1;
  const wall = (a, b, h, o = {}) => seg(k, a, b, 0, (len) => ruinWall(k, rnd, len, h, T, o));
  // north range: back wall along the north edge, two rows of openings
  const nWin = [];
  // (walls 6-7.4 m above the terrace so the chimney stands clear of them,
  // as in the aerial photo, within the 12 m height of the site)
  for (const u of [-5.5, -1.5, 2.2, 5.6, 9.0]) {
    nWin.push({ x: u - 1.5, y: 1.4, w: 1.1, h: 1.4 });
    nWin.push({ x: u - 1.5, y: 3.9, w: 1.3, h: 1.7 });
  }
  wall([-9, -7], [12, -7], 7.0, { windows: nWin, rough: 0.4, drops: [{ u: 8.5, w: 3.5, d: 1.1 }] });
  // north range, inner (courtyard) wall with two rows of windows (photo)
  const cWin = [];
  for (const u of [-3.6, -0.6, 2.4]) {
    cWin.push({ x: u, y: 1.3, w: 1.2, h: 1.5 });
    cWin.push({ x: u, y: 3.8, w: 1.3, h: 1.7 });
  }
  wall([1, -0.6], [12, -0.6], 6.6, { windows: cWin, doors: [{ x: -4.7, w: 1.4, h: 2.6 }], rough: 0.4, drops: [{ u: 5.2, w: 2.2, d: 0.8 }] });
  // east end of the north range
  wall([12, -7.55], [12, -0.05], 6.2, { windows: [{ x: 0, y: 3.6, w: 1.1, h: 1.5 }], rough: 0.4, drops: [{ u: -2, w: 3, d: 1.1 }] });
  // west wall, full depth, an arched window and a slit
  wall([-9, -7.55], [-9, 9.05], 7.2, { windows: [{ x: 2.5, y: 3.4, w: 1.3, h: 2.4, arch: 'round' }, { x: -4.5, y: 1.8, w: 0.4, h: 1.4 }, { x: 5.6, y: 1.3, w: 0.9, h: 1.2 }], rough: 0.4, drops: [{ u: -6.2, w: 2.6, d: 1.0 }] });
  // front-left block: south face with the high arched window (photo)
  wall([-9.55, 8.5], [-0.45, 8.5], 7.2, { windows: [{ x: -1.2, y: 3.6, w: 1.4, h: 2.4, arch: 'round' }, { x: 2.6, y: 1.2, w: 0.8, h: 1.0 }, { x: -3.4, y: 1.2, w: 0.8, h: 1.0 }], rough: 0.3 });
  // its inner cross wall, broken low in the middle
  wall([-8.45, 2.6], [-1.55, 2.6], 6.4, { doors: [{ x: 0, w: 2.0, h: 3.0, arch: 'round' }], drops: [{ u: 1.8, w: 2.6, d: 2.0 }] });
  // the square block: round-arched doorway, small window above, level top
  wall([-1, 9.5], [6, 9.5], 7.4, { doors: [{ x: 0.2, w: 2.6, h: 3.5, arch: 'round' }], windows: [{ x: 0.2, y: 4.8, w: 1.0, h: 0.9 }], rough: 0.2 });
  wall([6, 9.5 + 0.55], [6, -0.05], 7.4, { windows: [{ x: 1.2, y: 4.2, w: 1.0, h: 1.3 }], rough: 0.2, drops: [{ u: -3.6, w: 2, d: 0.7 }] });
  wall([-1, 9.5 + 0.55], [-1, -0.05], 7.0, { doors: [{ x: -2.2, w: 1.4, h: 2.6, arch: 'round' }], rough: 0.3 });
  wall([-1.55, -0.6], [1.55, -0.6], 6.6, { rough: 0.4 });
  // corner piers where the walls meet (dressed quoins)
  for (const [u, v, h] of [[-9, -7, 6.8], [12, -7, 6.0], [-9, 8.5, 7.0], [6, 9.5, 7.2], [-1, 9.5, 7.2], [12, -0.6, 6.0]]) {
    k.box(1.5, h, 1.5, L, u, 0, v, { jit: 0.05 });
  }
  // the chimney: a tall round shaft at the north-west corner (13 m)
  const cu = -7.9;
  const cv = -5.9;
  const cTop = H + 1.0 - P; // 13 m above the base (fit guard warns above 13.2)
  k.box(2.2, 3.2, 2.2, G, cu, 0, cv, { jit: 0.04 });
  k.cyl(0.72, 0.95, cTop - 3.2 - 0.4, 12, L, cu, 3.2, cv);
  k.cyl(0.95, 0.95, 0.4, 12, L, cu, cTop - 0.4, cv);
  k.cyl(0.5, 0.5, 0.06, 10, 'dark', cu, cTop, cv);
  // fallen blocks inside the ruin
  for (let i = 0; i < 9; i++) {
    const u = -7 + rnd() * 18;
    const v = -5.5 + rnd() * 4.5;
    k.box(0.6 + rnd() * 0.6, 0.4 + rnd() * 0.3, 0.5 + rnd() * 0.5, i % 2 ? D : L, u, 0, v, { ry: rnd() * 3 });
  }
  // earth floor of the rooms
  k.box(20.6, 0.06, 6.0, 'earth', 1.5, 0.02, -3.8);
  k.box(7.4, 0.06, 5.6, 'earth', -5, 0.02, 5.6);
  k.pop();

  // ---------------------------------------------------------------- museum
  cruzeiro(k, -15.5, 3.5);
  sarcophagus(k, 9.5, 14.5, 0.1);
  sarcophagus(k, 13.2, 9.0, -0.3);
  sarcophagus(k, 3.0, 15.5, 0.0, 1.8);
  sarcophagus(k, -3.5, 15.0, 0.05);
  // column drums, a capital and carved stones along the paths
  for (const [x, z] of [[17.5, 1.5], [18.2, 4.0], [17.0, -1.5], [-12, 12], [-10, 15]]) {
    k.cyl(0.38, 0.4, 0.6 + rnd() * 0.5, 10, L, x, P, z);
  }
  k.box(1.0, 0.5, 1.0, L, 18.5, P, 7.0);
  k.box(1.4, 0.45, 0.9, D, -18, P, 8);
  k.end('main');
}

paco.metric = true;
paco.rule = {
  front: 175,
  view: 0.35,
  note: 'whole OSM way (the walled terrace, tag ruins) as a 3.6 m granite platform with parapet and the azulejo medallions; on it the roofless palace walls with broken tops, window and door openings, the round chimney to 13 m, and the open-air museum pieces (cross, sarcophagi, column drums). Front snapped to the south wall.',
};

export default { 'paco-condes': paco };
