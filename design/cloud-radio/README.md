# Alfa cloud — side battery access, flat rear electronics

The case is **206 × 211 × 72 mm** (width × height × depth), compared with the previous **210 × 215 × 78 mm**. Width and height decrease by **4 mm each**, depth by **6 mm**. The two main shells still join with two locating tongues and five releasable snaps. A third printed part closes the battery opening on the side.

## Layout and access

Native CAD coordinates: X = width, Y = upright height, Z = front-to-back. Viewed from the front, +X is the left side. The battery exits through this side, away from the two right-hand controls.

| Item | Revised geometry |
| --- | --- |
| Power bank | User-confirmed 106 × 69 × 14 mm, broad face in XY, parallel to rear lid |
| Raspberry Pi 3 B | 85 × 56 × 1.6 mm PCB in XY, parallel to rear lid, components facing the front |
| Pi mounts | Four rear posts, 58 × 49 mm hole pitch, 3 mm clearance behind PCB |
| Battery location | Above the Pi; separate XY areas, without stacking one on the other |
| Side opening | 73 × 18 mm clear aperture for the 69 × 14 mm battery end |
| Battery guides | 0.6 mm nominal lateral clearance, front retaining lips and an insertion stop |
| Side lid | Flush plate; 0.3 mm clearance around seat; two M2.5 × 8 screws into captive M2.5 nuts |
| Main shell split | Front 43.5 mm; rear begins at 43.8 mm; shell depths are intentionally unequal |
| Buttons | Five complete 28.4 mm bores in the front shell, axis at Z=24.5 mm |
| Plastic behind each bore | 4.8 mm to the front-shell seam; rear removal cannot open a button bore |
| Speaker grille | Seven individual cloud-shaped apertures |
| Pi & power connection | Detailed mechanical ports (micro-USB receptacle, dual USB pairs, Ethernet, HDMI, GPIO, SoC) and angled power plug with flexible cable corridor |

Pi dimensions and port heights follow the [official Pi 3 B mechanical drawing](https://datasheets.raspberrypi.com/rpi3/raspberry-pi-3-b-mechanical-drawing.pdf). LCD mounting dimensions follow the [Waveshare drawing](https://files.waveshare.com/upload/6/6d/2inch_LCD_Module_2D_Drawing.pdf). The existing confirmed battery and button dimensions are retained. The Pi port envelope now reserves the drawing's full 16 mm height.

The full 66 mm button body allowance remains, with another 12 mm at the terminal exit. The retaining nut is still a **provisional 42 mm diameter × 6 mm depth envelope**, not a confirmed measurement. The nut recess is on the inside; the outer panel remains intact around each bore. Fit each button from the outside and tighten its original retaining nut from inside. Plastic alone does not replace the retaining nut.

## Remove and replace the battery

1. Shut down the Pi and disconnect external charging power.
2. Remove the two side-lid screws and lift the lid straight outward. The main shell stays closed.
3. Disconnect the USB-C plug through the side opening. Hold the plug body, not its wires.
4. Pull the battery outward along +X using a **12 mm fabric ribbon** passed behind it during assembly.
5. Slide the replacement onto the guides until it reaches the inner stop. Reconnect the plug, tuck the cable clear of the lid and refit both screws.

The ribbon has space between the rear support strips. Use a thin removable foam pad at the stop or lid to prevent rattle after testing your actual bank. The cable plug remains provisional; confirm that it can be reached and unplugged through the opening. The battery is removed **disconnected**; do not pull a connected cable through the rails.

Install the two M2.5 nuts from the inside before closing the main shell. The modeled nut pocket has 5.2 mm across flats and 2.3 mm axial allowance. Measure your nuts and check screw engagement; use screws whose tips stay clear of wiring. Lid screws are separate from the screwless main-shell joint.

## Open the main case

Release the five perimeter snaps, ease the front away from the top, then withdraw the two bottom locating tongues. Support the front and its wiring. All five buttons, the LCD, amplifier and speaker remain attached to the front. The Pi, switch and battery guides remain on the rear.

When closing, insert the tongues, pivot the front into position and engage the snaps. Keep the front-to-rear harness in a service loop outside the battery corridor, snap channels and seam. The tongues locate the shells; they are not a permanent hinge.

## Print on the Ender

Print **front.stl**, **rear.stl** and **battery_door.stl** separately, at **100% scale**. All exports are in millimeters and already oriented on Z=0. Main shells lie on their outside faces; the side lid lies on its outer face.

The shell footprint is **206 × 211 mm**, or **210 × 215 mm with a 2 mm brim**. This fits the conservative **220 × 220 mm usable area** inside the previously confirmed 235 × 235 mm physical plate. The exact Ender model and firmware travel remain unconfirmed; keep clips and the purge line outside that footprint.

**Starting recipe:** PETG, 0.4 mm nozzle, 0.2 mm layers, five perimeters, 25% gyroid, 2 mm brim. Use local supports at the round side-button bores, snap overhangs and side-hatch bridge as required by the slicer. Block supports inside nut pockets, pilot holes and snap gaps. The rear Pi posts now grow vertically from the cover and need no horizontal-post support.

The side aperture lies with its **73 mm dimension in the bed plane** during rear-shell printing: its closing edge can need support. Inspect that bridge in the layer preview. Do not treat this model as support-free.

Print the button-hole coupon and three snap coupons before the main shells. `print-settings.json` records the starting profile. STL and 3MF contain the same checked geometry; the 3MF is a model container, not a printer profile. No machine-specific G-code is supplied.

## Validation and remaining bench checks

`verification.json` records connected solids, all hardware and connector clearances, battery extraction with the main case closed, lid removal, snap engagement/release, shell opening, reduced dimensions, print bounds, STL manifoldness and winding, 3MF scale, and native BREP readback. Enlarged provisional connector envelopes retain the existing 5 mm total allowance.

Digital checks do not establish real release force, snap fatigue, thermal performance or actual connector fit. Print the coupons, confirm the bank plug and nut dimensions, test repeated lid/main-shell opening, and run the Pi, screen and audio while checking temperature. The printed snap beams load across layers in the chosen shell orientation; this existing tradeoff still needs a physical fatigue test.

See [IMPROVEMENTS.md](IMPROVEMENTS.md) for implemented changes and further improvements, with their verification status.

## Rebuild and view

From the repository root:

```sh
bash design/cloud-radio/run-cad.sh
make dev
```

Open <http://127.0.0.1:8000/#3dprint>. **Battery access** removes the side lid and slides the bank outward. **Exploded** keeps the buttons with the front and Pi with the rear. The single-part viewer and downloads include the new lid.

Edit `parameters.json` and `build.py` for geometry. `cloud-ender.scad` is an inspection wrapper around the exact exported meshes. The native CAD runner is pinned to cadgen 0.7.21. BREP is provided instead of the earlier incomplete STEP export. A failing CAD build retains the last valid published files.

```sh
make site
npm run test:smoke
.venv/bin/python -m unittest tests.test_cloud_print
```

The ZIP contains all three printed parts in STL/3MF, coupons, BREP, GLB, source, settings and the verification report. Rebuilding the supplied source uses `../wooden-case/run-cad.sh` in this repository; printing the exports does not require CAD software.
