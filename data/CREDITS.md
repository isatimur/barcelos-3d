
## Surface materials (Poly Haven, CC0)

Photographic PBR base-colour maps used as world-space (triplanar) detail on
the ground, walls and roofs (`assets/tex/`, wired in `src/materials-tex.js`).
All CC0 (public domain); diffuse/normal maps are the original 1K downloads, while
roughness detail remains downscaled to 512 px.

- `ground.jpg` — Poly Haven `aerial_grass_rock` (CC0)
- `wall_plaster.jpg` — Poly Haven `grey_plaster_02` (CC0)
- `wall_granite.jpg` — Poly Haven `granite_wall` (CC0)
- `roof_tiles.jpg` — Poly Haven `clay_roof_tiles` (CC0)
- `cobble.jpg` — Poly Haven `cobblestone_floor_04` (CC0)

https://polyhaven.com/ — CC0 1.0.

Normal maps (`*_nor.jpg`, same Poly Haven CC0 assets): `ground_nor`, `wall_plaster_nor`,
`wall_granite_nor`, `roof_tiles_nor`, `cobble_nor` — used as triplanar surface relief in
`src/materials-tex.js` (`brgTriplanarNormal`), injected in the ground and building shaders.

Roughness maps (`*_rough.jpg`, same assets): `ground_rough`, `wall_plaster_rough`,
`wall_granite_rough`, `roof_tiles_rough`, `cobble_rough` — sampled triplanar to vary
physical roughness/specular response on ground, walls, roofs and cobbles. Downloaded as
1K JPEG and downscaled to 512 px.
