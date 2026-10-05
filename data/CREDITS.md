
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

## Landmark gallery photos (Wikimedia Commons)

Extra photos for four landmarks, resized to at most 1600 px (`assets/img/`).
Each entry gives file, author, licence and the Commons file page.

- `igreja-matriz-2.jpg` — Inês Almendra, CC BY-SA 4.0 — https://commons.wikimedia.org/wiki/File:Fachada_Principal_da_Igreja_Matriz.jpg
- `igreja-matriz-3.jpg` — Xauxa Håkan Svensson, CC BY-SA 3.0 — https://commons.wikimedia.org/wiki/File:Barcelos_Igreja_Matriz-nave01.jpg
- `igreja-matriz-4.jpg` — Xauxa Håkan Svensson, CC BY-SA 3.0 — https://commons.wikimedia.org/wiki/File:Barcelos_Igreja_Matriz-altar01.jpg
- `teatro-gil-vicente-2.jpg` — Joseolgon, CC BY-SA 4.0 — https://commons.wikimedia.org/wiki/File:Teatro_Gil_Vicente_2021_(2).jpg
- `teatro-gil-vicente-3.jpg` — Joseolgon, CC BY-SA 4.0 — https://commons.wikimedia.org/wiki/File:Teatro_Gil_Vicente_2021_(1).jpg
- `parque-cidade-2.jpg` — Vitor Oliveira, CC BY-SA 2.0 — https://commons.wikimedia.org/wiki/File:Parque_Marginal_de_Barcelos_-_Portugal_(52710038440).jpg
- `parque-cidade-3.jpg` — Vitor Oliveira, CC BY-SA 2.0 — https://commons.wikimedia.org/wiki/File:Parque_Marginal_de_Barcelos_-_Portugal_(52710103643).jpg
- `mercado-municipal-3.jpg` — Sqjaques, CC BY-SA 4.0 — https://commons.wikimedia.org/wiki/File:Feira_de_Barcelos_(05Set)_038.jpg
- `mercado-municipal-4.jpg` — Sqjaques, CC BY-SA 4.0 — https://commons.wikimedia.org/wiki/File:Feira_de_Barcelos_(05Set)_050.jpg
