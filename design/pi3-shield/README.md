# Alfa Raspberry Pi 3 shield — prototype A

This is an integrated shield for the current Raspberry Pi 3 Model B application.
The shield replaces the ADC breakout, amplifier breakout, divider perfboard, and their jumper wires.
The LCD, five-button keypad, speaker, power bank, and Raspberry Pi remain separate parts.
Three short cables connect the LCD, keypad, and speaker to the shield.

**Status: engineering prototype for review and quotation. Physical hardware tests are pending.**
The 3D view shows the actual PCB export, with a simplified Pi and underside socket.
Open `http://127.0.0.1:8000/#hardware` and select **Raspi 3 PCB**, the third controller option.

## Board and assembly

| Item | Specification |
|---|---|
| Outline | 65 × 56 mm, 3 mm corner radii |
| PCB | Two copper layers, FR-4, 1.6 mm, proposed 35 µm copper |
| Mounting | Four 2.75 mm unplated holes, 58 × 49 mm centers, M2.5 hardware |
| Raspberry Pi connection | J1, 40-pin female socket on the **underside** |
| Factory SMT assembly | U1/U2, R1–R4, C1–C4, all on the top |
| Through-hole assembly | J1 underside, J2/J3/J4 top; request hand assembly from the supplier |
| Power | Existing Pi micro-USB input only; the shield draws 5 V and 3.3 V through J1 |
| Board identification | No EEPROM; this is an add-on shield, not a complete HAT implementation |

The proposed socket is Samtec **SSQ-120-01-G-D**, with 2.64 mm solder tails.
The socket body is approximately 8.51 mm high.
The preview uses an approximately 11 mm gap between the Pi top and shield underside.
The final socket engagement and spacer length require a physical fit check.
The socket, standoffs, and Pi header must fit without bending either board.
The Pi USB and Ethernet housings extend beyond the shield's right edge.
Camera and DSI cable cutouts are omitted because this application does not use those interfaces.

## Integrated circuits

**U1: ADS1115IDGSR**, VSSOP-10, runs from 3.3 V.
ADDR connects to ground for address `0x48`. The keypad uses AIN0.
Unused analog inputs connect to ground. ALERT/RDY remains unconnected.
The Pi supplies the I²C pull-ups. The shield adds no parallel pull-ups.
The selected part matches the repository's `ads1115` configuration.

**U2: MAX98357AETE+T**, 16-pin TQFN with exposed pad, runs from 5 V.
The **A** variant accepts the existing I²S stream.
GAIN_SLOT remains unconnected for 9 dB gain.
GPIO23 reaches SD_MODE through R3, a 1 kΩ resistor.
R4, 100 kΩ to ground, keeps the amplifier off until GPIO23 rises.
A high level selects the left audio channel, as the current application expects.
This circuit has no 5 V pull-up on the GPIO control signal.

R1 and R2 are 10 kΩ, 1% parts.
They divide a nominal 5 V keypad output to approximately 2.5 V at AIN0.
The keypad's internal resistors affect the actual levels, so final calibration remains necessary.
C1 decouples the ADC. C2/C3 decouple the amplifier, and C4 provides local supply capacitance.
The ceramic capacitors lose capacitance under DC bias. Hardware tests must cover supply dips during loud audio.

## Connectors and cables

The PCB connectors are keyed **JST PH, 2.00 mm pitch**.
They do not directly accept existing 2.54 mm Dupont sockets.
An assembler can supply the three harnesses, with loose or soldered ends for the existing modules.
The numbers in the assembly drawings identify pin 1. The connector latch defines mating orientation.

| Connector | Pins, in numerical order | Matching housing |
|---|---|---|
| J2 LCD | 1=3V3, 2=GND, 3=DIN, 4=CLK, 5=CS, 6=DC, 7=RST, 8=BL | PHR-8 |
| J3 speaker | 1=SPK+, 2=SPK− | PHR-2 |
| J4 keypad | 1=OUT, 2=5V, 3=GND | PHR-3 |

JST **SPH-002T-P0.5S** contacts suit the proposed PH housings and appropriate small-gauge wires.
Use the manufacturer's wire and crimp specifications when selecting the harness wire.
The LCD cable must map to the module's printed labels. Its existing connector order is not assumed.
The existing keypad order is OUT, VCC, GND, as recorded in the repository photos.
Neither speaker terminal connects to ground.
The 5 V keypad signal reaches the ADC only through R1/R2.

## Existing Pi software

The shield keeps these physical header assignments:

| Function | Physical Pi pin | BCM GPIO |
|---|---:|---:|
| ADC SDA / SCL | 3 / 5 | 2 / 3 |
| Audio BCLK / LRCLK / DIN | 12 / 35 / 40 | 18 / 19 / 21 |
| Amplifier enable | 16 | 23 |
| LCD DIN / CLK / CS | 19 / 23 / 24 | 10 / 11 / 8 |
| LCD DC / RESET / backlight | 22 / 13 / 18 | 25 / 27 / 24 |

The current `config.json` already matches these assignments.
The existing `dtoverlay=max98357a,no-sdmode` setting remains applicable.
The Python app controls amplifier sleep through GPIO23.
The earlier wiring table leaves the breakout SD pin open. The later sleep section adds GPIO23.
This shield implements the later sleep circuit directly.

## Files for a manufacturer

Run `make pcb` from the repository root. The generated files are in `design/pi3-shield/generated/`.
The editable KiCad project, local libraries, and package STEP models remain in this source folder.

- `alfa-pi3-shield.kicad_pro`, `.kicad_sch`, `.kicad_pcb`: editable KiCad 9 project.
- `Alfa.kicad_sym`, `Alfa.pretty`, and library tables: local symbols and underside socket footprint.
- `generated/fabrication-draft.zip`: Gerber layers, board outline, plated and unplated Excellon drills, and drill maps.
- `bom.csv`: manufacturer part numbers and assembly sides.
- `placement.csv`: **SMT parts only**, millimeters, origin at the PCB lower-left corner, positive Y upward.
- `assembly-top.pdf`, `assembly-bottom.pdf`: assembly reference and connector orientation.
- `schematic.pdf`: electrical design.
- `shield.step`, `shield.glb`: mechanical and browser models.
- `erc.rpt`, `drc.rpt`, `verification.json`: digital check results.

The placement origin is `(100,156)` in the KiCad editor's absolute coordinates.
The Gerbers, drill files, and placement file use this same lower-left origin.
The assembler must review rotations against the component pin-1 marks.
Through-hole connectors require the drawings and BOM rather than the SMT placement file.
The BOM proposes exact parts. Supplier availability and substitutions require review during quotation.

The amplifier exposed pad connects to ground through a 0.3 mm thermal via.
Ask the assembler to review solder-paste coverage and via wicking for the exposed pad.
The board has no battery charger, external power input, or added power switching.
The existing power bank and inline switch continue to supply the Pi.

## Physical checks before ordering a batch

1. Print the assembly drawing at actual size.
2. Compare the shield holes and header against the real Pi 3.
3. Select the socket and matching M2.5 spacers.
4. Check connector height, cable bends, enclosure clearance, and access to the Pi ports.
5. Ask the assembler to review IC packages, pin orientation, exposed-pad soldering, and harness pin order.
6. Order a small prototype batch.

## First hardware test

1. Keep the shield disconnected from the Pi during the initial resistance inspection.
2. Check for shorts between 5 V, 3.3 V, and ground.
3. Check the three harnesses against the connector table.
4. Connect the shield with the Pi power disconnected.
5. Supply power through the Pi micro-USB input.
6. Check TP1 for 5 V and TP2 for 3.3 V, relative to TP3 ground.
7. Run the repository's hardware checks and LCD test.
8. Check ADC address `0x48` and calibrate every keypad button.
9. Play audio at low volume before increasing it to the existing application limit.
10. Check supply voltage, Pi undervoltage reports, amplifier temperature, and Pi temperature during combined display and audio operation.
11. Check GPIO23 sleep, wake, repeated cold starts, and the physical switch.

No physical fit, electrical, acoustic, thermal, or enclosure test is complete at this revision.
Digital checks establish connectivity and layout constraints. They do not establish hardware performance.

## Refresh before staging

Run `make prepare-commit` from the repository root.
This command regenerates PCB exports, rebuilds the static website, and checks the export hashes.
It does not stage, commit, or stash any files.
The generated manufacturing files and website models are ignored by Git.

`make pcb` refreshes only the PCB exports. It requires a running Docker daemon.
`make pcb-check` checks the source and output hashes without Docker or KiCad.
`make site` and `make dev` regenerate missing or stale PCB exports before loading the website.
They never silently reuse an export after its PCB source changes.

GitHub Actions can generate these files on its Linux runner.
The reusable `pcb.yml` workflow runs the same pinned container and uploads all exports as an artifact.
The website and release workflows download that artifact from the same commit before building.
The workflow retains the editable routed PCB. It does not autoroute the circuit during each publication.
The two package STEP files are source assets, like the footprint libraries.
FreeCAD is only needed when changing those package models.

## Rebuild the circuit layout

The files were generated with KiCad **9.0.9**, Freerouting **1.9.0**, and FreeCAD.
The KiCad image is `kicad/kicad:9.0-full`, digest `sha256:f7d67c2bfff3733b84d5ef9b47eff152a69c1cd7ac1f8060bcc1d98a857a8913`.
The image uses x86-64 emulation on Apple Silicon.

1. Run `python3 build.py` with KiCad's `pcbnew` module available.
2. Route `alfa-pi3-shield.dsn` with Freerouting and save `alfa-pi3-shield.ses`.
3. Run `python3 build.py --finish`.
4. Run `build_models.py` with FreeCAD's Python interpreter and library path.
5. Run `make pcb` from the repository root to export and check the finished design.

The normal export command never modifies the editable source files.
It runs KiCad on temporary copies and publishes the generated snapshot only after the checks pass.
The source and output SHA-256 hashes are stored in `generated/manifest.json`.
The website rejects changed, missing, or mixed snapshots.

For example, mount this folder at `/work` in the pinned KiCad image.
Use `docker run --rm --platform linux/amd64 -v "$PWD:/work" -w /work --entrypoint python3 kicad/kicad:9.0-full build.py`.
Freerouting accepts `-de alfa-pi3-shield.dsn -do alfa-pi3-shield.ses -mp 40 -mt 1 -da -dct 0`.
The router completes signal connections. The generator preserves the fine-pitch amplifier escapes and repairs the adjacent VDD connection.

## Sources

- Repository: `docs/wiring.md`, its amplifier sleep section, `config.json`, and the measured component records.
- [Raspberry Pi add-on board mechanical drawing](https://github.com/raspberrypi/hats/blob/master/hat-board-mechanical.pdf).
- [Raspberry Pi add-on board design guide](https://github.com/raspberrypi/hats/blob/master/designguide.md).
- [Raspberry Pi 3 Model B mechanical drawing](https://datasheets.raspberrypi.com/rpi3/raspberry-pi-3-b-mechanical-drawing.pdf).
- [TI ADS1115 datasheet, DGS package and pin functions](https://www.ti.com/lit/ds/symlink/ads1115.pdf).
- [Analog Devices MAX98357A datasheet, TQFN pin functions and supply layout](https://www.analog.com/media/en/technical-documentation/data-sheets/max98357a-max98357b.pdf).
- [Samtec SSQ-120-01-G-D socket](https://www.samtec.com/products/ssq-120-01-g-d).

Standard footprints and most package models come from KiCad's installed libraries.
The ADS1115 and MAX98357A STEP models are package envelopes generated by `build_models.py`.
