// Generic metric massing builder for Barcelos (first launch).
// Extrudes the real OSM outline and parts to their real heights, so every
// landmark stands at true size, orientation and height until its detailed
// builder (PLAN round) replaces it. One builder serves all ids.
// Plan points are [x, z] in the landmark frame, +z the front (fit.js).
import { bbox } from '../geom.js';

const WALL_TAGS = new Set(['building', 'church', 'tower', 'monument', 'stand', 'wall', 'on', 'bridge']);
const FLAT = { water: 'water', pitch: 'grass', garden: 'grass', park: 'grass', ruins: 'graniteDark', square: 'sand', bridge: 'granite' };

function colourFor(id, tag) {
  if (id === 'estadio-cidade') return tag === 'stand' ? 'graniteGrey' : 'steel';
  if (tag === 'bridge') return 'graniteLight';
  if (tag === 'wall') return 'graniteDark';
  if (tag === 'tower' || tag === 'monument') return 'graniteLight';
  if (tag === 'church' || tag === 'chapel') return 'graniteWarm';
  return 'granite';
}

function closed(pts) {
  return Array.isArray(pts) && pts.length >= 3 && pts.every((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
}

function makeBlock(id) {
  function block(k, { footprint, dims }) {
    const H = dims?.height_m?.total ?? 12;
    const roofH = Math.min(H, 12);
    k.begin('main');
    // main body: the real outline at the real total height
    if (closed(footprint.outline)) k.prism(footprint.outline, 0, H, colourFor(id, 'building'));
    // parts: walls, towers, stands and bridge decks extruded; water, pitches,
    // gardens as slabs
    for (const p of footprint.parts || []) {
      if (!closed(p.pts)) continue;
      const tag = p.tag || 'building';
      if (tag === 'water') {
        k.prism(p.pts, 0, 0.12, 'water');
      } else if (tag === 'pitch' || tag === 'garden' || tag === 'park' || tag === 'square' || tag === 'ruins') {
        k.prism(p.pts, 0, 0.18, FLAT[tag]);
      } else if (tag === 'bridge') {
        const h = Math.max(1, Math.min(p.height_m ?? 3, H));
        k.prism(p.pts, 1, h, colourFor(id, tag));
      } else if (WALL_TAGS.has(tag)) {
        const h = Math.max(1, Math.min(p.height_m ?? roofH, H));
        k.prism(p.pts, 0, h, colourFor(id, tag));
      }
    }
    k.end('main');
    // the tallest element carries the height guard in fit.js
    k.begin('height');
    const b = bbox(footprint.outline);
    k.box(0.4, 0.4, 0.4, 'dark', b.cx, H - 0.4, b.cz);
    k.end('height');
  }
  block.metric = true;
  block.rule = { note: 'generic massing from OSM outline and parts; replaced by a detailed builder' };
  return block;
}

export function blockBuilders(ids) {
  return Object.fromEntries(ids.map((id) => [id, makeBlock(id)]));
}
