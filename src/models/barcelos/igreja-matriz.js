// Igreja Matriz de Barcelos (Santa Maria Maior), metric builder.
// OSM way 108362149 holds the church and the two-storey annex on its south
// side in one outline (37.1 x 35.3 m). data/dimensions.json gives 22 m
// total (estimate); the tallest element is the bell tower.
//
// Photos (assets/img/igreja-matriz*.jpg): bare granite ashlar everywhere;
// one wide west gable over three aisles with a cross at the apex; a
// pointed Gothic portal with stepped archivolts between two buttresses; the
// rose window (restored in the 20th c.) above it; a square 18th-c. tower at
// the south-west corner with one round-arched bell opening per face and a
// flat top; behind the tower, the two-storey granite annex with framed
// rectangular windows and a hip roof, and a lower house in front of it.
//
// Frame (fit.js): rule.front 262 snaps to the west front, so +z = west and
// +x = south. In this frame the outline reads:
//   nave       x -14.55..2.22, z 0.6..18.56 (west front at z 18.56)
//   tower      x 2.22..7.76,   z 13.73..18.56
//   north chapel x -17.53..-14.3, z -9.32..0.6
//   chancel    x -14.3..2.22,  z -17.3..0.6; capela-mor x -10.62..-1.66
//              projecting to z -18.56
//   annex      x 2.22..17.5,   z -17.38..-1.81; front house x 11.26..17.48,
//              z -1.81..4.41; a low link x 2.22..5.09, z -1.82..0.7
// Heights are visual estimates scaled to the 22 m tower (photo ratios):
// nave eave 10.5, gable apex 15.6, tower string course 15.2, belfry top 21.
import * as THREE from 'three';
import { corniceProfile, MAT, pointedPath, archPath } from '../kit.js';
import { win, bell } from '../parts.js';

// The photos show weathered grey granite, darker than the town's dressed
// stone: grey walls, plain granite trim.
const G = 'graniteGrey';
const L = 'granite';
const D = 'graniteDark';
const W = 'graniteWarm';
const TILE = 'terracotta';

// Face directions in this frame (local +z of the pushed transform = out).
const OUT = { west: 0, east: Math.PI, south: Math.PI / 2, north: -Math.PI / 2 };

function at(k, x, z, ry, fn) {
  k.push({ x, z, ry });
  fn();
  k.pop();
}

// Rectangle [x0, x1] x [z0, z1] as a plan polygon.
const rectPts = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

// Pointed lancet: carved surround, glass pane, a mullion for wide ones.
function lancet(k, x, y, w, h, z, o = {}) {
  k.surround({ x, y, w, h, arch: 'pointed' }, o.bw ?? 0.22, o.depth ?? 0.28, o.trim ?? L, z);
  const s = new THREE.Shape();
  pointedPath(s, x, y, w, h, 5);
  k.plane(s, o.pane ?? 'glass', 0, 0, z + 0.04, { mat: MAT.flat, emit: o.emit ?? 0.12 });
  if (w > 1.2) k.box(0.12, h * 0.7, 0.1, o.trim ?? L, x, y, z + 0.08);
  k.box(w + 0.6, 0.22, 0.4, o.trim ?? L, x, y - 0.22, z + 0.15);
}

// Stepped buttress on a wall face (local +z out), height h.
function buttress(k, h, depth = 0.9, width = 1.1, color = G) {
  const steps = 3;
  for (let s = 0; s < steps; s++) {
    const d = depth * (1 - s * 0.28);
    const hh = h * (1 - s * 0.22);
    k.box(width, hh, d, color, 0, -0.6, d / 2 - 0.02, { jit: 0.05 });
    // sloped set-off on top of each step
    k.box(width + 0.02, 0.28, d * 0.75, L, 0, hh - 0.75, d * 0.42, { rx: -0.55 });
  }
}

// Pointed Gothic portal with n stepped archivolts and jamb shafts.
function portal(k, x, w, h, z, n = 4) {
  const step = 0.32;
  for (let i = n - 1; i >= 0; i--) {
    const ow = w + i * 2 * step;
    const oh = h + i * step * 1.1;
    const depth = 0.25 + (n - 1 - i) * 0.0 + i * 0.18;
    k.surround({ x, y: 0, w: ow, h: oh, arch: 'pointed' }, step, depth, i % 2 ? L : W, z - depth / 2 + 0.05 + i * 0.12);
    // jamb shaft with capital
    const spring = oh - ow * 0.85;
    for (const sx of [-1, 1]) {
      const px = x + sx * (ow / 2 + step / 2);
      k.cyl(0.15, 0.17, Math.max(0.5, spring - 0.6), 6, L, px, 0.45, z + i * 0.12 + 0.05);
      k.box(0.42, 0.3, 0.42, W, px, Math.max(0.95, spring - 0.15), z + i * 0.12 + 0.05);
    }
  }
  k.box(w + n * 2 * step + 0.6, 0.45, 0.9 + n * 0.12, D, x, 0, z + 0.2);
  const door = new THREE.Shape();
  pointedPath(door, x, 0.45, w, h - 0.45, 5);
  k.plane(door, 'wood', 0, 0, z - 0.15, { mat: MAT.smooth });
  // tympanum lintel
  k.box(w, 0.35, 0.3, W, x, h - w * 0.85 - 0.1, z - 0.05);
}

// Rose window: outer moulding, glass, twelve spokes, lobed tracery, hub.
function rose(k, x, y, z, R) {
  k.cyl(R + 0.5, R + 0.5, 0.3, 28, D, x, y - 0.15, z - 0.05, { rx: Math.PI / 2, smooth: true });
  k.add(new THREE.TorusGeometry(R + 0.12, 0.28, 5, 30), L, { x, y, z: z + 0.15 });
  k.add(new THREE.TorusGeometry(R * 0.58, 0.12, 4, 24), L, { x, y, z: z + 0.18 });
  k.cyl(R, R, 0.08, 24, 'glass', x, y - 0.04, z + 0.12, { rx: Math.PI / 2, emit: 0.18, smooth: true });
  for (let i = 0; i < 6; i++) {
    k.add(new THREE.BoxGeometry(0.13, 2 * R, 0.14), L, { x, y, z: z + 0.2, rz: (i * Math.PI) / 6 });
  }
  for (let i = 0; i < 12; i++) {
    const a = ((i + 0.5) * Math.PI) / 6;
    k.add(new THREE.TorusGeometry(R * 0.16, 0.05, 3, 10), L, { x: x + Math.cos(a) * R * 0.8, y: y + Math.sin(a) * R * 0.8, z: z + 0.2 });
  }
  k.cyl(R * 0.2, R * 0.2, 0.3, 12, W, x, y - 0.15, z + 0.2, { rx: Math.PI / 2 });
}

// Plain framed rectangular window (granite surround, sill) for the annex.
function sash(k, x, y, w, h, z, o = {}) {
  win(k, x, y, w, h, z, { trim: o.trim ?? L, pane: o.pane ?? 'glass', bw: 0.2, depth: 0.2, sill: true, bars: o.bars, balcony: o.balcony });
}

// Windows at evenly spaced positions along a segment of length len on a
// face (pushed transform), at the storey heights ys.
function row(k, len, ys, w, h, o = {}) {
  const n = Math.max(1, Math.floor(len / (o.bay ?? 3.4)));
  for (let i = 0; i < n; i++) {
    const u = -len / 2 + (len / n) * (i + 0.5) + (o.shift ?? 0);
    for (const y of ys) sash(k, u, y, w, h, 0, o);
  }
}

function matriz(k, { footprint, dims }) {
  const H = dims?.height_m?.total ?? 22;
  // nave
  const xN = -14.55;
  const xS = 2.22;
  const zW = 18.56;
  const zX = 0.6;
  const cx = (xN + xS) / 2; // -6.17
  const naveW = xS - xN; // 16.77
  const eave = 10.5;
  const apex = 15.6;
  // chancel and capela-mor
  const zE = -17.3;
  const cmx0 = -10.62;
  const cmx1 = -1.66;
  const zCm = -18.56;
  const cmEave = 9.6;
  const cmApex = 13.2;
  const sideEave = 7.6;
  // tower
  const tx0 = xS;
  const tx1 = 7.76;
  const tz0 = 13.73;
  const tz1 = zW;
  const tcx = (tx0 + tx1) / 2;
  const tcz = (tz0 + tz1) / 2;
  const tw = tx1 - tx0;
  const td = tz1 - tz0;
  const tBody = H * 0.69; // 15.2
  const tTop = H * 0.955; // 21.0
  // annex
  const ax0 = xS;
  const ax1 = 17.5;
  const az0 = -17.38;
  const az1 = -1.81;
  const aEave = 8.4;

  k.begin('main');
  // ---------------------------------------------------------------- masses
  const skirt = -0.9;
  k.prism(rectPts(xN, xS, zX, zW), skirt, eave - skirt, G);
  k.prism(rectPts(-17.53, -14.3, -9.32, zX + 0.02), skirt, 6.4 - skirt, G); // north chapel
  k.prism(rectPts(-14.3, xS, zE, zX), skirt, sideEave - skirt, G); // chancel aisles
  k.prism(rectPts(cmx0, cmx1, zCm, zX), skirt, cmEave - skirt, G); // capela-mor
  k.prism(rectPts(ax0, ax1, az0, az1), skirt, aEave - skirt, G); // annex
  k.prism(rectPts(11.26, 17.48, az1 - 0.02, 4.41), skirt, 5.6 - skirt, G); // front house
  k.prism(rectPts(ax0, 5.09, az1 - 0.02, 0.7), skirt, 4.2 - skirt, G); // low link
  // plinths
  for (const [x0, x1, z0, z1, h] of [[xN, xS, zX, zW, 1.0], [-17.53, -14.3, -9.32, zX, 0.8], [-14.3, xS, zE, zX, 0.8], [cmx0, cmx1, zCm, zE, 0.8], [ax0, ax1, az0, az1, 0.6], [11.26, 17.48, az1, 4.41, 0.6]]) {
    k.box(x1 - x0 + 0.3, h - skirt, z1 - z0 + 0.3, D, (x0 + x1) / 2, skirt, (z0 + z1) / 2);
  }

  // ---------------------------------------------------------------- roofs
  const eaveProf = corniceProfile('eave', 0.45);
  k.gableRoof(naveW + 0.1, zW - zX - 0.3, apex - eave, TILE, cx, eave, (zW + zX) / 2 - 0.15, { over: 0.45, overEnd: 0.05, mat: MAT.tile });
  k.gableRoof(cmx1 - cmx0, zX - zCm, cmApex - cmEave, TILE, (cmx0 + cmx1) / 2, cmEave, (zX + zCm) / 2, { over: 0.4, overEnd: 0.2, mat: MAT.tile });
  k.hipRoof(cmx0 + 14.3, zX - zE, 1.7, TILE, (-14.3 + cmx0) / 2, sideEave, (zX + zE) / 2, { over: 0.35, mat: MAT.tile });
  k.hipRoof(xS - cmx1, zX - zE, 1.7, TILE, (cmx1 + xS) / 2, sideEave, (zX + zE) / 2, { over: 0.35, mat: MAT.tile });
  k.hipRoof(3.23, 9.92, 1.4, TILE, (-17.53 - 14.3) / 2, 6.4, (-9.32 + zX) / 2, { over: 0.35, mat: MAT.tile });
  k.hipRoof(ax1 - ax0, az1 - az0, 3.0, TILE, (ax0 + ax1) / 2, aEave, (az0 + az1) / 2, { over: 0.5, mat: MAT.tile });
  k.hipRoof(6.22, 6.22, 1.9, TILE, (11.26 + 17.48) / 2, 5.6, (az1 + 4.41) / 2, { over: 0.45, mat: MAT.tile });
  k.hipRoof(2.87, 2.52, 0.9, TILE, (ax0 + 5.09) / 2, 4.2, (az1 + 0.7) / 2, { over: 0.3, mat: MAT.tile });
  // eave cornices: nave flanks, annex, chancel
  for (const [x, ry, len, y, zc] of [
    [xN, OUT.north, zW - zX, eave, (zW + zX) / 2],
    [xS, OUT.south, tz0 - zX, eave, (tz0 + zX) / 2],
    [cmx0, OUT.north, zX - zCm, cmEave, (zX + zCm) / 2],
    [cmx1, OUT.south, zX - zCm, cmEave, (zX + zCm) / 2],
  ]) {
    k.push({ x, y: y - 0.45, z: zc, ry });
    k.cornice(len, eaveProf, L);
    k.pop();
  }
  k.corniceRing(ax1 - ax0, az1 - az0, eaveProf, L, (ax0 + ax1) / 2, aEave - 0.45, (az0 + az1) / 2);
  k.corniceRing(6.22, 6.22, corniceProfile('eave', 0.35), L, (11.26 + 17.48) / 2, 5.25, (az1 + 4.41) / 2);
  k.corniceRing(-14.3 - xS, zX - zE, corniceProfile('eave', 0.35), L, (-14.3 + xS) / 2, sideEave - 0.35, (zX + zE) / 2, { skip: [] });

  // ---------------------------------------------------------------- west front
  // gable over the eave line, coped rakes, cross at the apex
  const gs = new THREE.Shape();
  gs.moveTo(-naveW / 2, 0);
  gs.lineTo(naveW / 2, 0);
  gs.lineTo(0, apex - eave);
  gs.closePath();
  k.extrude(gs, 0.8, G, cx, eave, zW - 0.4);
  const rake = Math.hypot(naveW / 2, apex - eave);
  const ang = Math.atan2(apex - eave, naveW / 2);
  for (const sx of [-1, 1]) {
    k.box(rake + 0.5, 0.42, 1.0, L, cx + (sx * naveW) / 4, eave + (apex - eave) / 2 - 0.12, zW - 0.4, { rz: -sx * ang });
  }
  // the cross on the apex: base, shaft, arms with trefoil ends
  k.box(0.8, 0.5, 0.8, L, cx, apex + 0.05, zW - 0.4);
  k.box(0.22, 1.5, 0.22, L, cx, apex + 0.5, zW - 0.4);
  k.box(1.0, 0.22, 0.22, L, cx, apex + 1.45, zW - 0.4);
  for (const [dx, dy] of [[0.55, 1.56], [-0.55, 1.56], [0, 2.08]]) k.sphere(0.14, L, cx + dx, apex + dy, zW - 0.4, { seg: 6, rings: 4 });
  // string course across the front at the top of the portal frame
  k.box(naveW + 0.3, 0.35, 0.5, L, cx, 6.3, zW + 0.15);
  // buttresses: north corner (two faces) and the two flanking the portal
  at(k, xN + 0.6, zW, OUT.west, () => buttress(k, 7.4, 1.2, 1.2));
  at(k, xN, zW - 0.6, OUT.north, () => buttress(k, 7.4, 1.2, 1.2));
  const bx = 3.7;
  for (const sx of [-1, 1]) at(k, cx + sx * bx, zW, OUT.west, () => buttress(k, 8.6, 1.3, 1.3));
  // portal frame between the buttresses (projects slightly, to the course)
  k.box(2 * bx - 1.3, 6.3, 0.4, G, cx, 0, zW + 0.2, { jit: 0.04 });
  portal(k, cx, 2.3, 4.7, zW + 0.4, 4);
  rose(k, cx, apex - 4.0, zW + 0.02, 1.75);
  // narrow lancets lighting the aisles
  for (const sx of [-1, 1]) lancet(k, cx + sx * 6.2, 7.6, 0.6, 2.2, zW, { bw: 0.16, depth: 0.2 });

  // ---------------------------------------------------------------- tower
  k.box(tw + 0.5, 1.2, td + 0.5, D, tcx, skirt, tcz);
  k.box(tw, tBody, td, G, tcx, 0, tcz, { jit: 0.02 });
  // corner quoins: long-and-short blocks standing a little proud, the
  // same grey stone (the photos show no colour change at the corners)
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    for (let y = 0.4, i = 0; y < tBody - 0.6; y += 0.9, i++) {
      const long = i % 2 === 0;
      k.box(long ? 0.9 : 0.55, 0.85, long ? 0.55 : 0.9, G, tcx + sx * (tw / 2 - (long ? 0.4 : 0.23)), y, tcz + sz * (td / 2 - (long ? 0.23 : 0.4)), { jit: 0.07 });
    }
  }
  // slit windows on the west and south faces, the clock-less body
  for (const y of [5.6, 10.4]) {
    at(k, tcx, tz1, OUT.west, () => {
      k.box(0.32, 1.3, 0.06, 'dark', 0, y, 0.01);
      k.box(0.7, 0.18, 0.2, L, 0, y - 0.18, 0.08);
    });
    at(k, tx1, tcz, OUT.south, () => k.box(0.32, 1.3, 0.06, 'dark', 0, y + 1.2, 0.01));
  }
  // string course and cornice at the belfry
  k.corniceRing(tw, td, corniceProfile('band', 0.4), L, tcx, tBody - 0.4, tcz);
  // belfry: four slabs, one round-arched opening per face, bells inside
  const bh = tTop - tBody;
  const ot = 0.7;
  const opW = 1.5;
  const opH = 3.3;
  for (const [ry, ox, oz, len] of [
    [OUT.west, 0, td / 2 - ot / 2, tw],
    [OUT.east, 0, -(td / 2 - ot / 2), tw],
    [OUT.south, tw / 2 - ot / 2, 0, td - 2 * ot],
    [OUT.north, -(tw / 2 - ot / 2), 0, td - 2 * ot],
  ]) {
    k.push({ x: tcx + ox, y: tBody, z: tcz + oz, ry });
    k.wall(len, bh, ot, G, [{ x: 0, y: 1.0, w: opW, h: opH, arch: 'round', pane: null }], 0, 0, 0);
    k.surround({ x: 0, y: 1.0, w: opW, h: opH, arch: 'round' }, 0.2, 0.18, L, ot / 2);
    k.box(opW + 0.5, 0.2, 0.35, L, 0, 0.8, ot / 2 + 0.05);
    k.pop();
  }
  k.box(tw - 2 * ot, 0.3, td - 2 * ot, D, tcx, tBody, tcz);
  k.box(tw - 2 * ot - 0.6, bh - 0.4, td - 2 * ot - 0.6, 'dark', tcx, tBody + 0.3, tcz);
  bell(k, 1.1, tcx, tBody + 2.2, tcz + td / 2 - ot - 0.1);
  bell(k, 0.9, tcx + tw / 2 - ot - 0.1, tBody + 2.3, tcz);
  // top cornice, flat roof, corner pinnacles, iron vane
  k.corniceRing(tw, td, corniceProfile('classic', 0.45), L, tcx, tTop, tcz);
  k.box(tw + 0.4, 0.5, td + 0.4, G, tcx, tTop + 0.4, tcz);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const px = tcx + sx * (tw / 2 - 0.1);
    const pz = tcz + sz * (td / 2 - 0.1);
    k.box(0.45, 0.45, 0.45, L, px, tTop + 0.9, pz);
    k.cone(0.22, 0.75, 4, L, px, tTop + 1.35, pz);
  }
  k.box(0.1, 1.6, 0.1, 'iron', tcx, tTop + 0.9, tcz);
  k.box(0.9, 0.08, 0.08, 'iron', tcx, tTop + 2.1, tcz);

  // ---------------------------------------------------------------- north flank
  // nave north wall: buttresses at the bay lines, lancets between, a
  // round-arched side portal in the second bay from the west
  const bays = [zX + 0.3, 5.0, 9.4, 13.8];
  for (const z of bays.slice(1)) at(k, xN, z, OUT.north, () => buttress(k, eave - 1.2, 1.0, 1.1));
  for (let i = 0; i < bays.length; i++) {
    const z0 = bays[i];
    const z1 = bays[i + 1] ?? zW - 1.2;
    const zc = (z0 + z1) / 2;
    at(k, xN, zc, OUT.north, () => {
      lancet(k, 0, 6.4, 1.1, 2.9, 0, {});
      if (i === 2) {
        // side portal: round arch, three archivolts, small gable hood
        for (let r = 2; r >= 0; r--) k.surround({ x: 0, y: 0, w: 1.7 + r * 0.6, h: 3.1 + r * 0.3, arch: 'round' }, 0.3, 0.25 + r * 0.12, r % 2 ? L : W, 0.12 + r * 0.06);
        const d = new THREE.Shape();
        archPath(d, 0, 0, 1.7, 3.1);
        k.plane(d, 'wood', 0, 0, 0.03, { mat: MAT.smooth });
        k.box(3.9, 0.3, 0.6, L, 0, 4.3, 0.3);
      }
    });
  }
  // north chapel: corner buttresses, two windows on its north face, one west
  at(k, -17.53, -4.36, OUT.north, () => {
    lancet(k, -2.4, 3.0, 0.9, 2.2, 0, {});
    lancet(k, 2.4, 3.0, 0.9, 2.2, 0, {});
    k.box(1.0, 0.4, 0.4, L, 0, 5.8, 0.1);
  });
  at(k, -16.0, zX, OUT.west, () => lancet(k, 0, 3.0, 0.7, 1.8, 0, { bw: 0.16 }));
  at(k, -17.53, -9.0, OUT.north, () => buttress(k, 5.4, 0.8, 0.9));
  at(k, -17.53, 0.3, OUT.north, () => buttress(k, 5.4, 0.8, 0.9));
  // chancel aisle north wall and the capela-mor clerestory
  at(k, -14.3, -13.3, OUT.north, () => lancet(k, 0, 3.0, 1.0, 2.6, 0, {}));
  at(k, -14.3, -16.9, OUT.north, () => buttress(k, 6.4, 0.8, 0.9));
  for (const z of [-14.5, -9.0, -3.5]) {
    at(k, cmx0, z, OUT.north, () => lancet(k, 0, sideEave + 0.25, 0.7, 1.4, 0, { bw: 0.15, depth: 0.18 }));
    at(k, cmx1, z, OUT.south, () => lancet(k, 0, sideEave + 0.25, 0.7, 1.4, 0, { bw: 0.15, depth: 0.18 }));
  }
  // ---------------------------------------------------------------- east end
  at(k, (cmx0 + cmx1) / 2, zCm, OUT.east, () => {
    lancet(k, 0, 4.0, 1.2, 4.0, 0, {});
    k.box(1.6, 0.3, 0.5, L, 0, cmApex - 2.6, 0.15);
  });
  // gable of the capela-mor (east) with its cross
  const es = new THREE.Shape();
  es.moveTo(-(cmx1 - cmx0) / 2, 0);
  es.lineTo((cmx1 - cmx0) / 2, 0);
  es.lineTo(0, cmApex - cmEave);
  es.closePath();
  k.extrude(es, 0.6, G, (cmx0 + cmx1) / 2, cmEave, zCm + 0.3);
  k.box(0.2, 1.2, 0.2, L, (cmx0 + cmx1) / 2, cmApex, zCm + 0.3);
  k.box(0.75, 0.2, 0.2, L, (cmx0 + cmx1) / 2, cmApex + 0.75, zCm + 0.3);
  for (const x of [cmx0, cmx1]) at(k, x + (x < 0 ? 0.6 : -0.6), zCm, OUT.east, () => buttress(k, 7.0, 0.9, 1.0));
  at(k, -12.46, zE, OUT.east, () => lancet(k, 0, 3.0, 0.9, 2.4, 0, {}));
  at(k, 0.28, zE, OUT.east, () => lancet(k, 0, 3.0, 0.9, 2.4, 0, {}));

  // ---------------------------------------------------------------- south aisle (tower to annex)
  for (const z of [4.6, 9.2]) at(k, xS, z, OUT.south, () => buttress(k, eave - 1.6, 1.0, 1.0));
  for (const z of [2.6, 6.9, 11.5]) at(k, xS, z, OUT.south, () => lancet(k, 0, 6.2, 1.0, 2.7, 0, {}));
  at(k, xS, 6.9, OUT.south, () => {
    // small south door into the aisle
    k.surround({ x: 0, y: 0, w: 1.3, h: 2.6, arch: 'round' }, 0.24, 0.25, L, 0.12);
    const d = new THREE.Shape();
    archPath(d, 0, 0, 1.3, 2.6);
    k.plane(d, 'wood', 0, 0, 0.03, { mat: MAT.smooth });
  });

  // ---------------------------------------------------------------- annex
  // two storeys of framed windows on the free faces, a door on the west
  at(k, ax1, (az0 + az1) / 2, OUT.south, () => row(k, az1 - az0, [1.4, 4.9], 1.1, 1.75, { bay: 3.3 }));
  at(k, (ax0 + ax1) / 2, az0, OUT.east, () => row(k, ax1 - ax0, [1.4, 4.9], 1.1, 1.75, { bay: 3.3 }));
  at(k, (5.09 + 11.26) / 2, az1, OUT.west, () => {
    win(k, -1.2, 0.02, 1.3, 2.5, 0, { trim: L, pane: 'wood', bw: 0.25, depth: 0.22, head: 'flat' });
    sash(k, 1.6, 1.4, 1.0, 1.6, 0);
    sash(k, -1.2, 4.9, 1.1, 1.75, 0);
    sash(k, 1.6, 4.9, 1.1, 1.75, 0);
  });
  at(k, (ax0 + 5.09) / 2, 0.7, OUT.west, () => sash(k, 0, 1.3, 0.9, 1.4, 0, { bars: true }));
  at(k, 11.26, az1 + 3.1, OUT.north, () => sash(k, 0, 2.2, 1.0, 1.6, 0));
  // front house: door below, balcony window above (photo), side windows
  at(k, (11.26 + 17.48) / 2, 4.41, OUT.west, () => {
    sash(k, 0, 2.6, 1.2, 2.2, 0, { balcony: 'iron' });
    sash(k, -2.0, 1.0, 0.8, 1.2, 0);
    sash(k, 2.0, 1.0, 0.8, 1.2, 0);
  });
  at(k, 17.48, az1 + 3.1, OUT.south, () => row(k, 6.2, [1.2, 3.4], 0.9, 1.3, { bay: 3.0 }));
  // quoins on the annex corners
  for (const [x, z] of [[ax1, az0], [ax1, az1], [17.48, 4.41], [11.26, 4.41]]) k.box(0.7, x === ax1 && z !== 4.41 ? aEave : 5.6, 0.7, W, x - Math.sign(x) * 0.25, 0, z - Math.sign(z) * 0.25, { jit: 0.04 });
  k.end('main');
}

matriz.metric = true;
matriz.rule = {
  front: 262,
  view: 0.5,
  note: 'west front (rule.front 262): granite church on its OSM outline, gable with portal and rose window, 22 m south-west bell tower, buttressed flanks, two-storey granite annex on the south part of the same way; heights are visual estimates scaled to the 22 m tower',
};

export default { 'igreja-matriz': matriz };
