// Capela de Nossa Senhora da Ponte (Barcelos), metric builder.
// OSM way 185199531 (12.0 x 12.1 m, almost square). data/dimensions.json:
// 12 m total (estimate; the finial is the tallest point).
//
// Photos (assets/img/capela-ponte*.jpg): a small square chapel at the end
// of the medieval bridge. A granite base carries an open gallery on all four
// sides: round granite columns on square plinths, a plain entablature and a
// low terracotta lean-to roof. Inside the gallery, the chapel proper: a
// white plastered square body with granite corner pilasters and a granite
// cornice with a serrated edge, a rectangular window on one face and a small
// arched window with a grille on the front, and above it a steep pyramidal
// terracotta roof with a slim granite pinnacle on each corner and a small
// bell gable on the front slope. A granite door in the front face.
//
// Frame (fit.js): rule.front 95.9 snaps to the east edge, so +z = east
// (the street side with the door).
import * as THREE from 'three';
import { MAT, archPath } from '../kit.js';
import { bbox, edges, offset } from '../geom.js';
import { skirtRoof } from '../metric.js';

const W = 'white';
const G = 'graniteWarm';
const GL = 'graniteLight';
const GD = 'graniteDark';

function capela(k, { footprint: f, dims }) {
  const H = dims?.height_m?.total ?? 12;
  const out = f.outline;
  const b = bbox(out);
  const yS = 1.4; // gallery floor (the granite base)
  const yE = 4.5; // top of the columns, the entablature
  const IN = 2.7; // the chapel body stands this far inside the outline
  const body = offset(out, -IN);
  const bb = bbox(body);
  const yC = H - 3.5; // body cornice
  const rise = H - 0.7 - yC - 0.15; // pyramid roof up to the finial

  k.begin('main');
  // -------------------------------------------------------- base and floor
  k.prism(out, 0, 0.75, G, { jit: 0.04 });
  k.prism(offset(out, -0.4), 0.75, yS - 0.75, G, { jit: 0.04 });
  k.prism(offset(out, -0.4), yS, 0.05, GL);

  // ----------------------------------------------------------- gallery
  // columns round the inner edge of the base, five bays a side
  const ring = offset(out, -0.95);
  const cols = [];
  for (const e of edges(ring)) {
    for (let i = 0; i < 5; i++) cols.push([e.a[0] + (e.b[0] - e.a[0]) * (i / 5), e.a[1] + (e.b[1] - e.a[1]) * (i / 5)]);
  }
  for (const [x, z] of cols) {
    k.box(0.62, 0.3, 0.62, GL, x, yS + 0.05, z);
    k.column(yE - yS - 0.35, 0.21, GL, x, yS + 0.35, z, { smooth: true });
    k.box(0.5, 0.18, 0.5, GL, x, yE - 0.18, z);
  }
  // iron rail between the columns (a gap for the door)
  for (const e of edges(ring)) {
    const front = e.nz > 0.9;
    k.push({ x: e.mx, y: yS + 0.05, z: e.mz, ry: e.ry });
    const n = Math.floor(e.len / 0.5);
    for (let i = 0; i <= n; i++) {
      const u = -e.len / 2 + (i * e.len) / n;
      if (front && Math.abs(u) < 0.9) continue;
      k.box(0.035, 0.78, 0.035, 'iron', u, 0.12, 0);
    }
    if (front) {
      k.box(e.len / 2 - 0.9, 0.05, 0.05, 'iron', -(e.len / 4 + 0.45), 0.85, 0);
      k.box(e.len / 2 - 0.9, 0.05, 0.05, 'iron', e.len / 4 + 0.45, 0.85, 0);
    } else k.box(e.len, 0.05, 0.05, 'iron', 0, 0.85, 0);
    k.pop();
  }
  // entablature slab over the gallery and the lean-to roof
  k.prism(out, yE, 0.4, GL, { holes: [body] });
  skirtRoof(k, out, yE + 0.4, IN, 1.75, 'terracotta', { cap: false });
  // lean-to hips
  for (let i = 0; i < out.length; i++) {
    const a = out[i];
    const r = skirtRingPoint(body, out, i);
    k.segment([a[0], yE + 0.4, a[1]], [r[0], yE + 0.4 + 1.75, r[1]], 0.16, 0.1, 'terracotta', { ext: 0.1 });
  }
  // eaves gutter
  k.prism(offset(out, 0.03), yE + 0.3, 0.12, 'iron', { holes: [offset(out, -0.1)] });

  // ----------------------------------------------------------- the chapel
  k.prism(body, yS, yC - yS, W, { jit: 0.01 });
  // granite pilasters on the four corners
  for (const [x, z] of [[bb.x0, bb.z0], [bb.x1, bb.z0], [bb.x0, bb.z1], [bb.x1, bb.z1]]) {
    k.box(0.75, yC - yS, 0.75, GL, x + (x < bb.cx ? 0.3 : -0.3), yS, z + (z < bb.cz ? 0.3 : -0.3), { jit: 0.05 });
  }
  // cornice with a serrated lower edge (the dentil band in the photos)
  k.prism(offset(body, 0.35), yC, 0.4, GL, { holes: [offset(body, -0.1)] });
  for (const e of edges(body)) {
    k.push({ x: e.mx + e.nx * 0.3, y: yC - 0.22, z: e.mz + e.nz * 0.3, ry: e.ry });
    const n = Math.floor(e.len / 0.4);
    for (let i = 0; i < n; i++) k.box(0.2, 0.22, 0.2, GL, -e.len / 2 + (i + 0.5) * (e.len / n), 0, 0);
    k.pop();
  }
  // pyramid roof and its finial
  k.hipRoof(bb.w, bb.d, rise, 'terracotta', bb.cx, yC + 0.4, bb.cz, { over: 0.45 });
  k.cyl(0.07, 0.07, 0.6, 6, GL, bb.cx, yC + 0.4 + rise - 0.15, bb.cz);
  k.sphere(0.14, GL, bb.cx, yC + 0.4 + rise + 0.5, bb.cz, { seg: 6, rings: 4, flat: true });
  // a slim pinnacle on each corner of the cornice
  for (const [x, z] of [[bb.x0 + 0.1, bb.z0 + 0.1], [bb.x1 - 0.1, bb.z0 + 0.1], [bb.x0 + 0.1, bb.z1 - 0.1], [bb.x1 - 0.1, bb.z1 - 0.1]]) {
    k.box(0.5, 0.5, 0.5, GL, x, yC + 0.4, z);
    k.cyl(0.06, 0.18, 0.95, 6, GL, x, yC + 0.9, z);
    k.cone(0.2, 0.3, 6, GL, x, yC + 1.85, z);
  }

  // ------------------------------------------------ the front (+z) and sides
  const zf = bb.z1;
  k.push({ x: bb.cx, z: zf, ry: 0 });
  // granite door, dark leaf, a step
  k.surround({ x: 0, y: yS, w: 1.5, h: 2.7, arch: 'round' }, 0.28, 0.2, GL, 0);
  const door = new THREE.Shape();
  archPath(door, 0, yS, 1.4, 2.6, 8);
  k.plane(door, 'wood', 0, 0, 0.03, { mat: MAT.smooth });
  k.box(2.4, 0.16, 0.7, GL, 0, yS, 0.25);
  // arched window with a grille, and the bell gable on the roof slope
  const yw = yE + 0.4 + 1.75 + 0.35; // above the lean-to roof
  k.surround({ x: 1.4, y: yw, w: 0.9, h: 1.5, arch: 'round' }, 0.2, 0.16, GL, 0);
  const pane = new THREE.Shape();
  archPath(pane, 1.4, yw, 0.9, 1.5, 8);
  k.plane(pane, 'glass', 0, 0, 0.03, { mat: MAT.flat, emit: 0.1 });
  for (const dx of [-0.2, 0.2]) k.box(0.04, 1.3, 0.05, 'iron', 1.4 + dx, yw + 0.05, 0.07);
  k.box(0.9, 0.04, 0.05, 'iron', 1.4, yw + 0.6, 0.07);
  k.surround({ x: -1.4, y: yw + 0.2, w: 0.8, h: 1.2 }, 0.2, 0.16, GL, 0);
  k.plane(rectShape(-1.4, yw + 0.2, 0.8, 1.2), 'glass', 0, 0, 0.03, { mat: MAT.flat, emit: 0.1 });
  // bell gable
  k.box(0.95, 1.2, 0.5, GL, 0, yC + 0.55, -0.25);
  const gable = new THREE.Shape();
  gable.moveTo(-0.55, 0);
  gable.lineTo(0.55, 0);
  gable.lineTo(0, 0.55);
  gable.closePath();
  k.extrude(gable, 0.5, GL, 0, yC + 1.75, -0.25);
  k.box(0.04, 0.5, 0.04, GL, 0, yC + 2.3, -0.25);
  k.box(0.28, 0.04, 0.04, GL, 0, yC + 2.6, -0.25);
  k.pop();
  // a rectangular window on the left face
  k.push({ x: bb.x0, z: bb.cz, ry: -Math.PI / 2 });
  k.surround({ x: 0, y: yw + 0.2, w: 0.8, h: 1.2 }, 0.2, 0.16, GL, 0);
  k.plane(rectShape(0, yw + 0.2, 0.8, 1.2), 'glass', 0, 0, 0.03, { mat: MAT.flat, emit: 0.1 });
  k.pop();
  k.end('main');
}

// the lean-to hip rises from outline vertex i to the matching vertex of the body ring
function skirtRingPoint(body, out, i) {
  return body[i];
}

function rectShape(cx, y, w, h) {
  const s = new THREE.Shape();
  s.moveTo(cx - w / 2, y);
  s.lineTo(cx + w / 2, y);
  s.lineTo(cx + w / 2, y + h);
  s.lineTo(cx - w / 2, y + h);
  s.closePath();
  return s;
}

capela.metric = true;
capela.rule = {
  front: 95.9,
  view: 0.55,
  note: 'east door front (rule.front 95.9): granite base, open gallery of 20 round granite columns with an iron rail, lean-to tile roof, white square chapel with granite corner pilasters, serrated cornice, windows and a granite door, steep pyramid roof with corner pinnacles and a bell gable.',
};

export default { 'capela-ponte': capela };
