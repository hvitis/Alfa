# Model catalog

Each native model has a separate entrypoint. Output paths are relative to that source file. Build from the project root through `run-cad.sh`.

| Entrypoint | Maintained outputs | Purpose |
|---|---|---|
| enclosure.py | STEP/enclosure.step, GLB/enclosure.glb | Complete assembly |
| exploded.py | STEP/exploded.step, GLB/exploded.glb | Front electronics and Pi/rear separated by 65 mm |
| internals.py | STEP/internals.step, GLB/internals.glb | Rear and right wall removed |
| front_cutting.py | DXF/front_cutting.dxf | Sheet 1 |
| rear_cutting.py | DXF/rear_cutting.dxf | Sheet 2 |
| walls_cutting.py | DXF/walls_cutting.dxf | Sheet 3 |
| accessories_cutting.py | DXF/accessories_cutting.dxf | Sheet 4 |
| enclosure_drawing.py | PDF/enclosure_drawing.pdf | Native engineering projection and measured dimensions |
| workshop_plans.py | PDF/SVG/previews + CSV/JSON | A4 stencils, component overlays, wiring and cut list |

`lib/geometry.py` holds panel factories, electronics envelopes, supports and routes. Its working depth is positive; final native assemblies are reflected to give exported CAD coordinates `(X,-Y,-Z)`. Checks under `../checks` read saved artifacts and do not rebuild model source. `../build-viewer.mjs` embeds saved GLB files, shared wiring facts and a bundled Three.js runtime into the standalone HTML.
