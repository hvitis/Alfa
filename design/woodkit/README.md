# woodkit

Reusable pieces for hand-cut plywood enclosure plans, built while designing [the radio concepts](../wooden-radio/README.md) and [Moomin, the house radio](../house-radio/README.md). One geometry description feeds the CAD, the checks, the drawings, the 1:1 templates, the assembly booklet and the hardware viewer, so they cannot drift apart.

| Module | Needs | What it gives you |
|---|---|---|
| `shapes` | Python | `Rect`, `Circle`, `Poly`, `Mark` primitives; `Panel` (a plywood part in its own plane), `Box` (an envelope), `Rod` (dowel, magnet, screw shank); `Pose` and chained poses for hinged or exploded parts |
| `fasteners` | Python | `Joint` + `Layer` stack-ups → standard screw/bolt lengths, drill, pilot and countersink sizes; `shopping_list` with spares |
| `cad` | cadgen | build123d solids and compounds from shapes; poses applied |
| `checks` | cadgen | `Report`, interference with allowed-by-design pairs, hole webs, mass and centre of gravity, tip angles |
| `render` | cadgen | batch snapshot jobs (solid or hidden-line, with focus or hide) and white, cropped print images |
| `paper` | matplotlib | A4 pages, tables, text, calibration gauge; `View` paints front, back or side elevations from shapes, with dimensions, dashed outlines and wire routes |
| `templates` | matplotlib | packs parts onto 1:1 A4 sheets, draws cut lines, drill crosses with diameters, transfer marks and ghosts; SVG and DXF |
| `booklet` | matplotlib | IKEA-style pages: step numbers, line art, `4×` hardware callouts, 1:1 screws, nuts, washers, hinges, magnets; tool icons and do/don't badges |
| `scenery` | matplotlib | illustrated cover pieces: night sky, moon, hills, pines, snowfall, glow, snow lying on a roof line |

Viewer side: `hardware-visualisation/src/scene/workshopScene.js` shows any synced design with view modes, traceable wires, clickable parts, labels and camera presets.

## Making the next plan

1. Copy `design/house-radio/run-cad.sh` into a new `design/<name>/` folder, along with `src/lib/__init__.py`, which puts `woodkit` on the path. Write `parameters.json`.
2. In `src/lib/<name>.py`, return the design as lists of `Panel`, `Box` and `Rod`, one function per view mode, plus a list of fastener `Joint`s. Put the electronics sizes in one place and read them from there.
3. Write one entrypoint per view with cadgen's `@step`/`@glb` at module level, returning `woodkit.cad.compound(...)`.
4. Write facts (cut list, `fasteners.size`, `shopping_list`), then a check script using `woodkit.checks`.
5. Draw pages with `paper.View`, templates with `templates.pack` + `template_pages`, a booklet with `booklet`, and a cover with `scenery`.
6. Sync a small JSON manifest and the GLBs into `hardware-visualisation/src/data/`, then add a tab with `createWorkshopScene({...})`.

`design/house-radio/build_all.py` shows the order: models → facts → checks → step models → renders → PDFs.

Coordinates everywhere: millimetres, X right, Y up, Z toward the viewer. A panel's outline is in its own (u, v): `xy` = (X, Y), `zy` = (−Z, Y), `xz` = (X, −Z).
