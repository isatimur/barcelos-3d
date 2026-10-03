// Interpretive architecture on real OSM outlines. Heights and decorative
// details are visual estimates, disclosed in every landmark card. The kit
// gives real primitives (cornices, crenels, quoins, bell towers, pediments),
// so each landmark reads as its type: a collegiate church with twin towers, a
// crenellated palace, a five-arch bridge, a market hall, a stadium.
import { bbox, edges, inside, offset, centroid } from '../geom.js';
import { polyWindows, polyBand, polyCornice, roofOver, onEdge } from '../metric.js';
import { corniceProfile } from '../kit.js';
import { win, pediment, flutedColumn, cartouche, tablet } from '../parts.js';

function wrap(fn) {
  fn.metric = true;
  fn.rule = { snap: false, note: 'Interpretive architecture, OSM footprint; estimated height and decorative detail.' };
  return fn;
}

const EAVE = corniceProfile('eave', 0.5);
const CLASSIC = corniceProfile('classic', 0.6);
const CORNERS = (b) => [[b.x1, b.z1], [b.x1, b.z0], [b.x0, b.z0], [b.x0, b.z1]];
const FRONT_EDGE = (f) => edges(f.outline).filter((e) => e.len > 4).sort((a, b) => b.len - a.len)[0];

// Corner quoins on the bounding box, and a string course.
function quoins(k, b, h, q, color) {
  for (const [x, z] of CORNERS(b)) k.box(q, h, q, color, x, 0, z);
}

// Square belfry tower from the ground to exactly `h` (apex), with quoins,
// an arched belfry, a cornice and a pyramid cap. Tallest element: a church's
// façade towers or a palace turret.
function squareTower(k, x, z, w, h, o = {}) {
  const body = o.body ?? 'plaster';
  const trim = o.trim ?? 'granite';
  k.push({ x, z, ry: o.ry ?? 0 });
  k.box(w * 1.06, h * 0.04, w * 1.06, 'graniteDark', 0, 0, 0);
  k.box(w, h * 0.67, w, body, 0, 0, 0);
  const q = w * 0.16;
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) k.box(q, h * 0.67, q, trim, sx * (w / 2 - q / 2), 0, sz * (w / 2 - q / 2));
  // one tall louvred window low, an oculus above
  win(k, 0, h * 0.22, w * 0.2, h * 0.26, w / 2, { pane: 'glass', trim, arch: 'round' });
  k.corniceRing(w, w, corniceProfile('eave', w * 0.07), trim, 0, h * 0.67, 0);
  const bh = h * 0.17;
  for (const r of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    k.push({ y: h * 0.7, ry: r });
    k.gate(w * 0.92, bh, 0.28, [{ x: 0, w: w * 0.46, h: bh * 0.72, pointed: false }], body, 0, 0, w * 0.46 - 0.14);
    k.pop();
  }
  k.box(w * 0.5, bh * 0.66, w * 0.5, 'dark', 0, h * 0.71, 0);
  k.corniceRing(w * 1.02, w * 1.02, corniceProfile('classic', w * 0.08), trim, 0, h * 0.87, 0);
  k.cone(w * 0.66, h * 0.13, 4, trim, 0, h * 0.87, 0); // apex at h
  if (o.cross !== false) {
    k.box(0.12, h * 0.05, 0.12, 'iron', 0, h, 0);
    k.box(w * 0.13, 0.12, 0.12, 'iron', 0, h + h * 0.03, 0);
  }
  k.pop();
}

function building(k, { footprint: f, dims }, style = 'house') {
  const H = dims.height_m.total;
  const b = bbox(f.outline);
  const wallH = style === 'civic' ? H - 0.5 : H - 2.5;
  k.begin('main');
  k.prism(f.outline, 0, wallH, 'plaster');
  polyBand(k, f.outline, 0, 0.9, 0.14, 'graniteDark'); // plinth
  quoins(k, b, wallH, Math.max(0.7, Math.min(1.1, b.w * 0.05)), 'graniteLight');
  polyBand(k, f.outline, Math.min(wallH - 0.6, wallH * 0.52), 0.26, 0.12, 'granite'); // string course
  polyCornice(k, f.outline, wallH - 0.1, EAVE, 'graniteLight');
  const storeys = style === 'church' ? [wallH * 0.5] : [1.4, Math.max(4.5, wallH - 3.4)];
  polyWindows(k, f.outline, { storeys, bay: style === 'church' ? 6 : 4.2, w: 1.25, h: style === 'church' ? 3 : 2, win: { arch: style === 'church' ? 'round' : null, trim: 'graniteLight', pane: 'glass' } });
  if (style === 'civic') {
    k.prism(offset(f.outline, 0.12), wallH, 0.5, 'lead');
  } else {
    roofOver(k, f.outline, wallH, 2.5, 'terracotta', 'hip', { over: 0.06 });
    if (style === 'house') for (const [x, z] of CORNERS(b)) {
      const cx = b.cx + (x - b.cx) * 0.62, cz = b.cz + (z - b.cz) * 0.62;
      if (!inside(f.outline, cx, cz)) continue;
      k.box(0.9, 1.3, 0.9, 'brick', cx, wallH + 1.0, cz);
      k.box(1.15, 0.22, 1.15, 'lead', cx, wallH + 2.3, cz);
    }
  }
  const front = FRONT_EDGE(f);
  if (front) {
    onEdge(k, front);
    win(k, 0, 0.05, 2.4, 3.8, 0.02, { trim: 'graniteLight', pane: 'wood', arch: 'round', bw: 0.35 });
    if (style === 'civic') tablet(k, front.len * 0.16, 1.1, 0.2, 'white', 0, wallH * 0.72, 0.1);
    k.pop();
  }
  k.end('main');
}

const house = wrap((k, s) => building(k, s));
const civic = wrap((k, s) => building(k, s, 'civic'));

// Collegiate church: nave, gable roof, twin façade towers to full height,
// an apse and side buttresses.
const church = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total;
  const b = bbox(f.outline);
  const naveH = H * 0.52;
  k.begin('main');
  k.prism(f.outline, 0, naveH, 'plaster');
  polyBand(k, f.outline, 0, 0.9, 0.14, 'graniteDark');
  polyCornice(k, f.outline, naveH - 0.1, EAVE, 'graniteLight');
  polyWindows(k, f.outline, { storeys: [naveH * 0.48], bay: 5.5, w: 1.3, h: 2.8, win: { arch: 'round', trim: 'graniteLight', pane: 'glass' } });
  roofOver(k, f.outline, naveH, Math.max(2.2, H - naveH - 3), 'terracotta', 'gable', { over: 0.25 });
  // buttresses along the two long edges
  for (const e of edges(f.outline).filter((e) => e.len > 6)) {
    const n = Math.max(2, Math.floor(e.len / 5));
    for (let i = 1; i < n; i++) {
      const px = e.a[0] + (e.b[0] - e.a[0]) * (i / n);
      const pz = e.a[1] + (e.b[1] - e.a[1]) * (i / n);
      k.box(0.7, naveH * 0.8, 0.7, 'granite', px - e.nx * 0.2, 0, pz - e.nz * 0.2);
    }
  }
  // twin façade towers at the ends of the longest edge
  const front = FRONT_EDGE(f);
  if (front) {
    const w = Math.min(4.6, front.len * 0.3);
    for (const p of [front.a, front.b]) {
      const x = p[0] - front.nx * (w / 2 + 0.2) + (front.a[0] - p[0]) * 0.06;
      const z = p[1] - front.nz * (w / 2 + 0.2) + (front.a[1] - p[1]) * 0.06;
      squareTower(k, x, z, w, H, { body: 'plaster', trim: 'graniteLight', cross: true });
    }
  }
  // apse: a half-round on the opposite side to the façade
  const back = edges(f.outline).filter((e) => e.len > 4).sort((a, b2) => b2.len - a.len)[0];
  if (back) {
    const r = Math.min(4, back.len * 0.28);
    k.cyl(r, r, naveH * 0.9, 12, 'plaster', back.mx - back.nx * (r * 0.4), 0, back.mz - back.nz * (r * 0.4));
    k.cyl(r * 1.05, r * 1.05, 0.4, 12, 'graniteLight', back.mx - back.nx * (r * 0.4), naveH * 0.9, back.mz - back.nz * (r * 0.4));
    k.cone(r * 1.05, r * 0.8, 12, 'terracotta', back.mx - back.nx * (r * 0.4), naveH * 0.9 + 0.4, back.mz - back.nz * (r * 0.4));
  }
  k.end('main');
});

// Baroque temple of the Holy Cross: octagonal drum, tiled dome with a
// lantern, twin lower towers and a pedimented portal.
const domeChurch = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total;
  const b = bbox(f.outline);
  const r = Math.min(b.w, b.d) * 0.3;
  const bodyH = H - r - 3;
  k.begin('main');
  k.prism(f.outline, 0, bodyH, 'plaster');
  polyBand(k, f.outline, 0, 0.9, 0.14, 'granite');
  polyCornice(k, f.outline, bodyH - 0.1, CLASSIC, 'graniteLight');
  polyWindows(k, f.outline, { storeys: [bodyH * 0.55], bay: 4.4, w: 1.4, h: 3.2, win: { arch: 'round', trim: 'granite', pane: 'glass' } });
  roofOver(k, f.outline, bodyH, 1.6, 'terracotta', 'hip', { over: 0.1 });
  k.cyl(r, r, H - r - bodyH - 2.2, 16, 'plaster', b.cx, bodyH, b.cz); // drum
  k.dome(r, 'terracotta', b.cx, H - r - 2.2, b.cz, { seg: 24, rings: 9 });
  k.cyl(0.8, 0.95, 1.4, 10, 'graniteLight', b.cx, H - 2, b.cz); // lantern
  k.cone(1.0, 0.9, 10, 'graniteLight', b.cx, H - 0.7, b.cz);
  k.box(0.14, 0.7, 0.14, 'iron', b.cx, H - 0.05, b.cz);
  k.box(0.5, 0.12, 0.12, 'iron', b.cx, H + 0.15, b.cz);
  // twin lower towers flanking the front
  const front = FRONT_EDGE(f);
  if (front) {
    const w = Math.min(3.6, front.len * 0.22);
    for (const p of [front.a, front.b]) {
      squareTower(k, p[0] - front.nx * (w / 2 + 0.2), p[1] - front.nz * (w / 2 + 0.2), w, H * 0.82, { trim: 'graniteLight', cross: true });
    }
    onEdge(k, front);
    k.box(front.len * 0.34, 1.0, 0.5, 'graniteLight', 0, bodyH - 1.2, 0.1);
    pediment(k, front.len * 0.36, 1.6, 0.6, 'graniteLight', 0, bodyH - 0.2, 0.05);
    win(k, 0, 0.05, 2.6, 4, 0.02, { trim: 'granite', pane: 'wood', arch: 'round', bw: 0.4 });
    k.pop();
  }
  k.end('main');
});

// Palace of the Counts: a long arcaded block with four crenellated corner
// turrets and a central keep, all to the full height.
const palace = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total;
  const b = bbox(f.outline);
  const wallH = H * 0.72;
  k.begin('main');
  k.prism(f.outline, 0, wallH, 'graniteWarm');
  polyBand(k, f.outline, 0, 1.0, 0.16, 'graniteDark');
  polyCornice(k, f.outline, wallH - 0.1, CLASSIC, 'graniteLight');
  // Gothic windows on the long fronts
  for (const e of edges(f.outline).filter((e) => e.len > 8)) {
    const n = Math.max(2, Math.floor(e.len / 4.5));
    for (let i = 0; i < n; i++) {
      const px = e.a[0] + (e.b[0] - e.a[0]) * ((i + 0.5) / n);
      const pz = e.a[1] + (e.b[1] - e.a[1]) * ((i + 0.5) / n);
      k.push({ x: px, z: pz, ry: e.ry });
      win(k, 0, wallH * 0.45, 1.5, 2.8, 0.05, { trim: 'graniteLight', pane: 'glass', arch: 'pointed' });
      k.pop();
    }
  }
  // ground-floor arcade on the front
  const front = FRONT_EDGE(f);
  if (front && front.len > 10) {
    onEdge(k, front);
    k.arcade(front.len * 0.7, wallH * 0.34, 0.5, Math.max(3, Math.floor(front.len / 4)), 2.4, wallH * 0.3, 'graniteLight', 0, 0.2, 0.2, { pointed: true });
    k.pop();
  }
  // four corner turrets + a central keep (the tallest, near H)
  const tw = Math.min(5, b.w * 0.16);
  for (const [x, z] of CORNERS(b)) {
    const cx = b.cx + (x - b.cx) * 0.82, cz = b.cz + (z - b.cz) * 0.82;
    k.box(tw, H * 0.86, tw, 'graniteWarm', cx, 0, cz);
    k.crenels(tw, tw, 'granite', cx, H * 0.86, cz, { mw: 0.9, mh: 0.9, t: 0.5 });
    k.cone(tw * 0.5, Math.max(0.6, H * 0.1), 4, 'terracotta', cx, H * 0.86 + 0.9, cz);
  }
  k.box(tw * 1.3, H * 0.94, tw * 1.3, 'graniteWarm', b.cx, 0, b.cz);
  k.crenels(tw * 1.3, tw * 1.3, 'granite', b.cx, H * 0.94, b.cz, { mw: 1.0, mh: 1.0, t: 0.5 });
  k.cone(tw * 0.7, Math.max(0.6, H * 0.12), 4, 'terracotta', b.cx, H * 0.94 + 1.0, b.cz);
  k.end('main');
});

// Medieval keep: stone shaft, corbel table, crenellated parapet, arrow slits.
const tower = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total;
  const b = bbox(f.outline);
  const w = Math.min(b.w, b.d);
  k.begin('main');
  k.prism(f.outline, 0, H - 2.2, 'granite');
  polyBand(k, f.outline, 0, 1.0, 0.18, 'graniteDark');
  polyBand(k, f.outline, H * 0.45, 0.4, 0.1, 'graniteDark');
  polyWindows(k, f.outline, { storeys: [H * 0.28, H * 0.62], bay: 5, w: 0.7, h: 1.8, win: { trim: 'graniteLight', pane: 'dark' } });
  k.crenels(w * 0.98, w * 0.98, 'granite', b.cx, H - 2.1, b.cz, { mw: 1.2, mh: 1.5, t: 0.7 });
  k.cone(w * 0.34, 2.0, 4, 'terracotta', b.cx, H - 0.6, b.cz);
  k.box(0.2, 1.0, 0.2, 'iron', b.cx, H + 1.5, b.cz);
  k.end('main');
});

// Five arched spans, a roadway and parapets with a pale coping.
const bridge = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total, b = bbox(f.outline), alongZ = b.d > b.w, L = Math.max(b.w, b.d), W = Math.min(b.w, b.d);
  k.begin('main'); k.push({ x: b.cx, z: b.cz, ry: alongZ ? Math.PI / 2 : 0 });
  for (const z of [-W * 0.38, W * 0.38]) k.arcade(L, H - 0.9, Math.max(0.7, W * 0.28), 5, L / 5 * 0.76, H * 0.78, 'granite', 0, 0, z, { pointed: true });
  k.box(L, 0.5, W, 'graniteLight', 0, H - 1.1, 0);
  k.box(L, 0.14, W * 0.62, 'dark', 0, H - 0.82, 0);
  for (const z of [-W / 2 + 0.16, W / 2 - 0.16]) { k.box(L, 0.6, 0.32, 'granite', 0, H - 0.6, z); k.box(L, 0.16, 0.4, 'graniteLight', 0, H - 0.28, z); }
  k.pop(); k.end('main');
});

function garden(k, { footprint: f, dims }, park) {
  const H = dims.height_m.total, b = bbox(f.outline);
  k.begin('main'); k.prism(f.outline, 0, 0.16, 'grass');
  const step = park ? 18 : 10;
  for (let x = b.x0 + step / 2; x < b.x1 - step / 3; x += step) for (let z = b.z0 + step / 2; z < b.z1 - step / 3; z += step) {
    if (!inside(f.outline, x, z) || !inside(f.outline, x + 3, z + 3) || !inside(f.outline, x - 3, z - 3)) continue;
    if (park) { k.cyl(0.2, 0.35, H * 0.45, 6, 'trunk', x, 0, z); k.sphere(H * 0.3, 'foliage', x, H * 0.7, z, { sy: 1, seg: 8, rings: 6 }); }
    else { k.box(5, 0.35, 5, 'hedge', x, 0.16, z); k.cyl(0.7, 0.7, H - 0.51, 10, 'hedge', x, 0.51, z); }
  }
  k.end('main');
}

const stadium = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total, b = bbox(f.outline), pitch = f.parts.find((p) => p.tag === 'pitch')?.pts;
  const hole = pitch || f.outline.map(([x, z]) => [b.cx + (x - b.cx) * 0.62, b.cz + (z - b.cz) * 0.62]);
  k.begin('main');
  k.prism(f.outline, 0, H * 0.35, 'graniteGrey', { holes: [hole] });
  k.prism(hole, 0.1, 0.15, 'grass');
  for (let i = 0; i < 9; i++) { const t = 0.72 + i * 0.025; const ring = f.outline.map(([x, z]) => [b.cx + (x - b.cx) * t, b.cz + (z - b.cz) * t]); const inner = ring.map(([x, z]) => [b.cx + (x - b.cx) * 0.98, b.cz + (z - b.cz) * 0.98]); k.prism(ring, H * 0.36 + i * H * 0.045, 0.7, i % 2 ? 'white' : 'maroon', { holes: [inner] }); }
  k.prism(f.outline, H - 0.8, 0.8, 'steel', { holes: [hole] });
  // four floodlight pylons at the corners, to the full height
  for (const [x, z] of CORNERS(b)) {
    const cx = b.cx + (x - b.cx) * 0.94, cz = b.cz + (z - b.cz) * 0.94;
    k.box(1.4, H * 0.55, 1.4, 'steel', cx, H * 0.35, cz);
    k.box(2.4, 1.6, 0.5, 'white', cx, H - 1.4, cz);
  }
  k.end('main');
});

// Market hall: an arcaded ground floor, a flat roof that follows the plan and
// a clock on the front wall (a hip roof's box would overfill the market square).
const market = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total, b = bbox(f.outline), wallH = H - 0.6;
  k.begin('main');
  k.prism(f.outline, 0, wallH, 'plaster');
  polyBand(k, f.outline, 0, 0.8, 0.14, 'graniteDark');
  polyCornice(k, f.outline, wallH - 0.1, EAVE, 'graniteLight');
  const front = FRONT_EDGE(f);
  if (front) {
    onEdge(k, front);
    k.arcade(front.len * 0.8, wallH * 0.72, 0.5, Math.max(3, Math.floor(front.len / 4)), 3.2, wallH * 0.56, 'graniteLight', 0, 0.2, 0.2, {});
    k.cyl(0.6, 0.6, 0.25, 14, 'white', 0, wallH * 0.82, 0.3, { rx: Math.PI / 2 });
    k.pop();
  }
  k.prism(offset(f.outline, 0.12), wallH, H - wallH, 'lead');
  k.end('main');
});

// Municipal theatre: a theatre block with shallow pilasters, a cornice band
// and a marquee over the entrance (flat roof, flush detail).
const theatre = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total, b = bbox(f.outline), wallH = H - 0.6;
  k.begin('main');
  k.prism(f.outline, 0, wallH, 'plaster');
  polyBand(k, f.outline, 0, 0.9, 0.14, 'graniteDark');
  polyCornice(k, f.outline, wallH - 0.1, CLASSIC, 'graniteLight');
  polyWindows(k, f.outline, { storeys: [wallH * 0.35, wallH * 0.75], bay: 4, w: 1.2, h: 2.6, win: { arch: null, trim: 'graniteLight', pane: 'glass' } });
  const front = FRONT_EDGE(f);
  if (front) {
    onEdge(k, front);
    const n = Math.max(4, Math.floor(front.len / 4));
    for (let i = 0; i < n; i++) k.box(0.5, wallH * 0.86, 0.35, 'graniteLight', -front.len * 0.3 + front.len * 0.6 * (i / (n - 1)), 0, 0.2);
    k.box(front.len * 0.66, 0.8, 0.6, 'graniteLight', 0, wallH * 0.86, 0.3);
    win(k, 0, 0.05, 2.6, 3.4, 0.02, { trim: 'graniteLight', pane: 'wood', arch: null, bw: 0.35 });
    k.pop();
  }
  k.prism(offset(f.outline, 0.12), wallH, H - wallH, 'lead');
  k.end('main');
});

// Parish chapel: nave with a gable roof and a bell gable on the front.
const chapel = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total, b = bbox(f.outline), wallH = H * 0.72;
  k.begin('main');
  k.prism(f.outline, 0, wallH, 'plaster');
  polyBand(k, f.outline, 0, 0.8, 0.12, 'graniteDark');
  polyCornice(k, f.outline, wallH - 0.1, EAVE, 'graniteLight');
  polyWindows(k, f.outline, { storeys: [wallH * 0.5], bay: 5, w: 1.2, h: 2.4, win: { arch: 'round', trim: 'graniteLight', pane: 'glass' } });
  // outline-following tiled roof (a pitched roof's oriented box would
  // overfill this elongated, rotated plan)
  k.prism(offset(f.outline, 0.12), wallH, H - wallH, 'terracotta');
  const front = FRONT_EDGE(f);
  if (front) {
    onEdge(k, front);
    const gw = Math.min(4.6, front.len * 0.24);
    k.gate(gw, H - wallH + 1.4, 0.5, [{ x: 0, w: gw * 0.46, h: H * 0.2, pointed: false }], 'plaster', 0, wallH - 0.2, 0.2);
    k.box(gw + 0.6, 0.35, 0.7, 'graniteLight', 0, wallH + H - wallH + 1.05, 0.2);
    k.cone(gw * 0.34, 1.2, 4, 'graniteLight', 0, wallH + H - wallH + 1.2, 0.2);
    win(k, 0, 0.05, 2.2, 3.4, 0.02, { trim: 'graniteLight', pane: 'wood', arch: 'round', bw: 0.35 });
    k.pop();
  }
  k.end('main');
});

export const detailedBuilders = {
  'ponte-medieval': bridge,
  'bom-jesus-cruz': domeChurch,
  'igreja-matriz': church,
  'paco-condes': palace,
  'torre-menagem': tower,
  'museu-olaria': civic,
  'pacos-concelho': civic,
  'solar-pinheiros': house,
  'teatro-gil-vicente': theatre,
  'estadio-cidade': stadium,
  'parque-cidade': wrap((k, s) => garden(k, s, true)),
  'jardim-barrocas': wrap((k, s) => garden(k, s, false)),
  'mercado-municipal': market,
  'igreja-barcelinhos': chapel,
};
