# Alfa cloud — two shells, horizontal battery and Pi

The enclosure has **two printed parts**, with no screws joining them.
Two bottom locating tongues engage matching receivers. Pivot the front closed, then engage five releasable snaps around the perimeter.
The rear shell contains the battery cradle and the Pi shelf. The rear panel is continuous: there is no separate battery door.

Nominal core: **210 × 215 × 78 mm**, evenly split into **39 mm front and 39 mm rear shells**. The sides are continuous and smooth, with no decorative bumps. The crown features a flat 40 mm wide horizontal mounting plateau at Y=215 mm centered at X=0, ensuring the 33 mm top arcade button bezel seats flush on an even surface. Front and rear shoulders blend over 5 mm from a 1.8 mm inset; the bottom remains a flat sole.
Depth is reduced to 78 mm by moving the navigation buttons from the front face to the perimeter walls. Front and back covers are of equal depth (39 mm each), eliminating the tall 80 mm print height on the bed.
Walls are 3 mm PETG. Both shells print on their outside faces. A small 0.4 mm, 45-degree bed-edge chamfer controls first-layer growth. The larger shoulders ease into the sides and crown while preserving the flat bottom plane.

## Bottom stack and clearance

Native X is width, Y is height and Z is front-to-back depth. Viewed from the front, +X points left.

| Item | Orientation and position |
| --- | --- |
| Baseus power bank | Flat in XZ: 106 mm wide × 69 mm deep × 14 mm thick. Bottom Y=82 mm; top Y=96 mm. |
| Battery cradle | Integral rear-shell side rails, floor seats and removable foam/strap retention. |
| Shelf above bank | Y=99–102 mm, leaving 3 mm above the nominal bank. |
| Raspberry Pi 3 | Flat in XZ: 85 × 56 mm footprint; PCB Y=104–105.6 mm. Component side points upward. |
| Pi support | Four short posts on the shelf. Internal M2.5 PCB screws are separate from the screwless shell joint. |
| GPIO harness | Reserved above the horizontal PCB, including the existing 5 mm uncertain-dimension allowance. |
| Controls | 5 perimeter arcade buttons: 4 in cross position (Top, Bottom, Left, Right) + 1 lower on the right. |

The five arcade buttons retain the user-confirmed 33 mm bezels, 28 mm mounting holes and 66 mm overall height.
The case conservatively reserves the full 66 mm behind each mounting face plus 10–12 mm at the wire exit.
Exact below-panel depth and retaining-nut outside diameter remain unknown. Each nut has a provisional 42 mm diameter × 6 mm axial allowance.
Printed mounting holes are 28.4 mm. Half-circle cutouts in each shell form the circular mounting bores at the split seam.
Check collar reach through the side seat, populated PCB heights, spade terminals and actual wire bends before a full print.

The LCD, amplifier, speaker and switch keep their existing mounting arrangements above or beside the electronics compartment.
The analog keypad, ADC and divider are absent from this arcade version.
Rear ventilation is beside and above the bottom stack.

## Investigation: Perpendicular (XZ) vs. Flat-to-Back (XY) Orientation

An investigation was conducted on whether rotating the Raspberry Pi and power bank 90 degrees to lie flat on the rear wall (XY plane) would allow shrinking case depth even further below 78 mm:

1. **Clearance Bottleneck in XY Plane**:
   - The five 33 mm perimeter arcade buttons penetrate 66 mm inward (+ 10 mm wire allowance) from the top, bottom, and side split seams.
   - The inner case width is 204 mm. With Left and Right buttons reaching 76 mm inward from each side, the remaining clear central corridor is only **$204 - (2 \times 76) = 52\text{ mm}$ wide**.
   - The Baseus bank is **106 mm wide** (or 69 mm in portrait); the Raspberry Pi 3 is **85 mm wide** (or 56 mm in portrait). Neither can fit within this 52 mm clear corridor between side buttons.
   - Consequently, any flat-to-back placement of the battery or Pi necessarily overlaps in the $(X, Y)$ plane with the button barrels and their 42 mm diameter retaining nuts.

2. **Z-Stacking and Split-Seam Constraints**:
   - Because the buttons mount symmetrically across the 50/50 split seam ($Z = D/2 = 39\text{ mm}$), their 42 mm diameter nuts ($R = 21\text{ mm}$) extend rearward to $Z = D/2 + 21 + 2.5\text{ mm (clearance)} = D/2 + 23.5\text{ mm}$.
   - If the 14 mm battery is placed flat against the rear wall ($Z = D - 3$ to $D - 17\text{ mm}$), its front surface reaches $Z = D - 17 - 2.5\text{ mm} = D - 19.5\text{ mm}$.
   - To avoid physical collision between the button nut and the flat battery, we must have:
     $$D/2 + 23.5 \le D - 19.5 \implies D/2 \ge 43.0\text{ mm} \implies \mathbf{D \ge 86.0\text{ mm}}$$
   - For the Raspberry Pi (20.6 mm tall envelope with standoffs and ports), the depth requirement would be even greater:
     $$D/2 + 23.5 \le D - 26.1 \implies D/2 \ge 49.6\text{ mm} \implies \mathbf{D \ge 99.2\text{ mm}}$$

3. **Conclusion**:
   - Stacking the battery or Pi flat on the rear wall forces the case depth to **increase to 86–100 mm**.
   - In contrast, the current **perpendicular (XZ) orientation** packs the components vertically along $Y$ (Bottom button $\to$ Battery $\to$ Pi $\to$ LCD), spanning depth $Z$ evenly across both front and rear shells ($Z = 3.2\text{ mm}$ to $72.2\text{ mm}$).
   - The perpendicular orientation is the key architectural feature enabling the **78 mm overall thinness** and the **39 mm / 39 mm equal split**.

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

Verified print bounds: front **210 × 215 × 46 mm**, rear **210 × 215 × 61 mm**. With a 2 mm brim, the footprints are 214 × 219 mm. Neither part exceeds 62 mm on the build plate (previously rear was 80 mm).

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
