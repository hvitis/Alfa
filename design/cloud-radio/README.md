# Alfa cloud — two shells, horizontal battery and Pi

The enclosure has **two printed parts**, with no screws joining them.
Two bottom locating tongues engage matching receivers. Pivot the front closed, then engage five releasable snaps around the perimeter.
The rear shell contains the battery cradle and the Pi shelf. The rear panel is continuous: there is no separate battery door.

Nominal core: **210 × 215 × 86 mm**. The sides are continuous and smooth, with no decorative bumps. Front and rear shoulders blend over 5 mm from a 1.8 mm inset; the bottom remains a flat sole.
Depth is 24 mm less than the previous 110 mm enclosure. The compact crown removes 30 mm of unused height from the 245 mm version while retaining the bottom electronics compartment. Hardware dimensions, coordinates and orientations are unchanged.
Walls are 3 mm PETG. Both shells print on their outside faces. A small 0.4 mm, 45-degree bed-edge chamfer controls first-layer growth. The larger shoulders ease into the sides and crown while preserving the flat bottom plane.

## Bottom stack and clearance

Native X is width, Y is height and Z is front-to-back depth. Viewed from the front, +X points left.

| Item | Orientation and position |
| --- | --- |
| Baseus power bank | Flat in XZ: 106 mm wide × 69 mm deep × 14 mm thick. Bottom Y=7 mm; top Y=21 mm. |
| Battery cradle | Integral rear-shell side rails, floor seats and removable foam/strap retention. |
| Shelf above bank | Y=24–27 mm, leaving 3 mm above the nominal bank. |
| Raspberry Pi 3 | Flat in XZ: 85 × 56 mm footprint; PCB Y=30–31.6 mm. Component side points upward. |
| Pi support | Four short posts on the shelf. Internal M2.5 PCB screws are separate from the screwless shell joint. |
| GPIO harness | Reserved above the horizontal PCB, including the existing 5 mm uncertain-dimension allowance. |
| Controls | Same full-size positions as the horizontal-stack design; no scaling of holes or hardware. |

The six arcade buttons retain the user-confirmed 33 mm bezels, 28 mm mounting holes and 66 mm overall height.
The case conservatively reserves the full 66 mm behind each mounting face plus 12 mm at the wire exit.
Exact below-panel depth and retaining-nut outside diameter remain unknown. Each nut has a provisional 42 mm diameter × 6 mm axial allowance.
Printed mounting holes are 28.4 mm. Flat side seats and internal nut recesses accommodate the curved wall.
Check collar reach through the side seat, populated PCB heights, spade terminals and actual wire bends before a full print.

The LCD, amplifier, speaker and switch keep their existing mounting arrangements above or beside the bottom compartment.
The analog keypad, ADC and divider are absent from this arcade version.
Rear ventilation is beside and above the bottom stack.

## Join and open the two shells

To close:

1. Route the harness between the front controls and the lower Pi, leaving a service loop.
2. Keep wires clear of all snap beams and the joint lip.
3. Insert the two lower tongues into the rear receivers.
4. Pivot the front toward the rear. The receivers provide clearance for the locating tongues during this motion.
5. Press the sides and crown until all five snaps engage. Check the seam around the case.

To open, disconnect power. Press the perimeter release pads inward and ease the front away, starting at the top.
Support the front while releasing the remaining snaps, then pivot it forward and withdraw the lower tongues.
Do not pull on the harness. If a prototype is tight, use a plastic opening tool and adjust its clearance rather than forcing a beam.
The locating tongues are not a permanent hinge. There is no separate hinge pin or third printed shell component.

## Remove the battery

1. Remove the front shell as described above.
2. Disconnect the side-facing USB-C plug through the cradle side recess.
3. Release the retaining strap and remove any front foam shim.
4. Slide the bank toward the front, below the Pi shelf.

The shelf and Pi stay with the rear shell. The CAD check uses a battery extraction envelope with 5 mm extra width and height.
No fixed front stop obstructs that extraction path. Use removable foam and the strap to secure the bank in operation.
The USB-C plug and cable still need a physical fit check.

## Print preparation

Both shells lie flat and target at most **216 × 216 mm**, or **220 × 220 mm including a 2 mm brim**.
The user-confirmed Ender plate is **235 × 235 mm**. Because many Ender profiles expose only 220 mm of XY travel, the 3MF files use a conservative **220 × 220 mm usable bed**, with one shell centered per plate. The 235 mm physical plate alone does not establish firmware travel. Keep the purge line and bed clips clear of the model and brim.
No top/bottom subdivisions or additional shell screws are needed. The older experimental `build_ender3.py` split design is not part of this release.
Check your printer before printing; preserve 100% scale for the hardware fit.

| Setting | Starting point |
| --- | --- |
| Material | PETG |
| Nozzle / layer | 0.4 / 0.2 mm |
| Perimeters | 5 |
| Top / bottom layers | 6 / 6 |
| Infill | 25% gyroid |
| Brim | 2 mm; include it in plate placement |
| Orientation | Front and rear outside faces down; the exported models already have Z minimum at zero |

Verified print bounds: front **212 × 215 × 58 mm**, rear **210 × 215 × 80 mm**. With a 2 mm brim, the footprints are 216 × 219 mm and 214 × 219 mm.

Load one shell per plate. The rear shelf is integral and prints as a rib growing from the rear cover in this orientation.
Use local supports at the horizontal 28.4 mm side-button bores, horizontal PCB mounting posts and snap undersides as required by the layer preview. The round button interface prevents replacing these bores with teardrop holes. Avoid filling the whole enclosure with supports.
Keep support material out of release recesses, snap beams and PCB pilot holes.
Starting profile: 0.4 mm nozzle, 235 °C PETG / 75 °C bed, 240 °C first layer, 15 mm/s first layer and 25 mm/s outer walls. Use calibrated temperatures within the actual hotend and filament limits. `print-settings.json` gives the complete starting profile. A 2 mm brim fits the conservative travel area; do not add a skirt beyond it.

Print the button coupon and shell snap coupons first. The button coupon has 28.0, 28.4 and 28.8 mm holes from left to right.
The snap coupons compare 0.2, 0.3 and 0.4 mm clearance; the shell default is 0.3 mm.
They screen fit, not complete joint strength or long-term fatigue.

The STL and 3MF files have identical checked meshes and explicit print orientation. The 3MF containers store millimeters.
BREP and GLB retain the assembled frame, including the horizontal electronics orientation.
The native BREP assembly is reopened to check solid count, shell volumes and bounds. STEP is omitted because the exporter drops curved extrusion faces from this model. The parametric Python source is included.
`print-settings.json` lists starting settings and pending checks. No printer-specific G-code is supplied.
Inspect every slicer layer, especially the shelf, snap roots, bridges and first layer, before printing.

## Assembly hardware

| Location | Hardware |
| --- | --- |
| Front-to-rear shell connection | None; integral tongues and five releasable snaps |
| Battery access door | None; no separate door exists |
| Pi / LCD | Four M2.5 × 6 internal PCB screws each; check actual hole diameters |
| Arcade buttons | Their original retaining nuts |
| Speaker | M2.5 bolts, insulating spacers and washers to suit the actual unit |
| Amplifier / switch | Insulating ties and foam shims in the adjustable mounting slots |
| Battery | Foam shims and removable retaining strap |

The Pi mounting pattern is 58 × 49 mm, now in the horizontal XZ plane. The LCD pattern remains 30 × 53 mm.
Retain the bank in its bottom cradle, fit the Pi on the shelf, connect the harness and confirm full button travel.
Test display alignment while powered. Do not let screws or spacers touch circuit tracks.

## Verification and limits

`cloud-ender.scad` is an OpenSCAD inspection/assembly wrapper for the exported CAD meshes, with bed-fit assertions. Edit `build.py` and `parameters.json` to change the parametric geometry; do not scale imported shells to fit hardware.

`verification.json` records connected solids, assembled shell clearance, button bodies, provisional nuts, connected harness envelopes, battery extraction, closure features, print bounds and saved STL topology/winding/volume.
Each 3MF is generated from its checked STL and reopened to verify scale, triangle indices and bed placement.
Nominal hardware fits are digital checks. Physical fit, release force, snap fatigue, vibration, drops and operating temperatures remain untested.
The beam calculation is a simple strain screen, not FEA or a prediction of printed PETG fatigue. Flat shell printing leaves the snap beams along build Z: this is a layer-bond trade-off, and a coupon plus repeated-opening test is required. Keep snap roots solid. The 3 mm existing shell wall is retained for the calibrated joint; use variable-width infill between the perimeter paths.

Before service, test repeated opening and closing with the intended print settings, check that every snap retains the front, and verify that the strap holds an inert battery-sized mass.
Measure the actual nut, connector and terminal dimensions. Check the powered Pi and battery temperatures with the LCD and audio operating.
Recheck affected fits after a geometry or material change.

## Rebuild and view

From the repository root:

```sh
bash design/cloud-radio/run-cad.sh
make dev
```

Open <http://127.0.0.1:8000/#3dprint>. The current page is v2; the archived v1 remains separate.
The front-open view shows access to the bottom stack. The inside and exploded views show the rear-integral cradle and shelf.
Change `parameters.json` or `build.py` to rebuild with the pinned cadgen environment.
A failed CAD check preserves the last valid preview and downloads.

```sh
make site
npm run test:smoke
.venv/bin/python -m unittest tests.test_cloud_print
```

The ZIP contains the two shell meshes, fit coupons, BREP, GLB, source, parameters, print settings and verification report.
The included runner refers to `../wooden-case/run-cad.sh` inside this repository. Printing the supplied models does not require the CAD environment.
