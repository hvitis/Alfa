# Moomin plywood case — revision A

Open [the offline 3D planner](viewer.html), [the four A4 cutting templates](PDF/a4_cutting_and_drilling.pdf), and [the placement and wiring plans](PDF/placement_and_wiring.pdf). The planner includes assembled, open and exploded views. It embeds the CAD meshes and works without a server or an internet connection. Keep the PDF folders beside it so its document links work.

[Download the complete planning bundle](../moomin-wooden-case.zip) to move the CAD, templates and source together. Extract it and open `moomin-case/design/wooden-case/viewer.html`.

The main box is **150 mm wide × 200 mm high × 64 mm deep**, made from **6 mm plywood**. The clear inside space is **138 × 188 × 52 mm**. The side switch cover adds 6 mm to the overall width: allow **156 × 200 × 64 mm** for the complete enclosure. It uses your existing five-button board. Four rear screws give access to the battery, connectors and Pi.

This is a dimensioned workshop design. The saved CAD geometry has been checked, but the actual parts have not been assembled in this box. **Check the keypad opening and switch housing against the parts before cutting. Transfer the amber mounting marks from the actual boards.** Those marks are placement suggestions, not measured hole locations.

## Dimensions and placement

All dimensions below are in millimetres. X runs right, Y runs down from the top of the front panel, and Z runs inward from its outer face. These coordinates also describe the rear panel's **inside** face. Mark TOP on every part. The exported CAD coordinate system is `(X, -Y, -Z)`; its front faces positive Z.

| Part | Footprint / depth | Placement X, Y, Z | Mounting method |
|---|---|---|---|
| Baseus 5000 mAh | 69 × 106 × 14 | 73, 82, 9 | 3 mm foam/Velcro below; two retaining bands |
| Raspberry Pi 3 B | 56 × 85 × 1.6 PCB, rotated portrait | 28, 55, 48.4 | Rear cover, four 8 mm standoffs; components face the front |
| Waveshare LCD | 35 × 58 PCB; depth envelope about 10 | 24.5, 18, 6 | PCB at Z10 on 4 mm spacers; screen faces the opening |
| Five-button board | 30 × 65 × 1.6 PCB | 22, 110, 7 | Corners behind plywood tabs; spacer height must be checked |
| Speaker | 40 × 40 × 20 | 92, 12, 6 | Frame against front panel; mounting holes transferred from frame |
| MAX98357A | 20 × 15 PCB | 51, 89, 10 | Insulating supports, nominally 4 mm above inside front |
| ADS board | 9 × 29 PCB | 59, 135, 9 | Insulating supports, nominally 3 mm above inside front |
| Divider perfboard | 16 × 20 PCB | 54, 174, 9 | New small board holding two 10 kΩ resistors and ground join |
| Inline USB switch | Reserved 18 × 40 × 22 | 0, 140, 21 | Side window, screwed cover and inside clamp; **provisional** |

The Baseus, button board, speaker, ADC and amplifier footprints come from your measurements. The Pi dimensions and 49 × 58 mounting pattern come from [Raspberry Pi's mechanical drawing](https://datasheets.raspberrypi.com/rpi3/raspberry-pi-3-b-mechanical-drawing.pdf). The LCD outline, 30 × 53 mounting pitch and 30.6 × 40.8 active screen area come from [Waveshare's drawing](https://files.waveshare.com/upload/6/6d/2inch_LCD_Module_2D_Drawing.pdf).

The CAD electronics are **dimension envelopes with simplified connectors**. Vendor outline drawings were found, but exact vendor STEP assemblies were not available for this set of parts. Button centre positions and heights, LCD active-area offset, speaker internals, small-board headers, USB plugs and switch body are approximate. The LCD PCB holes are modelled at 3 mm for planning; confirm the actual fastener size. No heat sink or fan has been added to the model. Fastener heads, captive nuts and small-board supports are specified below but are not all modelled.

## Cut list: four A4 pieces

Use four **210 × 297 × 6 mm** pieces. The nesting leaves at least 5 mm between parts. Saw to the waste side of the line, then sand to size. The templates describe finished dimensions; they do not include saw kerf.

| Sheet | Parts | Finished dimensions | Quantity |
|---|---|---|---:|
| 1 | Front panel | 150 × 200 × 6 | 1 |
| 2 | Rear cover | 150 × 200 × 6 | 1 |
| 3 | Left and right walls | 52 × 188 × 6 | 2 |
| 3 | Top and bottom | 150 × 52 × 6 | 2 |
| 4 | Switch cover | 40 × 72 × 6 | 1 |
| 4 | Inside switch clamp | 22 × 64 × 6 | 1 |
| 4 | Rear screw block pads | 12 × 12 × 6; laminate in pairs to make four 12 mm blocks | 8 |

The top and bottom span the full width. The left and right walls fit between them. The front and rear cover the complete frame. These are glued butt joints; no finger joints, routing, laser cutter or 3D printer is needed. Save sheet 4 offcuts for mounting pads and cable retainers.

## Printing, cutting and drilling

Print [a4_cutting_and_drilling.pdf](PDF/a4_cutting_and_drilling.pdf) on A4 at **Actual Size / 100%**. Turn off Fit, Shrink and borderless enlargement. Measure the **100 mm calibration line on every page** before using it. The four SVGs are also sized at 210 × 297 mm. A PNG preview is not a drilling stencil.

Dark continuous lines are cuts and holes. Dashed component outlines show placement behind the plywood. Amber crosses are unmeasured mounting suggestions: **do not drill them directly from the paper**. The side switch slot and actuator hole are proposed cuts; measure the purchased switch first. Use the exact DXF files only after those fit checks.

| Feature | Proposed size / position |
|---|---|
| LCD opening | 32 × 46, top-left X26 Y24; R2 corners |
| LCD mount centres | X27/57, Y20.5/73.5; four Ø3 plywood holes |
| Keypad opening | One stepped 28 × 63 opening, centre X37 Y142.5; 18 mm wide at its ends |
| Speaker grille | 21 holes Ø4 on 6 mm pitch around X112 Y32 |
| Pi rear mount centres | X31.5/80.5, Y58.5/116.5; four Ø3 plywood clearance holes for M2.5 fixings |
| Rear cover screws | X12/138, Y12/188; four Ø3.5 holes for M3 screws |
| Rear vents | Ten Ø4 holes: X30/40/50/60/70 at Y146 and Y154 |
| Side vents | Five Ø4 per wall; local depth coordinate 26, local heights 68/80/92/104/116 |
| Top/bottom vents | Six Ø4 per part; X30/45/60/90/105/120, local depth coordinate 26 |
| Left switch slot | 26 × 44; local X13 Y132 on the 52 × 188 wall; verify housing first |
| Side switch fixing holes | Ø3.5 at local X26, Y126/182 |
| Switch cover | Ø3.5 at X20 Y8/64; proposed Ø16 actuator hole at X20 Y36 |
| Switch clamp | Ø3.5 at X11 Y4/60 |
| Block pads | Ø3.5 at X6 Y6 |

For the side wall templates, local X measures depth and local Y measures height from that part's top. The sheet shows the bottom panel rotated to save plywood. Use [cut-list.json](cut-list.json) for every part's local hole coordinates.

Use a drill with 3, 3.5 and 4 mm bits, a saw, clamps, a square and sandpaper. Closed windows require a narrow blade that can start in a drilled hole, such as a coping saw, fret saw or jigsaw. A normal broad hand saw alone cannot cut those closed windows. Drill a starter hole inside the waste, thread the blade through it, and finish the edge with sandpaper. Cut the stepped keypad window carefully to preserve the four corner tabs. A 16 mm bit is optional for the switch opening; small drilled holes and a narrow saw can make it instead.

Before cutting the keypad window, put the paper over the real board. All five caps must move freely, while the corner tabs still cover the board's mounting holes. Adjust the window if the measured cap centres differ from the estimate. Set the mounting spacers so the caps remain reachable through 6 mm plywood without binding or pressing the switches continuously.

## USB switch and power cable

Use [The Pi Hut Micro-USB Cable with On/Off Switch, SKU 103418](https://thepihut.com/products/micro-usb-cable-with-on-off-switch). Its supplier lists a roughly 30–31 cm, power-only micro-USB female-to-male cable tested with Pi 3. It uses its own push switch. The supplier does **not** publish the housing dimensions or a current rating on that page, so the 18 × 40 × 22 envelope is a reserved space rather than a verified part model.

Connect:

```text
Baseus USB-C output
  → short USB-C male to micro-USB male power lead, about 20 cm
  → micro-USB female socket on switched cable
  → the cable's existing ON/OFF switch
  → micro-USB male plug
  → Pi 3 micro-USB power input
```

Orient the bank with its USB-C socket toward the top of the box. The CAD reserves space above it for the connector. Use a low-profile/right-angle micro-USB plug or adapter at the Pi if the supplied straight plug exceeds the 18 mm reserved side clearance. Measure both plug housings before securing the boards.

The planning route is about 198 mm from the bank to the switch, 40 mm through its body, and 151 mm from the switch to the Pi. The C-to-micro lead plus the switch cable's input half provides the upstream length. The short downstream half may leave little lid slack. **Open the rear by only about 20 mm, unplug the Pi micro-USB plug, then open farther.** Re-route that half more directly if necessary; do not force sharp cable bends. Keep excess upstream cable above the bank or along the left wall, clear of the switches.

Mount the whole original switch body behind the side cover. Use the inside plywood clamp to hold its housing, with two M3 × 35 screws, washers and nuts. Fit **two 12 mm M3 spacers between the left wall and the clamp**, on the screw axes. They keep the clamp flat when the nuts are tightened. Adjust the spacer length and add soft shims to suit the measured switch body. Tighten only enough to retain it; the clamp must not squeeze the button or cable. Adapt the cover hole to the actual actuator. Do not cut or rewire the purchased cable.

Test the selected bank, lead, switch and adapter together before closing the box. Run the LCD and loud audio, then check `vcgencmd get_throttled`. A result of `0x0` means no recorded throttling/undervoltage flags since boot. Also test restarting with this switch when the bank is partly discharged. The bank may need its own wake button after power is cut; the USB switch does not guarantee that the bank turns its output back on automatically.

The bank's single USB-C port is shared for output and charging. To charge it, shut down, switch off, open the rear, and unplug the output lead from the bank. The plan does not assume charging the bank while it powers the Pi.

## Extra materials and fixings

| Item | Quantity / use |
|---|---|
| Wood glue, clamps, sandpaper | Frame joints and four laminated corner blocks |
| M3 × 25 screws, washers, captive nuts | Four removable rear cover fixings; confirm screw engagement with actual washers/nuts |
| M3 × 35 screws, washers and nuts | Two switch cover/clamp fixings; adjust length for measured housing |
| 12 mm M3 insulating spacers | Two supports between left wall and switch clamp; adjust for measured housing |
| 8 mm M2.5 standoffs and suitable screws | Four Pi supports on the rear cover |
| 4 mm insulating spacers and suitable LCD fasteners | Four LCD supports; verify LCD hole diameter before buying screws |
| Small insulating spacers, washers and fasteners | Keypad, speaker, amplifier and ADC; match actual mounting holes |
| Foam-backed Velcro and two retaining straps | Battery retention without drilling or gluing the bank |
| 16 × 20 mm perfboard, two 10 kΩ resistors | Divider; use the parts already fitted if they can occupy this footprint |
| Jumper leads, speaker wire, heat-shrink, cable ties | Follow wiring.csv; keep service loops on Pi-connected leads |
| Switched micro-USB cable, short C-to-micro lead | Power chain above; optional low-profile Pi adapter |

Keep metal fasteners away from exposed pads and traces. Use insulating spacers. Choose mounting screws from actual hole diameters; the unknown board holes were not invented in the DXF cut profiles.

## Assembly order

1. Print and calibrate the templates. Check the real keypad, speaker, LCD and USB switch against them. Mark the actual mounting holes.
2. Cut and drill the panels. Sand the openings and soften exposed edges. Trial-fit the frame with the rear cover before gluing.
3. Glue pairs of 12 × 12 pads into four 12 mm blocks. Drill the block holes through both layers. Glue an M3 nut to each block's inward face, aligned with the hole; keep glue out of the thread. These nuts are outside the simplified CAD solid.
4. Glue top, bottom and side walls into the rectangular frame, then glue that frame to the front. Keep the rear cover removable. Glue the four blocks inside the rear corners, flush with the rear mounting plane.
5. Fit the LCD, speaker and keypad from inside. Use the keypad's covered corner holes. Fit the amplifier, ADC and divider on insulating supports. Check cap travel and LCD alignment with the real display powered.
6. Fit the battery on foam/Velcro at the marked position. Add its retaining straps. Keep its connector and wake button accessible when the rear is open.
7. Mount the Pi on the inside rear cover with 8 mm standoffs. Its components and GPIO plugs face into the box. Route its power plug toward the left wall.
8. Fit the USB switch, its cover and inside clamp. Route the complete power chain. Follow [placement_and_wiring.pdf](PDF/placement_and_wiring.pdf) and [wiring.csv](wiring.csv) for the remaining leads. Add **100 mm spare length on Pi-connected signal leads** for opening the cover. Secure loose cable without loading solder joints.
9. Test all five buttons, the LCD and audio before fitting the rear screws. Lift and close the rear once to check that the harness clears the battery and does not pinch at the frame.
10. Run a long LCD/audio test with the case closed. Check Pi temperature, throttling flags and the bank's temperature. The vent pattern is a passive-cooling proposal; enclosure temperature has not been measured. Adjust ventilation if that test requires it.

The program's five-minute inactivity shutdown halts Raspberry Pi OS. It does not physically disconnect the 5 V supply. Switch the USB cable off after shutdown, then on to start again. The project's [read-only SD-card task](../../docs/improvements-todo.md) remains to be done; until it is configured and tested, shut down before cutting power manually.

## Electrical connections

The enclosure preserves all **27 connections** from the existing [wiring atlas](../../hardware-visualisation/src/data/setup.json) and [wiring guide](../../docs/wiring.md). The PDF has five physical cable overlays and a full connection table. [wiring.csv](wiring.csv) records wire IDs, endpoints and suggested lengths. These lengths are estimates from the planning routes, with service allowance; measure the actual harness before cutting wire. Insulated wire crossings are not joins.

The two 10 kΩ resistors halve the keypad OUT voltage before ADC A0. Speaker minus connects to the amplifier output, not to Pi ground. LCD BL remains physical pin 18 / GPIO24; physical pin 12 / GPIO18 is the amplifier clock. Use the printed labels on each board when orienting the actual header.

## Files and verification

| Deliverable | Files |
|---|---|
| Interactive offline planner | [viewer.html](viewer.html) |
| Actual-size A4 cut/drill templates | [PDF](PDF/a4_cutting_and_drilling.pdf); SVG [1](SVG/a4_sheet_1.svg), [2](SVG/a4_sheet_2.svg), [3](SVG/a4_sheet_3.svg), [4](SVG/a4_sheet_4.svg) |
| Placement and electrical plans | [PDF](PDF/placement_and_wiring.pdf), [CSV](wiring.csv), [routing data](routing.json) |
| Engineering overview, reduced scale | [enclosure_drawing.pdf](PDF/enclosure_drawing.pdf); use the separate 1:1 PDF for cutting |
| Assembled CAD | [STEP](STEP/enclosure.step), [GLB](GLB/enclosure.glb) |
| Exploded CAD | [STEP](STEP/exploded.step), [GLB](GLB/exploded.glb) |
| Open CAD, rear and right wall removed | [STEP](STEP/internals.step), [GLB](GLB/internals.glb) |
| Native 1:1 cutting contours | DXF [front](DXF/front_cutting.dxf), [rear](DXF/rear_cutting.dxf), [walls](DXF/walls_cutting.dxf), [accessories](DXF/accessories_cutting.dxf) |
| Parameters and cut list | [parameters.json](parameters.json), [cut-list.json](cut-list.json) |
| Saved-artifact validation | [verification.json](verification.json), [viewer-verification.json](viewer-verification.json) |
| Local CAD measurement viewer | [All CAD/DXF file links](cad-viewer-links.md); local server must be running |

STEP dimensions are in millimetres; GLB is exported in metres with a Y-up axis. The offline viewer converts it back to the CAD view. Native STEP retains named components for measurement. The wire paths and connector shapes describe assembly space, not bend-radius-certified cable models.

Checks read the **saved** STEP and DXF files: valid positive-volume geometry, requested footprints, mounting pitches, mechanical interference, cable containment, battery clearances, A4 bounds, saw gaps, DXF closure/duplicates/units, and the unchanged wiring atlas. The overlap threshold is 0.01 mm³. Insulated wire segments are excluded from mechanical interference checks because their ends intentionally enter connector envelopes. Physical fit, thermal behaviour and unknown mounting interfaces remain untested. See the JSON report for the full results. All three CAD views and all four DXF layouts were also rendered and visually reviewed.

The offline viewer was tested via `file://`, with external network requests blocked: all three models loaded, the camera controls and visibility controls worked, and wire selection identified physical pin P12 correctly. No external requests or browser exceptions occurred.

## Regeneration

The PDFs are generated from Python source. `src/enclosure_drawing.py` creates the engineering overview from the saved STEP model. `src/workshop_plans.py` creates the cutting and wiring PDFs, using the generated DXF contours and shared component data. `package.py` collects the finished files and source into the ZIP; it does not generate the PDFs.

Git tracks the parameters, model/drawing code, viewer source, build/check scripts and documentation. Generated PDF, STEP, GLB, DXF, SVG, previews, standalone HTML, manifests, verification reports, local viewer links and the ZIP are ignored. They remain available locally. After a fresh checkout, run the commands below to recreate them.

CAD source uses the CAD, Engineering Drawing and DXF workflows from [earthtojake/text-to-cad](https://github.com/earthtojake/text-to-cad), pinned to cadgen 0.7.21 and Python 3.13. Build123d generates native solids; the DXF profiles use the same native panel geometry. The PDF cutting lines are read back from those DXFs. The viewer embeds the native GLB meshes. This design folder is a workstation planning tool; it adds no runtime load to the Pi player.

From the repository root, with `uv` installed:

```bash
bash design/wooden-case/run-cad.sh python build_all.py
bash design/wooden-case/run-cad.sh python checks/verify_case.py
bash design/wooden-case/run-cad.sh python checks/render_review.py
node design/wooden-case/build-viewer.mjs
bash design/wooden-case/run-cad.sh python checks/smoke_viewer.py
bash design/wooden-case/run-cad.sh python viewer_links.py
bash design/wooden-case/run-cad.sh python package.py
```

The first CAD build downloads its Python packages; the first review render installs its headless browser. The completed planner and PDFs need neither download. Building the HTML requires the existing `hardware-visualisation` Node dependencies. Edit [parameters.json](parameters.json) and [src/lib/geometry.py](src/lib/geometry.py), then regenerate all outputs. Some placement details are explicit constants in the factory, so changing one parameter is not a promise that every layout automatically adjusts. Re-run the saved-file checks after any geometry change.
