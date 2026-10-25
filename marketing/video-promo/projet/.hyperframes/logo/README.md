# Logo « À. » — vectorisation

`source-logo.jpg` (dans `marketing/video-promo/logo/`) est l'image fournie par le porteur du projet.

- `trace.py` : sépare le « À » crème et le point doré, trace le « À » en courbes (potrace, paquet Python
  `potracer`) et mesure le cercle du point → `traced.json`.
- `make_svg.py` : écrit les SVG (tuile arrondie, tuile carrée, marque seule crème ou verte).
- `logo512.py` : la même géométrie dans un repère 512 × 512, découpée en lettre / accent / point, utilisée
  par les plans animés (ticket du plan 02, carte de fin 11) via `salle-3d/tools/rebrand.py`.

Couleurs relevées sur l'image : vert `#3D5742`, crème `#EFEBE4`, or `#D5B162`.
