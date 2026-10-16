# Moomin wooden radio — concepts

Three quick concepts for a child's radio that holds the same Pi 3 setup as the [wooden case](../wooden-case/README.md). **Concept B, the Little House, was chosen** and is now designed completely in [../house-radio](../house-radio/README.md) as *Moomin*. This folder keeps the concept stage.

Open [the concept drawings](PDF/radio_concepts.pdf). The **Wooden Radio** tab of the [hardware viewer](../../hardware-visualisation/README.md) now shows the full house; the three concepts appear there as images.

| | A · Lunchbox Radio | B · Little House Radio | C · Cloud Caddy |
|---|---|---|---|
| Idea | Classic tabletop radio | Storybook house: screen window, button door, attic-window speaker | Low box, cloud-shaped handle, sun grille |
| Outer size (mm) | 200 × 221 × 80 | 167 × 278 × 100 | 200 × 202 × 90 |
| Handle | Ø22 dowel between side ears | Ø22 dowel through chimney tabs | 18 mm cloud fin, 100 × 34 hand hole |
| Grip / finger space | 188 / 35 mm | 88 / 37 mm | 100 / 34 mm |
| Plywood parts (coping saw) | 6 (3) | 7 (2) | 9 (4) |
| Weight with electronics | about 830 g | about 800 g | about 800 g |
| Best at | Simplest build | Character and play | Hardest to tip over |
| Trade-off | Most ordinary look | Tallest, narrowest base | Most curvy coping-saw work |

## Shared rules

- 6 mm birch plywood. Every flat part fits one A4 sheet, so each part prints as one 1:1 template.
- Hand tools only: saw with mitre box, coping or fret saw, drill with 3, 3.5, 4, 5, 16 and 22 mm bits, sandpaper, clamps and glue. C also needs a 34 mm Forstner bit or hole saw. Glued butt joints; no router, laser cutter or 3D printer.
- The keypad uses the wooden case's stepped window, which keeps plywood tabs over the board's corner mounting holes. Separate 14 mm holes per key would leave a 1 mm web between the left and right caps.
- The back is removable with four M3 screws into glued corner blocks, so reaching the battery needs a tool. The Pi mounts on the back on 8 mm standoffs, as in the case.
- For a small child: round every edge (R3 or more), use a toy-safe water-based finish, glue the keycaps onto their stems, keep grille holes 5 mm or smaller with felt behind them, and keep handle openings 34 mm or more.
- Charging is as in the case: open the back and unplug the output lead. A panel-mount USB-C socket is an option for the full design.

## What was checked

`checks/verify_concepts.py` reads the **saved** STEP files and facts: valid positive-volume solids, no electronics overlapping the wood, felt or handle, no overlap between different electronic modules, everything inside the wooden envelope, every flat part within the A4 template limit (200 × 287 mm), handle finger space at least 34 mm, grip at least 85 mm, and at least 2.5 mm of plywood between neighbouring holes. All three concepts pass (61, 63 and 68 checks). See [verification.json](verification.json).

These are **massing models**. The electronics are the wooden case's envelopes, placed to fit; cables are not routed, and connector heights are simplified. Glue cleats, bevels and screws are described in the drawings but not all modelled. Mass is an estimate from wood volume plus a 325 g electronics allowance. The USB switch housing is still the case's provisional envelope.

## Regeneration

From the repository root, with `uv` installed. The scripts reuse the wooden case's pinned CAD toolchain and its download cache.

```bash
bash design/wooden-radio/run-cad.sh python build_concepts.py   # models, checks, renders, drawings
python3 design/wooden-radio/sync_viewer.py                     # copy into the viewer's Wooden Radio tab
```

`build_concepts.py` writes STEP, GLB, facts, `verification.json`, previews and `PDF/radio_concepts.pdf`. A rebuild is byte-identical. `sync_viewer.py` refuses to sync while any check fails. It copies the thumbnails, drawing sheets and a `radio-concepts.json` manifest into `hardware-visualisation/src/data/`. Those copies are committed so the viewer works after a fresh checkout. The other generated files are ignored. Shapes, CAD export and patterns come from the shared [woodkit](../woodkit/README.md).

| File | Purpose |
|---|---|
| [concepts.json](concepts.json) | Names, text and shared limits for the three concepts |
| [src/lib/radio.py](src/lib/radio.py) | Concept geometry; drawings and CAD use the same panel primitives |
| `src/concept_*.py` | One STEP + GLB entrypoint per concept, plus its facts |
| [src/concept_sheets.py](src/concept_sheets.py) | Overview and per-concept A4 drawings |
| [checks/verify_concepts.py](checks/verify_concepts.py) | Saved-file fit checks |
| [checks/render_concepts.py](checks/render_concepts.py) | Iso and rear renders, viewer thumbnails |

Electronics sizes and the keypad button positions come from [../wooden-case/parameters.json](../wooden-case/parameters.json), so the two designs cannot drift apart.
