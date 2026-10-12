# Hardware visualisation

This folder contains the Three.js viewer, its modules, and a FastAPI server with live reload.
The Raspberry Pi test app remains in the project-level `moomin/` folder.

## Start the live server

Run these commands from this folder:

```bash
pnpm install
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python server.py
```

Open **http://127.0.0.1:8000**.

FastAPI serves the source modules directly. No frontend build is required for development.
The browser refreshes after changes to `src/`, `index.html`, or `server.py`.
The refresh preserves the camera position, camera mode, scene, cable group, selected module, and selected cable.
The green “Live” indicator confirms the file-change connection.

## Views and module explanations

The viewer has three views: **R1 & R2 close-up**, **Pi 3 setup**, and **Pico 2 WH setup**.

1. Select a view from the toolbar.
2. Click a module in 3D to display its purpose and connections.
3. Alternatively, select the module from the sidebar list.
4. Click **Look closer at this module** to move the camera toward it.
5. Click a cable to display its endpoint labels.

The blue outline marks the selected module.
The Pico view uses amber outlines and pin markers for changes from the Pi 3 setup.
The sidebar explains the firmware changes.
The **Compare all 19 header connections** section displays the pin comparison.
On larger screens, the sidebar scrolls separately to keep the 3D view visible.
Cable rows marked **CHANGED** have different controller connections.
Rows marked **NEW** connect the two shared supply joins.
The LCD cable colors still match the photograph.

## Your MAX98357A amplifier

The amplifier model follows [max1.jpg](../photos/max1.jpg), [max2.jpg](../photos/max2.jpg), [max3.jpg](../photos/max3.jpg), and [max4.jpg](../photos/max4.jpg).
It includes the purple PCB, yellow seven-pin header, green screw terminal, mounting holes, chip, and back-side markings.
The board is enlarged for clear connections. The speaker leads match max4: teal at minus and yellow at plus. The five header jumper colors are diagram colors.

1. Click **Amplifier wiring** in the toolbar.
2. Click **Look closer at amplifier** for a detailed view.
3. Select **Before soldering** to see the header above the seven PCB holes.
4. Select **Solder underside** to see the short legs and seven separate solder joints.
5. Select **Connect cables** to display the five header jumpers and two speaker wires.
6. Click a header label or connector to trace its cable.

The assembly views hide the audio cables. The underside view raises the board for camera access.
The camera, assembly mode, and selected pin survive live refresh.

With the component side up, place the green speaker block at the top and the yellow header at the bottom.
**max4 confirms LRC is first and BCLK is second.** The header order from left to right is:

```text
LRC   BCLK   DIN   GAIN   SD   GND   VIN
 wired wired wired  —     —   wired wired
```

All seven header pins need solder joints on the underside.
The five wired pins receive female jumper connectors on their long ends.
GAIN and SD stay without external wires in this setup.
The header preview does not mean that loose pins make a reliable electrical connection.
The actual printed labels remain the reference before soldering or connecting wires.

The green terminal has **speaker − on the left** and **speaker + on the right** in this orientation.
The speaker wires enter the openings opposite the screw heads. The screws clamp the stripped wire ends.
Neither speaker wire connects to ground.

The Pi 3 and Pico views use the same amplifier model.
The pin table changes to show the selected controller's physical pins and signals.
The Pico VIN cable connects through the shared USB 5 V join.

Signal and mode reference: [MAX98357A pin descriptions](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/pinouts).

## Pico 2 W with fitted headers (WH)

This view replaces the Pi 3 with a Pico 2 W with fitted headers.
The screen, keypad, ADC, two resistors, MAX98357A, and speaker remain the same.
The PAM8403 remains disconnected.

The Pico has two rows of 20 pins.
With USB at the top, physical pin 1 is top-left and pin 40 is top-right.
The `GP` number identifies a GPIO signal. It is different from the physical pin number.

| Module terminal | Pi 3 physical pin | Pico physical pin | Pico signal |
|---|---:|---:|---|
| LCD VCC | 1 | 36 | 3V3 OUT, through the 3.3 V join |
| LCD GND | 6 | 3 | GND |
| LCD DIN | 19 | 25 | GP19, SPI0 MOSI |
| LCD CLK | 23 | 24 | GP18, SPI0 SCK |
| LCD CS | 24 | 22 | GP17 |
| LCD DC | 22 | 21 | GP16 |
| LCD RST | 13 | 26 | GP20 |
| LCD BL | 18 | 27 | GP21 |
| MAX98357A VIN | 2 | 40 | VBUS, through the USB 5 V join |
| MAX98357A GND | 9 | 13 | GND |
| MAX98357A BCLK | 12 | 14 | GP10, PIO clock |
| MAX98357A LRC | 35 | 15 | GP11, PIO word-select |
| MAX98357A DIN | 40 | 16 | GP12, PIO data |
| ADC VDD | 17 | 36 | 3V3 OUT, through the 3.3 V join |
| ADC GND | 20 | 8 | GND |
| ADC SDA | 3 | 6 | GP4, I2C0 SDA |
| ADC SCL | 5 | 7 | GP5, I2C0 SCL |
| Keypad VCC | 4 | 40 | VBUS, through the USB 5 V join |
| Keypad GND | 14 | 18 | GND |

### Shared power connections

The Pi 3 uses two separate 3.3 V pins and two separate 5 V pins in this setup.
The Pico uses one pin for each supply, so the drawing adds two separate joins.

1. Connect Pico pin 36 to the **3.3 V join**.
2. Connect LCD VCC and ADC VDD to that join.
3. Connect Pico pin 40 to the **USB 5 V join**.
4. Connect keypad VCC and MAX98357A VIN to that join.
5. Use separate breadboard rows or suitable split connections for the two joins.

USB must supply power for the 5 V VBUS connection.
VSYS is a system supply input, not a regulated 5 V output.
The 3.3 V and 5 V joins must remain separate.
The existing R1/R2 signal join remains unchanged.

### Firmware and media

The existing `moomin/` app runs on Raspberry Pi OS and uses Linux drivers.
It does not run on the Pico.
The Pico needs separate firmware for SPI pixels, I2C button readings, and I2S audio through PIO.
This view proposes the firmware pin assignments; it does not include Pico firmware.

The proposed PIO audio pins use adjacent GP10 and GP11 for BCLK and LRC.
GP12 carries the audio data.
The firmware must also manage photo and sound storage within the Pico's available flash and RAM.
An MP3 file needs an audio decoder; WAV PCM data needs playback code.
The Pico's built-in WiFi and Bluetooth need no additional hardware in this diagram.

Pin and power reference: [Raspberry Pi Pico 2 W datasheet](https://datasheets.raspberrypi.com/picow/pico-2-w-datasheet.pdf).
PIO audio reference: [Raspberry Pi I2S PIO program](https://github.com/raspberrypi/pico-extras/blob/master/src/rp2_common/pico_audio_i2s/audio_i2s.pio).

## Camera controls

| Control | Action |
|---|---|
| Left-drag in Inspect mode | Orbit around the current target |
| Right-drag or Shift-drag | Pan the camera |
| Wheel | Zoom, or move forward/back in Free movement mode |
| Left-drag in Free movement mode | Look around from the current camera position |
| W / S | Move forward / backward |
| A / D | Move left / right |
| Q / E | Move down / up |
| Shift with a movement key | Move faster |
| On-screen movement buttons | Move the camera without a keyboard |
| Focus shared join | Move close to the R1/R2/A0 connection |
| Reset camera | Restore the view for the selected scene |

Click the 3D view before using the keyboard.
On touch screens, two fingers pan and zoom in Inspect mode.
The movement buttons also work on touch screens.

## R1 and R2

Both resistors are **10 kΩ**. Neither resistor has polarity.
Leg A and leg B are labels for this drawing, not markings on the resistor.

1. Connect keypad OUT to R1 leg A.
2. Join R1 leg B, R2 leg A, and the ADC A0 wire together.
3. Connect R2 leg B to ADC GND.
4. Connect ADC GND, keypad GND, and Pi GND to the same ground.

```text
Keypad OUT ---- R1 10 kΩ ----●---------------- ADC A0
                           |
                        R2 10 kΩ
                           |
                          GND
```

The purple point represents the shared join.
The viewer labels each leg separately and highlights the connection for each step.
The four-band resistor example uses brown, black, orange, and gold.

## LCD wire colors

The cable colors come from [photos/colors.jpg](../photos/colors.jpg).

| LCD terminal | Cable color | Physical Pi pin |
|---|---|---:|
| VCC | Purple | 1 |
| GND | White | 6 |
| DIN | Green | 19 |
| CLK | Orange | 23 |
| CS | Yellow | 24 |
| DC | Blue | 22 |
| RST | Brown | 13 |
| BL | Gray | 18 |

The white and gray wires have a dark outline for visibility.
Color changes do not change the pin assignments.

## Modules

| Path | Purpose |
|---|---|
| `src/main.js` | Viewer startup and scene selection |
| `src/data/divider.js` | Resistor connections and assembly steps |
| `src/data/setup.json` | Pi 3 setup, numbered wires, and colors |
| `src/data/picoSetup.js` | Pico pin assignments, power joins, and comparison data |
| `src/data/modules.js` | Plain-language explanations for each hardware module |
| `src/data/amplifier.js` | Photographed header order and separated audio routes |
| `src/scene/amplifier.js` | MAX98357A model and assembly modes |
| `src/scene/controllers.js` | Detailed Pi 3 and Pico models |
| `src/scene/` | Boards, resistors, cables, labels, and rendering |
| `src/controls/` | Camera movement and controls |
| `src/ui/` | Interface and live reload |
| `server.py` | FastAPI static routes and file-change stream |
| `tests/` | Wiring, camera, and server checks |

## Verification

```bash
pnpm test
.venv/bin/python -m unittest discover -s tests -p 'test_*.py' -v
pnpm build
```

Vite produces a production bundle in `dist/`.
The build also creates a self-contained `viewer.html` that works without the development server.

Framework references: [Three.js OrbitControls](https://threejs.org/docs/pages/OrbitControls.html),
[FastAPI streaming responses](https://fastapi.tiangolo.com/advanced/custom-response/),
[Vite build documentation](https://vite.dev/guide/build).
