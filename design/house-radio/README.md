# Moomin — the little house radio

Concept B from [the radio concepts](../wooden-radio/README.md), designed completely: every plywood part, hinge, magnet, screw and wire, around the same Raspberry Pi 3 setup as the [wooden case](../wooden-case/README.md).

| Open | What it is |
|---|---|
| [PDF/Moomin.pdf](PDF/Moomin.pdf) | The plan: winter cover, overview, inside placement, the split roof, the QUARKZMAN power chain, calculated screws, shopping list, wiring, cut list, then the 1:1 A4 templates |
| [PDF/Moomin-assembly.pdf](PDF/Moomin-assembly.pdf) | IKEA-style assembly booklet: tools, parts A–K, hardware at 1:1, 13 steps, charging |
| [PDF/Moomin-cut-templates.pdf](PDF/Moomin-cut-templates.pdf) | Only the 4 template sheets, for printing at Actual Size / 100 %. Also as [SVG](SVG/) and [DXF](DXF/) |
| Hardware viewer, **Wooden Radio** tab | The 3D model in the browser: assembled, roof open, inside and exploded; click parts and wires |

To open the 3D model, start the viewer from `hardware-visualisation/` (`.venv/bin/python server.py`), open http://127.0.0.1:8000 and choose **Wooden Radio**. The plan and booklet links in its sidebar work through the same server.

## The design

The outside stays as in the concept: a 150 mm gable house, 278 mm tall to the top of the chimney tabs, 100 mm deep. The eaves overhang 20 mm (178 mm across), and a 22 mm beech dowel runs between the two chimney tabs: an 88 mm grip with 41 mm of finger space above the ridge. Natural birch walls, a painted roof, the screen as the window, the buttons as the door and the speaker behind the round attic window.

Three things changed inside the concept, none of them visible:

- **The ridge.** The two roof boards are now identical (120 × 86 mm) with square ends that meet on the centre line. That lets the halves open and close in either order.
- **The layout.** The power bank stands in the middle against the back gable with its USB-C socket on top, right under the ridge. The Pi moved to the inside of the left wall. The QUARKZMAN switch sits high in the back gable.
- **The keypad** moved 4 mm to the left so its right-angle header and jumper sockets clear the right wall.

### The split roof

Each roof half hangs on two small brass butt hinges (25 × 20 mm) at its eave: one leaf on the wall's outer face, one under the 20 mm overhang. Opening a half closes its hinge, and at exactly upright the overhang lands flat on the wall: that is the stop. The open half's weight sits outboard of the hinge, so it stays open on its own. Pull the two little knobs (14 mm slices of the handle dowel) up and outward; the halves stand like wings.

Under each half's ridge end are two magnet wedges: three glued 6 mm triangles each, with a Ø10 × 3 mm N42 magnet set 0.5 mm below the upright face in 2-part epoxy and covered with it. When both halves are down, the wedge faces meet on the centre line and the four magnets click the roof shut.

To charge: wait for the screen to go dark, press the back switch, open the roof, pull the QUARKZMAN plug out of the bank, plug in your charger. When the bank is full, plug the radio back in and fold the halves down. The back gable (four screws plus the dowel screw) is only for servicing.

### Power: the QUARKZMAN cable

Your [QUARKZMAN switch cable](https://www.amazon.pl/dp/B0H1JMNHQT) is USB-C male to USB-C female, 0.28 m, 22 AWG, 3 A and power only. The chain is: Baseus USB-C socket → QUARKZMAN male plug → switch body in the back gable → QUARKZMAN female end → USB-C to up-angled micro-USB lead → Pi. The switch body is held by a plywood clamp on two 12 mm spacers, its button through a 12 mm hole.

The listing does not give the switch body's size or type, so the 18 × 40 × 12 mm envelope, the hole and the spacer length are **provisional**: measure your cable first. It is a 2-wire cable, so test the whole chain on the bench before closing the house: the Pi must boot and `vcgencmd get_throttled` must print `0x0` with the screen and loud audio running. If the bank will not start through the cable, compare with the lead plugged straight into the bank; keep the second cable as a spare.

### Screws, calculated

Each length comes from `woodkit.fasteners`, from the real stack of parts: grip, washer, nut and one thread past it, rounded up to a standard length. Wood screws are sized for penetration without breaking through.

| | Where | Fastener | Qty | Stack (head side first, mm) |
|---|---|---|---:|---|
| A | Back gable to corner blocks | M3 × 25 countersunk, into glued nuts | 4 | back gable 6 + block 12 |
| B | Hinge leaf to wall | M3 × 12 countersunk, washer, nut | 8 | leaf 0.8 + wall 6 |
| C | Hinge leaf to roof eave | M3 × 10 countersunk, washer, brass acorn nut | 8 | leaf 0.8 + roof 6 |
| D | Knob to roof board | wood screw 3 × 16 countersunk + glue | 2 | roof 6 → knob 14 |
| E | Dowel handle ends | wood screw 4 × 25 pan head, 25 mm repair washer | 2 | washer 1.5 → dowel end grain |
| F | LCD to front gable | M2.5 × 16 countersunk, 4 mm nylon spacer, nut | 4 | gable 6 + spacer 4 + PCB 1.6 |
| G | Speaker to front gable | M3 × 12 countersunk, washer, nut | 4 | gable 6 + felt 1 + frame 1.2 |
| H | Keypad to the gable's tabs | M2.5 × 12 countersunk, nylon washer, nut | 4 | gable 6 + washer 1 + PCB 1.6 |
| I | Pi standoffs to left wall | M2.5 × 10 countersunk into 8 mm standoffs | 4 | wall 6 → standoff |
| J | Pi board to standoffs | M2.5 × 5 pan head | 4 | PCB 1.6 → standoff |
| K | Small boards to floor | M2.5 × 16 nylon pan head, 4 mm spacer, nylon nut | 6 | floor 6 + spacer 4 + PCB 1.6 |
| L | Switch clamp | M3 × 30 countersunk, 12 mm spacer, washer, nut | 2 | back 6 + spacer 12 + clamp 6 |

The plan's shopping page totals the nuts, washers, spacers, hinges, magnets, felt, hook-and-loop and leads, with spares. [hardware.csv](hardware.csv) also lists the drill sizes. The hinge countersinks go through the leaf into the plywood, so the heads sit flush and the hinge can close fully.

### For a small child

- **Fastenings:** every machine-screw tail ends inside the house. Outside you see only flush heads, two dowel washers and eight domed acorn nuts on the eaves.
- **Openings:** the back needs a screwdriver. The handle openings are wider than a finger can jam in.
- **Finish:** round all outside edges (R3) and use a toy-safe water-based finish.
- **Magnets:** neodymium magnets are dangerous if swallowed. Only ever use them embedded and covered as described, and check them now and then.

## What was checked

[checks/verify_house.py](checks/verify_house.py) reads the saved STEP files. All 50 checks pass ([verification.json](verification.json)):

- **Solids:** valid positive-volume solids in all four views.
- **Collisions:** no electronics touching wood, hinges, magnets, handle or fasteners; no screw stopping inside another part.
- **Envelope:** the outer size matches the facts.
- **Roof swing:** the halves clear everything at 10 opening angles, alone and together.
- **Magnets:** each pair is coaxial with a 1 mm gap.
- **Open roof:** each open half leans outward onto its stop.
- **Sizes:** handle space, every part on one A4 sheet, at least 2.5 mm of plywood between holes, and a standard length for every fastener.
- **Wiring:** the 27 nets match the working atlas exactly, and every route stays inside.
- **Weight and stability:** about 830 g; it tilts 25° backwards before tipping, and further every other way.

These remain to be confirmed on the real parts:

- **Electronics:** they are envelopes. The QUARKZMAN switch body, the USB-C plug overmoulds and the LCD fastener size are provisional.
- **Mounting holes:** keypad and small-board holes are amber transfer marks on the templates, so mark them from your boards.
- **Wires and screw heads:** wires are planning centre lines; countersunk heads are not modelled.
- **Wall tops:** where the roof rests, the wall tops are square-cut. Their inner edge leaves a small triangular gap inside under each board, by design.

## Regeneration

From the repository root, with `uv` installed:

```bash
bash design/house-radio/run-cad.sh python build_all.py   # models, facts, checks, step models, renders, PDFs (about 1 minute)
python3 design/house-radio/sync_viewer.py                # copy the meshes and facts into the viewer tab
```

The CAD toolchain is the wooden case's pinned cadgen; its download cache is shared. Generated files are ignored by git. The viewer copies in `hardware-visualisation/src/data/radio-*` are committed so the tab works after a fresh checkout.

| File | Purpose |
|---|---|
| [parameters.json](parameters.json) | Dimensions, roof, hinge, magnet, knob, component placement, the QUARKZMAN cable |
| [src/lib/house.py](src/lib/house.py) | The whole geometry: panels, roof halves with their poses, electronics, fasteners, wires, view modes |
| [src/lib/facts.py](src/lib/facts.py) | Cut list, sized fasteners, shopping list, routing |
| [src/lib/steps.py](src/lib/steps.py) | The booklet's 13 steps: parts added, camera, hardware |
| `src/house_*.py` | STEP + viewer GLB per view |
| [src/plans.py](src/plans.py), [src/booklet.py](src/booklet.py) | The PDFs |
| [checks/](checks/) | Saved-file checks and renders |

Electronics sizes and keypad button positions come from [../wooden-case/parameters.json](../wooden-case/parameters.json). The reusable parts live in [../woodkit](../woodkit/README.md).
