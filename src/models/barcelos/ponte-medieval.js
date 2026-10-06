// Ponte Medieval de Barcelos over the Cávado, metric builder.
// OSM way 1517247585 (98.5 x 6.2 m, the long axis runs 5.5 deg east of north).
// data/dimensions.json: 8 m total (estimate: deck, railing and lamps).
//
// Sources. SIPA / pt.wikipedia: a flat-deck bridge on FIVE UNEQUAL pointed
// ("quebrados") arches, the ones over the middle of the river larger and
// higher; Gothic cutwaters (talha-mares) upstream and plain buttresses
// downstream, one on each of the four piers; granite throughout. Built
// 1325-1330, about 100 m long.
// Photos (assets/img/ponte-medieval*.jpg): ashlar spandrel walls, a ring of
// narrow voussoirs round every arch, broad piers whose upstream cutwaters
// end in a sloped cap below the deck, a stone string course under the deck
// edge, and an iron railing on a low parapet with lamp posts.
//
// Frame (fit.js): rule.front 5.5, no snap. +z = north (the town side), +x =
// west; the Cávado flows from the east, so the cutwaters are on -x.
//
// The road. cities/barcelos.json road.bridge_models hands this bridge's
// structure to this model: the engine draws only the road ribbon, 5.2 m
// wide, on a deck that rises 7 % from both ends to 6.2 m above the river
// (road-network.js). DECK below mirrors that profile (measured with the
// browser probe; keep the two in step). The model deck sits 6 cm under the
// ribbon.
//
// Fit limits: the plan may grow 10 % over the OSM extent and the height
// 10 % over 8 m. The cutwaters therefore project only 0.35 m (real ones
// project about 2 m); the arches are segmental because the deck (8 m total)
// leaves no room for the taller pointed arches of the real bridge.
import * as THREE from 'three';
import { bbox } from '../geom.js';

const G = 'granite';
const GL = 'graniteLight';
const GD = 'graniteDark';

// Road surface above the base (m) along the bridge (local z).
const DECK = [[-49.23, 3.1], [-5.0, 6.2], [17.0, 6.21], [49.23, 4.05]];
function deckY(z) {
  if (z <= DECK[0][0]) return DECK[0][1];
  for (let i = 1; i < DECK.length; i++) {
    if (z <= DECK[i][0]) {
      const [z0, y0] = DECK[i - 1];
      const [z1, y1] = DECK[i];
      return y0 + ((y1 - y0) * (z - z0)) / (z1 - z0);
    }
  }
  return DECK.at(-1)[1];
}

const SPAN = [12, 16, 20, 17, 13]; // arch spans, south to north (m)
const PIER = 3.6; // pier thickness along the bridge
const SPRING = 0.2; // springing level (just under the water)
const FLOOR = -4; // the foundations, buried
const BODY = 5.9; // width of the spandrel walls (x +-2.95)

// Segmental arch through the springings of an opening and its crown.
function arch(a) {
  const A = (a.z1 - a.z0) / 2;
  const R = (A * A + a.rise * a.rise) / (2 * a.rise);
  return { R, yc: SPRING + a.rise - R, c: (a.z0 + a.z1) / 2, phi: Math.asin(Math.min(1, A / R)) };
}

function bridge(k, { footprint: f }) {
  const b = bbox(f.outline);
  const total = SPAN.reduce((s, v) => s + v, 0) + PIER * (SPAN.length - 1);
  const abut = (b.d - total) / 2;
  // the five openings
  const arches = [];
  let z = b.z0 + abut;
  for (const span of SPAN) {
    const c = z + span / 2;
    const rise = Math.min(deckY(c) - 1.05 - SPRING, span * 0.31);
    arches.push({ z0: z, z1: z + span, rise });
    z += span + PIER;
  }

  k.begin('main');
  // ------------------------------------------------ spandrel walls and piers
  // one elevation, extruded across: the deck line on top, arches cut from below
  const top = (zz) => deckY(zz) - 0.06 - 0.5;
  const s = new THREE.Shape();
  const topPts = [b.z0, DECK[1][0], DECK[2][0], b.z1];
  s.moveTo(b.z0, top(b.z0));
  for (const zz of topPts.slice(1)) s.lineTo(zz, top(zz));
  s.lineTo(b.z1, FLOOR);
  for (let i = arches.length - 1; i >= 0; i--) {
    const a = arches[i];
    const g = arch(a);
    s.lineTo(a.z1, FLOOR);
    s.lineTo(a.z1, SPRING);
    const n = 14;
    for (let j = 1; j <= n; j++) {
      const zz = a.z1 - ((a.z1 - a.z0) * j) / n;
      s.lineTo(zz, g.yc + Math.sqrt(Math.max(0, g.R * g.R - (zz - g.c) ** 2)));
    }
    s.lineTo(a.z0, SPRING);
    s.lineTo(a.z0, FLOOR);
  }
  s.lineTo(b.z0, FLOOR);
  k.push({ ry: -Math.PI / 2 });
  k.extrude(s, BODY, G, 0, 0, 0, { jit: 0.04 });
  k.pop();

  // ------------------------------------------- voussoir rings on both faces
  for (const a of arches) {
    const g = arch(a);
    const arc = 2 * g.phi * (g.R + 0.25);
    const n = Math.max(9, Math.round(arc / 0.85));
    for (const side of [-1, 1]) {
      for (let j = 0; j < n; j++) {
        const al = -g.phi + ((j + 0.5) * 2 * g.phi) / n; // angle from the vertical
        const rm = g.R + 0.27;
        const depth = j % 2 ? 0.14 : 0.22;
        // a block lying along the ring: its long side tangent to the arch
        k.push({ x: side * (BODY / 2 + depth / 2 - 0.02), y: g.yc + rm * Math.cos(al), z: g.c + rm * Math.sin(al), rx: al });
        k.box(depth, 0.56, ((2 * g.phi * rm) / n) * 0.96, j % 4 ? GL : 'graniteWarm', 0, -0.28, 0, { jit: 0.05 });
        k.pop();
      }
    }
  }

  // ------------------------------- cutwaters upstream, buttresses downstream
  for (let i = 0; i < arches.length - 1; i++) {
    const zp = (arches[i].z1 + arches[i + 1].z0) / 2;
    const hTop = SPRING + 0.7 * Math.min(arches[i].rise, arches[i + 1].rise);
    // Gothic cutwater: a wedge to hTop under a pyramid cap (x -)
    k.prism([[-BODY / 2 + 0.02, zp - 1.75], [-BODY / 2 - 0.35, zp], [-BODY / 2 + 0.02, zp + 1.75]], FLOOR, hTop - FLOOR, G, { jit: 0.05 });
    k.cone(0.667, 1.0, 3, GL, -BODY / 2 + 0.1, hTop, zp, { ry: -Math.PI / 2, sx: 3.0, sz: 0.5, flat: true });
    // plain buttress downstream, with a sloped cap
    k.box(0.32, hTop - FLOOR, 3.5, G, BODY / 2 + 0.14, FLOOR, zp, { jit: 0.05 });
    k.frustum(0.32, 3.5, 0.02, 3.1, 0.7, GL, BODY / 2 + 0.14, hTop, zp);
  }

  // ------------------------------------------ deck, string course, parapets
  const prof = [b.z0, DECK[1][0], DECK[2][0], b.z1].map((zz) => [zz, deckY(zz)]);
  for (let i = 0; i + 1 < prof.length; i++) {
    const [za, ya] = prof[i];
    const [zb, yb] = prof[i + 1];
    // slab under the road ribbon (full width)
    k.segment([0, ya - 0.32, za], [0, yb - 0.32, zb], 6.2, 0.52, GD, { ext: 0.05 });
    for (const sd of [-1, 1]) {
      // string course under the deck edge
      k.segment([sd * 3.1, ya - 0.78, za], [sd * 3.1, yb - 0.78, zb], 0.36, 0.34, GL, { ext: 0.05 });
      // footway kerb beside the roadway (the ribbon is 5.2 m)
      k.segment([sd * 2.82, ya + 0.05, za], [sd * 2.82, yb + 0.05, zb], 0.46, 0.2, GL, { ext: 0.05 });
      // low parapet wall, coping, and the iron railing above
      k.segment([sd * 3.0, ya + 0.3, za], [sd * 3.0, yb + 0.3, zb], 0.36, 0.5, G, { ext: 0.05 });
      k.segment([sd * 3.0, ya + 0.6, za], [sd * 3.0, yb + 0.6, zb], 0.48, 0.1, GL, { ext: 0.05 });
      for (const dy of [0.95, 1.4]) k.segment([sd * 3.0, ya + dy, za], [sd * 3.0, yb + dy, zb], 0.05, 0.05, 'iron', { ext: 0.05 });
    }
  }
  for (const sd of [-1, 1]) {
    for (let zz = b.z0 + 1; zz < b.z1; zz += 2.0) k.box(0.06, 0.85, 0.06, 'iron', sd * 3.0, deckY(zz) + 0.62, zz);
  }
  // pilasters at the four ends of the parapets
  for (const sd of [-1, 1]) for (const zz of [b.z0 + 0.5, b.z1 - 0.5]) {
    k.box(0.62, 1.7, 0.62, G, sd * 2.95, deckY(zz) - 0.1, zz);
    k.box(0.72, 0.16, 0.72, GL, sd * 2.95, deckY(zz) + 1.6, zz);
    k.cone(0.42, 0.4, 4, GL, sd * 2.95, deckY(zz) + 1.76, zz);
  }
  // lamp posts on the footways at the crown of the bridge, alternate sides (photo)
  [[-2.85, -8], [2.85, 3], [-2.85, 14], [2.85, -17]].forEach(([x, zz]) => k.lamp(2.2, x, deckY(zz) + 0.15, zz, { color: 'iron' }));
  k.end('main');
}

bridge.metric = true;
bridge.rule = {
  front: 5.5,
  snap: false,
  view: 0.9,
  note: 'five unequal segmental arches on four piers, upstream cutwaters (x -) and downstream buttresses with sloped caps, voussoir rings, string course, iron railing and lamps; the deck mirrors the road profile of cities/barcelos.json road.bridge_models; cutwater projection is capped by the 10 % fit rule.',
};

export default { 'ponte-medieval': bridge };
