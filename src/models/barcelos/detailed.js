// Interpretive architecture on real OSM outlines, authored in metres. Enough
// detail per landmark (4k+ triangles) to read as the building it stands for:
// voussoirs, balustrades, quoins, crenels, battlement corbels, lanterns,
// water wheel. Heights and ornament are visual estimates (shown in the card).
import { bbox, edges, inside, offset } from '../geom.js';
import { polyWindows, polyBand, polyCornice, roofOver, onEdge } from '../metric.js';
import { corniceProfile } from '../kit.js';
import { win, pediment, tablet } from '../parts.js';
// Landmarks with their own builder file (one file per landmark). The rest
// below are shared archetypes on the OSM outline (museum, manor, stadium,
// market, parish chapel, mill house and the two gardens).
import igrejaMatriz from './igreja-matriz.js';
import pacoCondes from './paco-condes.js';
import torreMenagem from './torre-menagem.js';
import pacosConcelho from './pacos-concelho.js';
import ponteMedieval from './ponte-medieval.js';
import capelaPonte from './capela-ponte.js';
import teatroGilVicente from './teatro-gil-vicente.js';

function wrap(fn) {
  fn.metric = true;
  fn.rule = { snap: false, note: 'Interpretive architecture, OSM footprint; estimated height and decorative detail.' };
  return fn;
}

const EAVE = corniceProfile('eave', 0.5);
const CLASSIC = corniceProfile('classic', 0.6);
const CORNERS = (b) => [[b.x1, b.z1], [b.x1, b.z0], [b.x0, b.z0], [b.x0, b.z1]];
const FRONT_EDGE = (f) => edges(f.outline).filter((e) => e.len > 3).sort((a, b) => b.len - a.len)[0];

function quoins(k, b, h, q, color) {
  for (const [x, z] of CORNERS(b)) k.box(q, h, q, color, x, 0, z);
}
// A row of small corbels under a parapet or cornice (battlement support).
function corbels(k, pts, y, color, step = 1.4) {
  for (const e of edges(pts)) {
    if (e.len < 1.5) continue;
    const n = Math.max(1, Math.floor(e.len / step));
    k.push({ x: e.mx, z: e.mz, ry: e.ry });
    for (let i = 0; i < n; i++) k.box(step * 0.5, 0.7, 0.55, color, -e.len / 2 + (i + 0.5) * (e.len / n), 0, -0.25);
    k.pop();
  }
}
function chimneys(k, f, b, roofTop, n = 3) {
  let placed = 0;
  for (const [x, z] of CORNERS(b)) {
    if (placed >= n) break;
    const cx = b.cx + (x - b.cx) * 0.6, cz = b.cz + (z - b.cz) * 0.6;
    if (!inside(f.outline, cx, cz)) continue;
    k.box(0.9, 1.4, 0.9, 'brick', cx, roofTop, cz);
    k.box(1.15, 0.24, 1.15, 'lead', cx, roofTop + 1.4, cz);
    placed++;
  }
}

// ------------------------------------------------------------------ generic
function building(k, { footprint: f, dims }, style = 'house') {
  const H = dims.height_m.total, b = bbox(f.outline);
  const wallH = style === 'civic' ? H - 0.5 : H - 2.5;
  k.begin('main');
  k.prism(f.outline, 0, wallH, 'plaster');
  polyBand(k, f.outline, 0, 0.9, 0.14, 'graniteDark');
  const small = Math.max(b.w, b.d) < 14;
  quoins(k, b, wallH, small ? 0.4 : Math.max(0.7, Math.min(1.1, b.w * 0.05)), 'graniteLight');
  polyBand(k, f.outline, Math.min(wallH - 0.6, wallH * 0.52), 0.26, 0.12, 'granite');
  if (small) polyBand(k, f.outline, wallH - 0.12, 0.24, 0.06, 'graniteLight');
  else { polyCornice(k, f.outline, wallH - 0.1, EAVE, 'graniteLight'); corbels(k, f.outline, wallH - 0.55, 'graniteLight'); }
  const storeys = style === 'church' ? [wallH * 0.5] : [1.5, 4.4, Math.max(7.6, wallH - 1.4)];
  polyWindows(k, f.outline, {
    storeys, bay: style === 'church' ? 5 : 2.9, minLen: 2.2, w: 1.18, h: style === 'church' ? 3 : 1.9,
    win: { arch: style === 'church' ? 'round' : null, trim: 'graniteLight', pane: 'glass', sill: true },
    storey: (s) => (style !== 'church' && s === 1 && !small ? { h: 2.1, balcony: 'iron' } : {}),
  });
  if (style === 'civic') { k.prism(offset(f.outline, 0.12), wallH, 0.5, 'lead'); }
  else {
    roofOver(k, f.outline, wallH, 2.5, 'terracotta', 'hip', { over: 0.06 });
    if (style === 'house') chimneys(k, f, b, wallH + 1.0);
  }
  const front = FRONT_EDGE(f);
  if (front) {
    onEdge(k, front);
    win(k, 0, 0.05, 2.4, 3.8, 0.02, { trim: 'graniteLight', pane: 'wood', arch: 'round', bw: 0.35 });
    if (style === 'civic') tablet(k, front.len * 0.16, 1.1, 0.2, 'white', 0, wallH * 0.72, 0.1);
    k.pop();
  }
  // a lamp beside the door (a small extra on real streets)
  k.lamp(3.4, b.x1 + 0.6, 0, b.z0 + 0.6);
  k.end('main');
}
const house = wrap((k, s) => building(k, s));
const civic = wrap((k, s) => building(k, s, 'civic'));

// square belfry tower to exactly h
function squareTower(k, x, z, w, h, o = {}) {
  const body = o.body ?? 'plaster', trim = o.trim ?? 'granite';
  k.push({ x, z, ry: o.ry ?? 0 });
  k.box(w * 1.06, h * 0.04, w * 1.06, 'graniteDark', 0, 0, 0);
  k.box(w, h * 0.67, w, body, 0, 0, 0);
  const q = w * 0.16;
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) k.box(q, h * 0.67, q, trim, sx * (w / 2 - q / 2), 0, sz * (w / 2 - q / 2));
  win(k, 0, h * 0.22, w * 0.2, h * 0.26, w / 2, { pane: 'glass', trim, arch: 'round', sill: true, head: 'seg' });
  k.corniceRing(w, w, corniceProfile('eave', w * 0.07), trim, 0, h * 0.67, 0);
  const bh = h * 0.17;
  for (const r of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    k.push({ y: h * 0.7, ry: r });
    k.gate(w * 0.92, bh, 0.28, [{ x: 0, w: w * 0.46, h: bh * 0.72, pointed: false }], body, 0, 0, w * 0.46 - 0.14);
    k.surround({ x: 0, y: bh * 0.16, w: w * 0.46, h: bh * 0.72, arch: 'round' }, 0.14, 0.24, trim, w * 0.46 - 0.14);
    k.pop();
  }
  k.box(w * 0.5, bh * 0.66, w * 0.5, 'dark', 0, h * 0.71, 0);
  k.corniceRing(w * 1.02, w * 1.02, corniceProfile('classic', w * 0.08), trim, 0, h * 0.87, 0);
  k.cone(w * 0.66, h * 0.13, 4, trim, 0, h * 0.87, 0);
  k.box(0.12, h * 0.05, 0.12, 'iron', 0, h, 0);
  k.box(w * 0.13, 0.12, 0.12, 'iron', 0, h + h * 0.03, 0);
  k.pop();
}

// ------------------------------------------------------------------ Cruz
const domeChurch = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total, b = bbox(f.outline);
  const r = Math.min(b.w, b.d) * 0.3;
  const bodyH = H - r - 3;
  k.begin('main');
  k.prism(f.outline, 0, bodyH, 'plaster');
  polyBand(k, f.outline, 0, 0.9, 0.14, 'granite');
  polyCornice(k, f.outline, bodyH - 0.1, CLASSIC, 'graniteLight');
  corbels(k, f.outline, bodyH - 0.55, 'graniteLight');
  polyWindows(k, f.outline, { storeys: [bodyH * 0.42, bodyH * 0.72], bay: 3.0, w: 1.4, h: 3.0, win: { arch: 'round', trim: 'granite', pane: 'glass', sill: true } });
  roofOver(k, f.outline, bodyH, 1.6, 'terracotta', 'hip', { over: 0.1 });
  k.cyl(r, r, H - r - bodyH - 2.2, 20, 'plaster', b.cx, bodyH, b.cz);
  k.corniceRing(r * 2, r * 2, CLASSIC, 'graniteLight', b.cx, H - r - 2.2, b.cz);
  k.dome(r, 'terracotta', b.cx, H - r - 2.2, b.cz, { seg: 28, rings: 11 });
  k.cyl(0.8, 0.95, 1.4, 12, 'graniteLight', b.cx, H - 2, b.cz);
  k.cone(1.0, 0.9, 12, 'graniteLight', b.cx, H - 0.7, b.cz);
  k.box(0.14, 0.7, 0.14, 'iron', b.cx, H - 0.05, b.cz);
  k.box(0.5, 0.12, 0.12, 'iron', b.cx, H + 0.15, b.cz);
  const front = FRONT_EDGE(f);
  if (front) {
    const w = Math.min(3.6, front.len * 0.22);
    for (const p of [front.a, front.b]) squareTower(k, p[0] - front.nx * (w / 2 + 0.2), p[1] - front.nz * (w / 2 + 0.2), w, H * 0.82, { trim: 'graniteLight' });
    onEdge(k, front);
    k.box(front.len * 0.34, 1.0, 0.5, 'graniteLight', 0, bodyH - 1.2, 0.1);
    pediment(k, front.len * 0.36, 1.6, 0.6, 'graniteLight', 0, bodyH - 0.2, 0.05);
    win(k, 0, 0.05, 2.6, 4, 0.02, { trim: 'granite', pane: 'wood', arch: 'round', bw: 0.4, sill: true, head: 'seg' });
    k.pop();
  }
  k.end('main');
});

// ------------------------------------------------------------------ green
function garden(k, { footprint: f, dims }, park) {
  const H = dims.height_m.total, b = bbox(f.outline);
  k.begin('main'); k.prism(f.outline, 0, 0.16, 'grass');
  const step = park ? 14 : 8;
  for (let x = b.x0 + step / 2; x < b.x1 - step / 3; x += step) for (let z = b.z0 + step / 2; z < b.z1 - step / 3; z += step) {
    if (!inside(f.outline, x, z) || !inside(f.outline, x + 3, z + 3) || !inside(f.outline, x - 3, z - 3)) continue;
    if (park) { k.tree(x, 0, z, Math.min(H, 11), { kind: 'round' }); }
    else { k.box(5, 0.35, 5, 'hedge', x, 0.16, z); k.cyl(0.7, 0.7, H - 0.51, 10, 'hedge', x, 0.51, z); }
  }
  k.end('main');
}

// ------------------------------------------------------------------ stadium
const stadium = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total, b = bbox(f.outline), pitch = f.parts.find((p) => p.tag === 'pitch')?.pts;
  const hole = pitch || f.outline.map(([x, z]) => [b.cx + (x - b.cx) * 0.62, b.cz + (z - b.cz) * 0.62]);
  k.begin('main');
  k.prism(f.outline, 0, H * 0.35, 'graniteGrey', { holes: [hole] });
  k.prism(hole, 0.1, 0.15, 'grass');
  for (let i = 0; i < 11; i++) { const t = 0.7 + i * 0.024; const ring = f.outline.map(([x, z]) => [b.cx + (x - b.cx) * t, b.cz + (z - b.cz) * t]); const inner = ring.map(([x, z]) => [b.cx + (x - b.cx) * 0.985, b.cz + (z - b.cz) * 0.985]); k.prism(ring, H * 0.36 + i * H * 0.04, 0.6, i % 2 ? 'white' : 'maroon', { holes: [inner] }); }
  k.prism(f.outline, H - 0.8, 0.8, 'steel', { holes: [hole] });
  // roof trusses (columns around the pitch) and four floodlight pylons
  const R = (Math.min(b.w, b.d) / 2) * 0.72;
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; k.column(H - 0.8, 0.35, 'steel', b.cx + Math.cos(a) * R, 0, b.cz + Math.sin(a) * R); }
  for (const [x, z] of CORNERS(b)) {
    const cx = b.cx + (x - b.cx) * 0.94, cz = b.cz + (z - b.cz) * 0.94;
    k.box(1.4, H * 0.55, 1.4, 'steel', cx, H * 0.35, cz);
    k.box(2.6, 1.8, 0.5, 'white', cx, H - 1.5, cz);
  }
  k.end('main');
});

// ------------------------------------------------------------------ market
const market = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total, b = bbox(f.outline), wallH = H - 0.6;
  k.begin('main');
  k.prism(f.outline, 0, wallH, 'plaster');
  polyBand(k, f.outline, 0, 0.8, 0.14, 'graniteDark');
  polyCornice(k, f.outline, wallH - 0.1, EAVE, 'graniteLight');
  corbels(k, f.outline, wallH - 0.55, 'graniteLight');
  for (const e of edges(f.outline).filter((e) => e.len > 6)) {
    const n = Math.max(3, Math.floor(e.len / 3.4));
    k.push({ x: e.mx, z: e.mz, ry: e.ry });
    for (let i = 0; i < n; i++) k.surround({ x: -e.len / 2 + (i + 0.5) * (e.len / n), y: 0.6, w: 2.4, h: 2.9, arch: 'round' }, 0.35, 0.5, 'graniteLight', -0.25);
    k.pop();
  }
  const front = FRONT_EDGE(f);
  if (front) {
    onEdge(k, front);
    k.arcade(front.len * 0.8, wallH * 0.72, 0.5, Math.max(4, Math.floor(front.len / 3.4)), 3.2, wallH * 0.56, 'graniteLight', 0, 0.2, 0.2, {});
    k.cyl(0.65, 0.65, 0.25, 16, 'white', 0, wallH * 0.82, 0.3, { rx: Math.PI / 2 });
    k.pop();
  }
  // market stalls under the arcade
  for (let i = 0; i < 8; i++) { const x = b.x0 + 4 + (i % 4) * ((b.w - 8) / 3), z = b.z0 + 3 + Math.floor(i / 4) * 5; if (inside(f.outline, x, z)) k.box(2.2, 1.0, 1.4, i % 2 ? 'maroon' : 'gold', x, 0.4, z); }
  k.prism(offset(f.outline, 0.12), wallH, H - wallH, 'lead');
  k.end('main');
});

// ------------------------------------------------------------------ chapel
const chapel = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total, b = bbox(f.outline), wallH = H * 0.7;
  k.begin('main');
  k.prism(f.outline, 0, wallH, 'plaster');
  polyBand(k, f.outline, 0, 0.8, 0.12, 'graniteDark');
  polyCornice(k, f.outline, wallH - 0.1, EAVE, 'graniteLight');
  quoins(k, b, wallH, Math.max(0.35, Math.min(0.7, b.w * 0.05)), 'graniteLight');
  polyWindows(k, f.outline, { storeys: [1.4, wallH * 0.6], bay: 2.6, minLen: 1.4, w: 1.1, h: 1.9, win: { arch: 'round', trim: 'graniteLight', pane: 'glass', sill: true, head: 'seg' } });
  for (const e of edges(f.outline).filter((e) => e.len > 4)) {
    const n = Math.max(2, Math.floor(e.len / 3));
    for (let i = 1; i < n; i++) {
      const px = e.a[0] + (e.b[0] - e.a[0]) * (i / n), pz = e.a[1] + (e.b[1] - e.a[1]) * (i / n);
      k.box(0.6, wallH * 0.78, 0.6, 'granite', px - e.nx * 0.15, 0, pz - e.nz * 0.15);
      k.cone(0.45, 0.5, 4, 'graniteLight', px - e.nx * 0.15, wallH * 0.78, pz - e.nz * 0.15);
    }
  }
  k.prism(offset(f.outline, 0.12), wallH, H - wallH, 'terracotta');
  const front = FRONT_EDGE(f);
  if (front) {
    onEdge(k, front);
    const gw = Math.min(4.6, front.len * 0.24), gh = H * 0.26;
    k.gate(gw, gh, 0.5, [{ x: 0, w: gw * 0.46, h: gh * 0.6, pointed: false }], 'plaster', 0, H - gh - 0.1, 0.2);
    k.box(gw + 0.6, 0.3, 0.7, 'graniteLight', 0, H - 0.15, 0.2);
    k.cone(gw * 0.34, 0.8, 4, 'graniteLight', 0, H - 0.1, 0.2);
    win(k, 0, 0.05, 2.2, 3.4, 0.02, { trim: 'graniteLight', pane: 'wood', arch: 'round', bw: 0.35, sill: true });
    k.pop();
  }
  k.end('main');
});

// ------------------------------------------------------------------ azenha (mill house)
const azenha = wrap((k, { footprint: f, dims }) => {
  const H = dims.height_m.total, b = bbox(f.outline), wallH = H - 1.6;
  k.begin('main');
  k.prism(f.outline, 0, wallH, 'graniteWarm');
  polyBand(k, f.outline, 0, 0.9, 0.02, 'graniteDark');
  polyBand(k, f.outline, wallH * 0.5, 0.22, 0.03, 'granite');
  polyWindows(k, f.outline, {
    storeys: [1.4, wallH * 0.68], bay: 1.5, minLen: 0.9, w: 0.92, h: 1.55,
    win: { trim: 'graniteLight', pane: 'glass', sill: true, depth: 0.12 },
  });
  k.prism(offset(f.outline, 0.05), wallH, H - wallH, 'terracotta');
  // a turned-stone parapet balustrade on the roof edge (inside the footprint)
  for (const e of edges(f.outline).filter((e) => e.len > 3)) {
    k.push({ x: e.mx, z: e.mz, ry: e.ry });
    k.balustrade(e.len - 0.4, 0.9, 'graniteLight', 0, wallH + 0.05, 0, { d: 0.22, sp: 1.0 });
    k.pop();
  }
  // dormers and chimneys on the roof
  for (const [dx, dz] of [[0.15, 0.15], [-0.15, 0.15], [0.15, -0.15]]) {
    k.box(1.1, 0.9, 1.1, 'plaster', b.cx + b.w * dx, wallH - 0.2, b.cz + b.d * dz);
    k.hipRoof(1.3, 1.3, 0.45, 'terracotta', b.cx + b.w * dx, wallH + 0.7, b.cz + b.d * dz);
  }
  chimneys(k, f, b, wallH + 0.5, 4);
  // the water wheel, mounted on the river wall (inside the footprint)
  const wcx = b.cx + (b.x0 - b.cx) * 0.5, wcz = b.cz, R = Math.min(1.3, b.w * 0.2);
  k.cyl(R, R, 0.2, 18, 'wood', wcx, 1.0, wcz, { rz: Math.PI / 2 });
  k.cyl(R * 0.3, R * 0.3, 0.34, 12, 'wood', wcx, 1.0, wcz, { rz: Math.PI / 2 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    k.box(0.12, R * 1.9, 0.13, 'wood', wcx, 1.0 + Math.cos(a) * R * 0.5, wcz + Math.sin(a) * R * 0.5, { rx: a });
  }
  const front = FRONT_EDGE(f);
  if (front) { onEdge(k, front); win(k, 0, 0.05, 1.5, 2.5, 0.02, { trim: 'graniteLight', pane: 'wood', bw: 0.25, depth: 0.22 }); k.pop(); }
  k.end('main');
});

export const detailedBuilders = {
  ...ponteMedieval,
  'bom-jesus-cruz': domeChurch,
  ...igrejaMatriz,
  ...pacoCondes,
  ...torreMenagem,
  'museu-olaria': civic,
  ...pacosConcelho,
  'solar-pinheiros': house,
  ...teatroGilVicente,
  'estadio-cidade': stadium,
  'parque-cidade': wrap((k, s) => garden(k, s, true)),
  'jardim-barrocas': wrap((k, s) => garden(k, s, false)),
  'mercado-municipal': market,
  'igreja-barcelinhos': chapel,
  ...capelaPonte,
  'casa-azenha': azenha,
};
