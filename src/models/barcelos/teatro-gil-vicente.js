// Theatro Gil Vicente (Barcelos), metric builder.
// OSM way 108362146 (32.6 x 22.7 m): a fan-shaped plan, 12 m wide at the
// front and 22.6 m wide at the stage. data/dimensions.json: 14 m total
// (estimate; the stage roof is the tallest part).
//
// Photos (assets/img/teatro-gil-vicente*.jpg): a neoclassical granite front,
// one storey tall: a wide triangular pediment over three tall round-arched
// openings, each framed by radiating voussoirs in the rusticated ashlar,
// glazed in steel and glass, with a tablet reading "THEATRO GIL VICENTE" in
// the pediment. Behind the front the main house is yellow-ochre plaster with
// a granite cornice and a grey roof that rises well above the pediment. A
// wrought-iron wall lantern hangs at the left of the front.
//
// Frame (fit.js): rule.front 160.5 snaps to the narrow front edge, so +z is
// the portico front (south-south-east) and the house widens towards -z.
import * as THREE from 'three';
import { MAT, archPath, corniceProfile } from '../kit.js';
import { edges, offset } from '../geom.js';
import { polyCornice, polyWindows, skirtRoof } from '../metric.js';
import { pediment, tablet } from '../parts.js';

const G = 'granite';
const GL = 'graniteLight';
const GD = 'graniteDark';
const OCHRE = 'ochre';

// A ring of voussoirs round a semicircular opening of width w whose springing
// is at y0 (the opening's centre at cx), on the wall face z.
function voussoirs(k, cx, y0, w, ringW, z, n = 11) {
  const r = w / 2;
  for (let i = 0; i < n; i++) {
    const th = ((i + 0.5) * Math.PI) / n; // 0 at +x, PI at -x
    const rm = r + ringW / 2;
    const depth = i % 2 ? 0.13 : 0.2;
    k.push({ x: cx + rm * Math.cos(th), y: y0 + rm * Math.sin(th), z: z + depth / 2 - 0.02, rz: th - Math.PI / 2 });
    k.box((Math.PI * rm * 1.0) / n, ringW, depth, i === Math.floor(n / 2) ? GL : G, 0, -ringW / 2, 0, { jit: 0.05 });
    k.pop();
  }
}

function teatro(k, { footprint: f, dims }) {
  const H = dims?.height_m?.total ?? 14;
  const out = f.outline;
  const E = edges(out);
  const front = E.filter((e) => e.nz > 0.95).sort((a, b) => b.len - a.len)[0];
  const T = 1.0; // thickness of the granite front
  const zF = front.mz;
  const xa = Math.min(front.a[0], front.b[0]);
  const xb = Math.max(front.a[0], front.b[0]);
  const cx = (xa + xb) / 2;
  const yWall = 9.4; // house cornice
  const yFront = 6.9; // granite front up to its cornice
  const pull = out.map((p) => (p === front.a || p === front.b ? [p[0], p[1] - T] : p));

  k.begin('main');
  // ----------------------------------------------------------- the house
  k.prism(pull, 0, yWall, OCHRE, { jit: 0.02 });
  k.prism(offset(pull, 0.1), 0, 0.9, GD, { holes: [pull] });
  polyCornice(k, pull, yWall - 0.05, corniceProfile('classic', 0.7), GL);
  skirtRoof(k, out, yWall + 0.45, 4.6, H - yWall - 0.45, 'lead');
  // tall round-headed windows on the flanks, two storeys
  polyWindows(k, pull, {
    storeys: [1.3, 5.3],
    bay: 4.2,
    minLen: 4,
    only: (e) => e.len > 4 && e.nz < 0.95,
    storey: (s) => (s === 0 ? { w: 1.1, h: 2.6, arch: 'round' } : { w: 1.1, h: 2.4, arch: 'round' }),
    win: { trim: GL, pane: 'glass', bw: 0.2, depth: 0.22, sill: true },
  });

  // ---------------------------------------------------- the granite front
  const ops = [-3.6, 0, 3.6].map((x) => ({ x, w: 2.5, h: 4.5, pointed: false }));
  const w = xb - xa;
  k.gate(w, yFront, T, ops, G, cx, 0, zF - T / 2, { jit: 0.05 });
  k.box(w + 0.3, 0.45, T + 0.25, GL, cx, yFront, zF - T / 2 - 0.05); // cornice
  k.box(w + 0.1, 0.9, T, GD, cx, 0, zF - T / 2); // plinth
  // pediment with the inscription
  pediment(k, w + 0.3, 2.0, 0.7, G, cx, yFront + 0.45, zF - 0.45, { frame: 0.3 });
  tablet(k, 3.6, 0.9, 0.12, GD, cx, yFront + 0.8, zF + 0.0, { face: GL, lines: 2, ink: 0x2c2d30 });
  // the three arches: voussoir rings and glazing in steel
  for (const o of ops) {
    const ax = cx + o.x;
    voussoirs(k, ax, o.h - o.w / 2, o.w, 0.55, zF);
    // steel and glass doors, set back in the opening
    const pane = new THREE.Shape();
    archPath(pane, ax, 0.05, o.w - 0.1, o.h - 0.05, 8);
    k.plane(pane, 'glass', 0, 0, zF - T + 0.08, { mat: MAT.flat, emit: 0.12 });
    k.surround({ x: ax, y: 0.05, w: o.w - 0.1, h: o.h - 0.05, arch: 'round' }, 0.08, 0.12, 'steel', zF - T + 0.06);
    k.box(0.07, o.h - 1.3, 0.08, 'steel', ax, 0.05, zF - T + 0.13);
    k.box(o.w - 0.1, 0.07, 0.08, 'steel', ax, 2.6, zF - T + 0.13);
    for (const dx of [-0.5, 0.5]) k.box(0.05, 1.1, 0.06, 'steel', ax + dx, 1.0, zF - T + 0.17);
  }
  // plain granite plinth blocks under the arches' piers, wooden planters in front
  for (const x of [-5.4, -1.8, 1.8, 5.4]) {
    k.box(0.9, 0.55, 0.5, 'wood', cx + x, 0, zF - 0.28);
    k.cone(0.4, 1.3, 6, 'hedge', cx + x, 0.55, zF - 0.28, { flat: true });
  }
  // the wrought-iron wall lantern at the left of the front
  k.lamp(0.9, xa + 0.35, 2.7, zF - 0.05, { color: 'iron' });
  k.end('main');
}

teatro.metric = true;
teatro.rule = {
  front: 160.5,
  view: 0.5,
  note: 'narrow front (rule.front 160.5): one-storey granite front with a pediment over three round-arched steel-and-glass openings in radiating voussoirs, the fan-shaped ochre house behind it with arched flank windows, a granite cornice and a grey hip roof to 14 m.',
};
export default { 'teatro-gil-vicente': teatro };
