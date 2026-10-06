// Paços do Concelho de Barcelos (Câmara Municipal), metric builder.
// OSM way 108362148: a 17-corner outline of 76 x 62 m, several joined
// wings. data/dimensions.json: 15 m total (estimate; towers and bell cages
// are the tallest parts).
//
// Photos (assets/img/pacos-concelho*.jpg): the town hall faces east to the
// street on its long straight edge (43.6 m). Ground floor: a granite
// arcade, four big round arches of rusticated ashlar from the south corner
// (where a massive granite corner pilaster stands), then a carved wooden
// door under the clock tower and smaller arches to the north end. First
// floor: cream plaster with tall French windows in grey-granite surrounds
// and little iron balconies full of flowers. The clock tower stands over
// the door: a granite pilaster at each side, a large S-curved moulding
// arch, a coat of arms and a round clock; on top an iron bell cage. A
// second, smaller tower stands behind the north end. The cornice carries
// brackets and, above it, square merlon posts with pyramid caps. The south
// end face (edge 2) is plain plaster with two storeys of windows.
//
// Frame (fit.js): rule.front 80 snaps to the east arcade edge, so +z = east
// (street side), +x = north. The arcade runs x -17.81..25.8 at z 39.4.
import * as THREE from 'three';
import { corniceProfile, MAT, archPath } from '../kit.js';
import { edges, inside } from '../geom.js';
import { polyWindows, polyCornice, onEdge, skirtRoof } from '../metric.js';
import { win, cartouche, bell } from '../parts.js';

const CREAM = 'cream';
const G = 'granite';
const GL = 'graniteLight';
const GD = 'graniteDark';
const GG = 'graniteGrey';
const BRACKET = corniceProfile('classic', 0.7);

// Windows with the French-window proportions of the first floor.
function french(k, x, y, w, h, z, balcony) {
  win(k, x, y, w, h, z, { trim: G, pane: 'glass', bw: 0.22, depth: 0.22, head: 'flat', balcony: balcony ? 'iron' : undefined });
  if (balcony) {
    // flower box on the balcony rail
    const c = ['flowerRed', 'flowerPink', 'flowerRed', 'flowerYellow'][Math.abs(Math.round(x * 3)) % 4];
    k.box(w + 0.5, 0.22, 0.34, 'hedge', x, y + 0.9, z + 1.4);
    k.box(w + 0.35, 0.2, 0.28, c, x, y + 1.12, z + 1.4);
  }
}

// Brackets under the cornice and merlon posts above it along one edge
// (pushed onto the edge, local +z out).
function crown(k, e, yW) {
  const nb = Math.max(2, Math.floor(e.len / 1.6));
  for (let i = 0; i < nb; i++) {
    k.box(0.42, 0.55, 0.5, GL, -e.len / 2 + (i + 0.5) * (e.len / nb), yW - 0.58, -0.28);
  }
  const nm = Math.max(1, Math.floor(e.len / 3.1));
  for (let i = 0; i < nm; i++) {
    const u = -e.len / 2 + (i + 0.5) * (e.len / nm);
    k.box(0.62, 0.95, 0.62, GG, u, yW + 0.5, -0.4);
    k.cone(0.5, 0.5, 4, GL, u, yW + 1.45, -0.4);
  }
}

// Iron bell cage with a bell and a cone cap, base at y.
function bellCage(k, x, y, z, w) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(0.1, 1.5, 0.1, 'iron', x + sx * w / 2, y, z + sz * w / 2);
  k.box(w + 0.2, 0.1, w + 0.2, 'iron', x, y + 1.5, z);
  k.box(w + 0.2, 0.1, w + 0.2, 'iron', x, y + 0.7, z);
  bell(k, 0.9, x, y + 0.75, z);
  k.cone(w * 0.75, 0.5, 4, 'iron', x, y + 1.6, z);
  k.box(0.04, 0.35, 0.04, 'iron', x, y + 2.05, z);
}

function pacos(k, { footprint: f, dims }) {
  const H = dims?.height_m?.total ?? 15;
  const out = f.outline;
  const E = edges(out);
  const front = E.filter((e) => e.nz > 0.95).sort((a, b) => b.len - a.len)[0];
  const yA = 4.9; // top of the arcade, string course
  const yW = 10.4; // cornice
  const DEP = 3.2; // depth of the loggia behind the arcade
  const zF = front.mz; // the arcade plane
  const x0 = Math.min(front.a[0], front.b[0]);
  const x1 = Math.max(front.a[0], front.b[0]);

  k.begin('main');
  // -------------------------------------------------------------- bodies
  // ground floor, pulled back behind the arcade; upper floors on the whole outline
  const ground = out.map((p) => (p === front.a || p === front.b ? [p[0], p[1] - DEP] : p));
  k.prism(ground, 0, yA, CREAM, { jit: 0.02 });
  k.prism(out, yA, yW - yA, CREAM, { jit: 0.02 });
  for (const e of E) {
    if (e === front || e.len < 3) continue;
    onEdge(k, e);
    k.box(e.len, 0.9, 0.3, G, 0, 0, -0.12); // granite plinth
    k.box(e.len, 0.3, 0.3, G, 0, yA, -0.12); // string course
    k.pop();
  }
  polyCornice(k, out, yW, BRACKET, GL);
  for (const e of E) {
    if (e.len < 3) continue;
    onEdge(k, e);
    crown(k, e, yW);
    k.pop();
  }
  // tiled roof behind the merlons: slopes down to the cornice on every side
  skirtRoof(k, out, yW + 0.55, 4.0, 1.7, 'terracotta');

  // ------------------------------------------------------------- arcade
  const ops = [];
  for (const x of [-13.0, -7.4, -1.8, 3.8]) ops.push({ x, w: 4.2, h: 4.5, pointed: false });
  ops.push({ x: 9.6, w: 2.5, h: 3.5, pointed: false }); // the door under the clock tower
  for (const x of [14.4, 18.5]) ops.push({ x, w: 2.7, h: 3.7, pointed: false });
  ops.push({ x: 23.0, w: 2.1, h: 3.2, pointed: false });
  const slabW = x1 - x0;
  const cx = (x0 + x1) / 2;
  k.gate(slabW, yA, 0.9, ops.map((o) => ({ ...o, x: o.x - cx })), G, cx, 0, zF - 0.45, { jit: 0.05 });
  for (const o of ops) {
    k.surround({ x: o.x, y: 0, w: o.w, h: o.h, arch: 'round' }, 0.34, 0.12, GL, zF);
  }
  k.box(slabW, 0.3, 1.0, GL, cx, yA, zF - 0.5); // string course over the arcade
  // the carved wooden door in the arch under the tower, dark rooms behind the rest
  for (const o of ops) {
    const p = new THREE.Shape();
    archPath(p, o.x, 0.1, o.w - 0.1, o.h - 0.1, 8);
    k.plane(p, o === ops[4] ? 'wood' : 'dark', 0, 0, zF - DEP + 0.05, { mat: MAT.smooth });
  }
  for (let i = -2; i <= 2; i++) k.box(0.1, 3.0, 0.05, 'bronze', 9.6 + i * 0.4, 0.2, zF - DEP + 0.12);
  // the massive corner pilaster and the pilasters round the tower
  for (const [x, w] of [[x0 + 1.0, 2.0], [6.9, 1.0], [12.3, 1.0], [x1 - 0.5, 1.0]]) {
    k.box(w, yW - yA, 0.35, G, x, yA, zF - 0.18, { jit: 0.05 });
  }
  k.box(2.0, yA, 1.0, G, x0 + 1.0, 0, zF - 0.5, { jit: 0.05 });
  // first floor on the street front: French windows above the arches, balconies
  k.push({ x: 0, z: zF, ry: 0 });
  for (const x of [-13.0, -7.4, -1.8, 3.8]) french(k, x, yA + 0.9, 1.25, 2.4, 0, true);
  for (const x of [14.4, 18.5, 22.6]) french(k, x, yA + 0.9, 1.2, 2.3, 0, true);
  k.pop();

  // -------------------------------------------------------- clock tower
  const tx = 9.6;
  const tw = 5.4;
  const tTop = yW + 2.2; // tower walls: above the merlons, below the bell cage
  k.box(tw, tTop - yW, 5.2, CREAM, tx, yW - 0.2, zF - 2.7 + 0.1);
  k.crenels(tw, 5.2, GG, tx, tTop, zF - 2.6, { mw: 0.6, mh: 0.55, t: 0.5, pointed: true });
  for (const sx of [-1, 1]) k.box(0.9, tTop - yW + 0.2, 0.5, G, tx + sx * (tw / 2 - 0.45), yW - 0.2, zF - 0.25);
  k.corniceRing(tw + 0.1, 5.2, BRACKET, GL, tx, tTop - 0.55, zF - 2.6);
  // S-curved moulding arch, the coat of arms and the clock on the tower front
  k.surround({ x: tx, y: yA + 0.4, w: 4.4, h: 5.6, arch: 'round' }, 0.28, 0.2, GL, zF);
  cartouche(k, 1.0, 1.3, 0.22, GL, tx, yA + 1.4, zF + 0.05, { scrolls: false });
  k.cyl(0.95, 0.95, 0.18, 22, GL, tx, yW - 1.9 + 0.0, zF + 0.1, { rx: Math.PI / 2, smooth: true });
  k.cyl(0.78, 0.78, 0.2, 22, 'white', tx, yW - 1.9, zF + 0.12, { rx: Math.PI / 2, smooth: true });
  k.box(0.07, 0.6, 0.05, 'iron', tx, yW - 1.9, zF + 0.24, { rz: 0.5 });
  k.box(0.06, 0.45, 0.05, 'iron', tx - 0.1, yW - 1.9 - 0.1, zF + 0.24, { rz: -1.1 });
  bellCage(k, tx, tTop + 0.6, zF - 2.6, 1.3);
  // second tower behind the north end, with its own bell cage
  const bx = 21.6;
  const bz = 31.4;
  if (inside(out, bx - 2, bz - 2) && inside(out, bx + 2, bz + 2)) {
    k.box(4.2, tTop - yW + 0.7, 4.2, CREAM, bx, yW - 0.7, bz);
    k.crenels(4.2, 4.2, GG, bx, tTop, bz, { mw: 0.55, mh: 0.5, t: 0.45, pointed: true });
    k.corniceRing(4.3, 4.3, BRACKET, GL, bx, tTop - 0.55, bz);
    k.cyl(0.55, 0.55, 0.14, 18, 'white', bx, yW + 0.7, bz + 2.15, { rx: Math.PI / 2, smooth: true });
    bellCage(k, bx, tTop + 0.6, bz, 1.2);
  }

  // ------------------------------------------------- the other faces
  polyWindows(k, out, {
    storeys: [1.2, yA + 1.1],
    bay: 3.6,
    minLen: 3.6,
    only: (e) => e !== front && e.len >= 3.6,
    storey: (s) => (s === 0 ? { w: 1.0, h: 1.5, bars: true, head: undefined } : { w: 1.15, h: 2.3, head: 'flat' }),
    win: { trim: G, pane: 'glass', bw: 0.2, depth: 0.2, sill: true },
  });
  k.end('main');
}

pacos.metric = true;
pacos.rule = {
  front: 80,
  view: 0.5,
  note: 'east street front (rule.front 80): granite arcade of round arches with the carved door under the clock tower, French windows with flower balconies, bracketed cornice with merlon posts, two towers with iron bell cages, stepped tile roof; the south end face and the other wings are plain plaster with windows.',
};

export default { 'pacos-concelho': pacos };
