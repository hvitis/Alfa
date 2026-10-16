# Alfa cloud radio — PETG prototype 4

This enclosure has two snap-together shells and a separate battery door.
Three M3 screws secure the rear shell. One M3 screw secures the battery door.
The battery door has two retaining tabs. It lifts out after removal of its screw.
The cloud has a flat base and smooth, tangent-connected lobes. Its nominal outside dimensions are 210 × 190 × 86 mm.
The front and rear rims have a 1.4 mm radius. The integrated handle has a 64 × 22 mm through-opening.
The handle follows the existing crown. Its grip is 20 mm deep and centered on the joint between the shells.
Each shell forms 9.85 mm of the grip, with a 0.3 mm joint gap.
Open recesses provide finger space on both sides of the grip.
Each recess has a partition that separates fingers from the electronics.
The horizontal battery door stays in the lower back, away from the handle.
No separate handle or extra printed part is required.
The three case screw posts join the outer wall. Their axes sit 5.2–8.2 mm from the outer outline.
The battery upper supports join the side walls. There are no tall supports between the controls.
Short component mounts stay at the component corners or beside their edges.
The preview identifies the shells as F-00, R-00, and B-00.
Frame features have IDs for their mounts, snaps, shelves, fences, and handle halves.
Hover over a visible surface to see its ID and name. The labels option shows frame IDs and hardware names.
The exploded view exposes the internal frame features.
Viewed from the front, the LCD is on the left and the keypad is vertical on the right.
Native CAD +X points left in that front view. Y points up and Z goes into the case.

## Status and dimensions

This is a fit prototype. Physical strength, fatigue, drops, and operating temperatures are not yet measured.
The verification report records digital checks separately from those physical tests.

The [Pi drawing](https://datasheets.raspberrypi.com/rpi3/raspberry-pi-3-b-mechanical-drawing.pdf) defines the controller outline and mounting pattern.
The [Waveshare drawing](https://files.waveshare.com/upload/6/6d/2inch_LCD_Module_2D_Drawing.pdf) defines the LCD outline and 30 × 53 mm mounting pattern.
The LCD active area is 30.6 × 40.8 mm. Its position in this prototype follows the drawing view and needs a powered fit check.
The user confirmed the battery dimensions, 69 × 106 × 14 mm.
Its USB-C socket is at the center of the 69 × 14 mm end face.
The bank lies horizontally, with a 106 × 69 mm footprint and its socket toward the right in native CAD coordinates.
The Pi sits above the bank. An angled power plug and the harness still need a physical fit check.
The 20 mm grip depth is a prototype choice for the requested three-year-old user.
Actual hand size and comfortable grip vary. An adult must check the printed grip with the child before use.

The remaining modules have incomplete mechanical documentation.
The [amplifier supplier](https://www.gotronik.pl/modul-wzmacniacza-audio-i2s-3w-klasa-d-dacmax98357-p-13866.html) gives an approximate 19 × 19 mm outline.
The [keypad supplier](https://sklep.msalamon.pl/produkt/modul-ad-key-klawiatura-5-przyciskow/) gives a 68 × 26 mm outline and an inconsistent 61 × 26 mm mounting pattern.
The keypad envelope reserves 68 × 30 mm. A shared window avoids five unverified button openings.
The ADC envelope reserves 9 × 29 mm. The QUARKZMAN body reserves 18 × 40 × 12 mm.
These dimensions and populated heights remain provisional.

The fit allowance adds **5 mm total to each uncertain dimension**, or 2.5 mm per side.
For the connected GPIO sockets, the PCB mating plane stays fixed. The extra depth extends toward the front instead.
The battery cradle also reserves 5 mm for foam and removal clearance.
The allowance does not apply to screw holes, the LCD window, or snap joints.
Adjustable slots and insulating cable ties retain the unverified boards.
The user supplied a 4.5 mm diagonal corner offset for speaker and keypad holes.
Each corresponding edge offset is 4.5 / √2 = 3.182 mm.
Hole diameters on these unbranded parts remain unverified.

## Build and live preview

From the repository root:

```sh
bash design/cloud-radio/run-cad.sh
make dev
```

Open <http://127.0.0.1:8000/#3dprint>.
The CAD script uses the existing pinned cadgen 0.7.21 environment.
The first run needs `uv`, Python 3.13, and access to the dependency index.
Later automatic rebuilds use the cached environment without network access.

Change `design/cloud-radio/parameters.json` or `build.py` to rebuild the model.
The browser reloads after the geometry checks and exports succeed.
A failed rebuild keeps the last valid model and downloads.
The terminal and `last-failed-verification.json` contain the failure details.
Restart the server after a change to the server configuration.

```sh
make site
npm run test:smoke
make stress
```

The static export includes every model and download. GitHub Pages needs no CAD software or backend.
The generated ZIP contains the STL files, STEP assembly, GLB model, parameters, source, guide, and verification report.
The source build script uses `../wooden-case/run-cad.sh` in this repository.
The ZIP can be used for printing without that script.

## Print preparation

1. Print the snap coupons from the ZIP first.
2. Compare the 0.2, 0.3, and 0.4 mm clearance variants.
3. Use the 0.3 mm variant for the default enclosure.
4. If it binds, adjust the clearance parameter and rebuild before the full print.
5. Load each STL separately in the slicer.
6. Use millimeters and 100% scale.
7. Use PETG, a 0.4 mm nozzle, and a 0.2 mm layer height.
8. Use at least five perimeters, six top/bottom layers, and 25% infill.
9. Add a 4 mm brim if the plate permits it.
10. Enable supports from the build plate for internal towers, rebates, and snap overhangs.
11. Block supports in small pilot holes and nut pockets.
12. Inspect the sliced toolpaths before printing.

STL files already have their print orientation and Z=0 base.
The front prints on its outside face. The rear and battery door print on their outside faces.
The STEP assembly retains the assembled coordinate system.
Support removal must leave each snap beam free along its length.

## Hardware and assembly

| Location | Hardware |
| --- | --- |
| Rear shell | Three M3 × 55 pan-head screws and three DIN 934 M3 nuts |
| Battery door | One M3 × 12 pan-head screw and one DIN 934 M3 nut |
| Pi | Four M2.5 × 6 thread-forming screws into printed pilot holes |
| LCD | Four M2.5 × 6 thread-forming screws; confirm the actual PCB hole diameter |
| Speaker and keypad | M2.5 bolts, washers, nuts, and insulating spacers to match the actual stack |
| Small boards and switch | Insulating cable ties and foam shims through the adjustable mounting slots |
| Battery | Closed-cell foam shims and a reusable retaining strap through the cradle slots |

1. Remove supports and sharp edges.
2. Check that each shell is a single intact part.
3. Fit the four M3 nuts before the electronics.
4. Check each nut for full seating in its pocket.
5. Fit the Pi to the rear supports, with its components toward the front.
6. Fit the LCD to the front supports.
7. Check the screen position with the LCD powered.
8. Fit the speaker with a soft gasket.
9. Set keypad height with insulating spacers.
10. Check full travel of all five buttons.
11. Retain the amplifier, ADC, and divider with insulating cable ties and spacers.
12. Retain the complete QUARKZMAN switch body with ties and foam shims.
13. Check that its actuator moves freely through the rear opening.
14. Route the existing power chain and signal wires between the mounts.
15. Keep wires clear of snap beams, screw towers, and the battery removal path.
16. Secure the battery with foam shims and its strap.
17. Keep its side-facing USB-C plug accessible through the door extension.
18. Engage the shell lip and all four snaps.
19. Fit the three rear screws by hand.
20. Insert both battery door tabs and fit its screw.

The small-board supports use slots with 5 mm travel rather than unverified fixed hole patterns.
Foam and insulating spacers compensate for unknown PCB heights.
The front corners retain the keypad board around the shared button opening.
Screws must not press the display glass or touch circuit tracks.
The screw lengths assume standard pan heads and DIN 934 nuts.

## Battery access

1. Shut down the Pi and disconnect power.
2. Remove the battery door screw.
3. Lift the door beside its screw and release the two bottom tabs.
4. Disconnect the USB-C plug through the side extension.
5. Release the battery strap.
6. Pull the bank straight out through the rear opening.

The digital check tests the bank removal path with an extra 5 mm in width and height.
The bank shares its USB-C port for output and charging.
The real plug still needs a fit check before final assembly.

## Physical test record — pending

These are development tests for an adult. They are not a child-product certification.
Use an inert mass with the battery dimensions for mechanical tests.

| Test | Procedure | Acceptance |
| --- | --- | --- |
| Initial fit | Fit every component and connect the complete harness. | No forced cables, trapped wires, board bending, or preloaded buttons. |
| Child grip fit | After the adult mechanical tests pass, check the unpowered enclosure with the child under adult supervision. | Fingers wrap the thin grip comfortably. Both recesses stay clear of the hand. |
| Snap cycles | Open and close the shells 50 times without their screws. | All four snaps engage. No cracks, whitening, or permanent bend. |
| Screw service | Remove and refit all four enclosure screws 20 times by hand. | Nuts stay seated. Bosses do not crack. Screw heads remain recessed. |
| Handle retention | Pull the integrated handle upward with 50 N for 10 seconds, three times, with inert mass fitted. | No cracks, permanent bend, or opening of the shell seam. |
| Door retention | Pull the closed door outward with 30 N for 10 seconds, three times. | The door and both tabs remain engaged. No cracks. |
| Battery retention | Apply 20 N to the inert bank in each principal direction for 10 seconds. | The strap and cradle retain the bank. No contact with electronics. |
| Development drops | Drop the fully secured enclosure with inert mass from 0.75 m onto plywood in six face orientations. | Shells and door stay closed. No loose internal parts or sharp broken edges. |
| Powered operation | Run the LCD and representative audio for two hours under adult observation. | Record ambient, Pi, bank, and case temperatures. No throttling or bank protection trips. |

Compare recorded temperatures with the limits for the actual bank, PETG filament, and electronics.
Repeat the affected tests after a geometry, material, or print-setting change.
Keep the print settings, part revision, measured force, temperatures, and photographs with the test record.

## Digital verification

The generator checks connected solids, print-bed size, nominal collisions, and expanded component envelopes.
It checks the battery extraction sweep and the saved STL edge topology, winding, and volume.
The snap calculation is a cantilever strain estimate with an assumed 2% limit.
It is not finite-element analysis and does not predict print fatigue or impact strength.
Connector models are simplified envelopes. The fit allowance cannot guarantee dimensions that are still unknown.
The browser stress test runs 100 cycles of tab changes, assembly views, and viewport changes.
It also checks static subpaths, downloads, direct hash routes, and bounded geometry counts in development.
