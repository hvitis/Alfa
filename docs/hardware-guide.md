# Alfa: Raspberry Pi screen, speaker, and button tests

For offline startup at power-on and automatic recovery, read [the Raspberry Pi standalone guide](raspberry-pi-standalone.md).
On the configured Pi, install the service with `bash scripts/install-service.sh`.
The app keeps running when idle. It does not shut down the Pi after inactivity.
To pull and load the newest changes on the Pi, run:

```bash
cd /home/pi/Code/Alfa
make update
```

This command stops the service, pulls Git updates, updates Python dependencies, compiles display frames, reloads systemd, and restarts the app.
`make reset` performs the same complete update.
Use `make restart` to reinstall and restart the current checkout without pulling.
Use `make run` for a manual test. It stops the service first and restores it when the test ends.
`make logs` follows the service log, and `make help` lists all commands.
The [maintenance guide](raspberry-pi-standalone.md#check-and-maintain-the-service) explains the update steps and recovery behavior.

The [Pico requirements](pico-requirements.md) record future firmware research. The active implementation targets Raspberry Pi 3.

This Python app tests the hardware in your photos over SSH. It runs without a graphical desktop.

- The screen test displays colors, a border, and orientation labels.
- The speaker test plays a short clip from `sounds` through the MAX98357A amplifier.
- The default on-screen player runs alphabet lessons, character animations, and speech.
- The button tools display the ADC voltage and save calibration for each button.

The optional photo player uses six supplied photos prepared in `media/images` as **240 × 320 RGB PNGs**.
The speaker test uses a **5-second, 48 kHz, stereo, 16-bit WAV** in `media/sounds`.
The player prepares the complete recording separately in `media/sounds/full`.
The original files stay in `imgs` and `sounds`.
The original `imgs` folder is excluded from Git.
A Git checkout uses the included `media/images` photos when originals are absent.
Prepared photos must match the configured display size.

The [Polish alphabet artwork](../assets/alphabet/README.md) contains 32 cards with retained illustrations.
The source PNGs are in `assets/alphabet`, and the 240 × 320 LCD PNGs are in `media/alphabet`.
To display the complete cards on the Pi, run:

```bash
python3 -m app gallery --fullscreen --no-audio
```

Use LEFT and RIGHT to change the card.
Press TOP (UP) for the speaking animation and “Powiedz jaka to literka.”
Press BOTTOM (DOWN) for a random praise pair: the clapping character with `brawo_2`, or Hemulen with `brawo_1`.
Each action slides a still first frame in from above or below before starting animation and speech.
The original animations use four frames. Hemulen uses 24 poses at 6 FPS for eight seconds, with a stationary body.
Each animation returns to the selected card after its cycles and speech finish.
LEFT and RIGHT stop the animation and change the letter.
Hold CENTER (the fifth button) to draw the selected letter, stroke by stroke, with a moving pencil.
Release CENTER to pause the pencil. After the final stroke, fireworks run without a held button.
The thicker strokes use the navy color sampled from the selected letter card.
The completed letter stays visible during success fireworks, then the original card returns.
Each of the 32 letters has a prepared recording. Missing selected recordings produce a startup error.
LEFT, RIGHT, UP, and DOWN interrupt the drawing lesson and stop its recording.
Pressing CENTER again resumes a paused trace. After the fireworks finish, CENTER starts a new trace.
Pressing TOP or BOTTOM again during its own animation lets it finish instead of restarting it.
Add `--keyboard` for SSH keyboard control (A/D for letters, W/S for character animations, Space for drawing).
For a preview without hardware, add `--simulate` before `gallery` and `--once` after it.
The [animation assets and previews](../assets/animations/README.md) include PNG frames, RGB565 files, and GIF previews.
The [drawing lesson guide](../assets/letter-drawing/README.md) includes a GIF preview, all letter paths, component details, and recording instructions.

The app starts at **20% digital audio volume** and never goes above the **50% cap** (`audio.max_volume`).
Physical buttons ignore a press that comes within 0.4 s of the previous one (`controls.press_guard_ms`), so mashing counts once.
Sitting on a button counts as one press: a button must be released before it can press again.
It uses **BCM GPIO24** for the backlight, so the display does not share GPIO18 with the amplifier.

## Interactive hardware visualisation

[The plywood case design](../design/wooden-case/README.md) includes an offline 3D planner, four actual-size A4 cutting/drilling templates, component placement, and cable routing for the Pi 3, Baseus 5000 mAh bank and existing five-button board. It uses 6 mm plywood and a removable rear cover.

[Open the 3D viewer](../web/hardware-visualisation/viewer.html) for clickable module explanations, the R1/R2 close-up, and free camera movement.
The **Pi 3 setup** and **Pico 2 WH setup** views show the same modules with different controller connections.
The Pico view marks changed pins in amber and compares all 19 header connections.
It also marks the two shared supply joins and explains the separate Pico firmware requirement.
The modular Three.js viewer and FastAPI server are in [hardware-visualisation](../web/hardware-visualisation/README.md).
The screen cable colors match `photos/colors.jpg`.

For live updates, start the server from that folder:

```bash
cd web/hardware-visualisation
.venv/bin/python server.py
```

Open `http://127.0.0.1:8000`.
The browser refreshes after source changes and keeps its camera position.
Read the visualisation README for first-time installation.

## 1. Copy this folder to the Pi

Run this command on your computer, from this folder.
Replace `PI_USER` and `PI_HOST` with your SSH username and address.

```bash
rsync -av --exclude='.venv' --exclude='.state' --exclude='.git' --exclude='node_modules' --exclude='dist' ./ PI_USER@PI_HOST:~/Alfa/
ssh PI_USER@PI_HOST
```

Run the remaining hardware commands in the SSH session.

```bash
cd ~/Alfa
```

The app supports Raspberry Pi 2 and 3 with Raspberry Pi OS Bookworm or newer.
Use an OS image that supports your Pi model.
No Git repository is required to run the app.

## 2. Install the software

Run the installation script as your normal SSH user.
The script uses `sudo` for OS packages and device groups.

```bash
bash scripts/setup-pi.sh
```

The script installs FFmpeg, ALSA tools, I²C tools, and Python dependencies.
It creates `.venv` with access to the OS `lgpio` package.
It adds your user to the `gpio`, `i2c`, `spi`, and `audio` groups.
It does not change the boot configuration.

## 3. Enable the hardware interfaces

Open the boot configuration.
On Bookworm and newer systems, use:

```bash
sudo nano /boot/firmware/config.txt
```

If that file does not exist, use `/boot/config.txt`.

Add these settings under an `[all]` section.
Replace an existing `dtoverlay=max98357a` line with the line below.
Keep only one MAX98357A overlay line.

```ini
[all]
dtparam=spi=on
dtparam=i2c_arm=on
dtparam=audio=off
dtoverlay=max98357a,no-sdmode
```

The `no-sdmode` setting matches this wiring: the amplifier SD pin uses its breakout pull-up and has no Pi connection.
The driver does not control an extra SD GPIO.

Do not add an `ads1115` or `ads1015` overlay for this app.
The app accesses the ADC directly through I²C.

Restart the Pi.

```bash
sudo reboot
```

Reconnect over SSH.
Activate the virtual environment.

```bash
ssh PI_USER@PI_HOST
cd ~/Alfa
source .venv/bin/activate
```

Repeat the last two commands in each new SSH session.
Run the app as your normal user.

Sources: [Raspberry Pi overlay settings](https://github.com/raspberrypi/firmware/blob/master/boot/overlays/README),
[Adafruit MAX98357A setup](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/raspberry-pi-usage).

If `/dev/i2c-1` is missing, enable I2C and restart:

```bash
sudo raspi-config nonint do_i2c 0
sudo reboot
```

After reconnecting, run `ls -l /dev/i2c-1`.
A missing device file means that the OS interface is unavailable.
The ADC wiring becomes testable after the device file appears.

## 4. Select the ADC and check the setup

The photographed ADC board says `ADS1115/ADS1015`.
The app supports both chips.
The default is `ads1115`, with I²C address `0x48` and input `A0`.

If your chip is an ADS1015, edit `adc.model` in `config.json`.
The following fragment shows the existing section to change:

```json
{
  "adc": {
    "model": "ads1015"
  }
}
```

All commands read the same `config.json`:

```bash
python -m app doctor
```

The snippets show individual settings. Keep all other sections in `config.json`.

Run the setup check.

```bash
python -m app doctor
```

The command checks dependencies, device access, the audio card, and an actual ADC conversion.
It reports missing button calibration as the next step.
A successful setup check does not prove that the screen displays correctly or that the speaker produces sound.

For additional device information, run:

```bash
ls -l /dev/spidev0.0 /dev/i2c-1 /dev/gpiochip*
i2cdetect -y 1
aplay -l
```

The ADC appears at `48` when `ADDR` connects to ground.
The MAX98357A appears in the ALSA card list after the restart.

**CAUTION:** Use the two 10 kΩ divider resistors between keypad OUT and ADC A0.
The ADC uses 3.3 V; keypad OUT can reach 5 V.

[Read the full wiring guide](wiring.md) or [open the clearer 3D diagram](../output/wiring-3d.html).

## 5. Test the screen

Run the color and orientation test.

```bash
python -m app screen-test
```

The screen displays red, green, blue, white, black, and an orientation pattern.
Each pattern stays visible for 1.5 seconds.
The final pattern has a border and TOP/BOTTOM labels.
The backlight turns off when the command ends.

For a slower test, run:

```bash
python -m app screen-test --seconds 4
```

Display the alphabet with keyboard controls before mapping the buttons:

```bash
python -m app gallery --keyboard --no-audio
```

Press `A` or `D` to change the letter.
Press `Q` to stop.

## 6. Test the speaker with your sound

For the speaker test with LCD status and detailed diagnostics, read [Speaker testing instructions](speaker-testing.md).
The guide uses the corrected **LRC-first, BCLK-second** header order from `photos/max4.jpg`.

```bash
.venv/bin/python -m app speaker-test --with-screen --verbose --repeat 3 --volume 0.1
```

The LCD displays playback status. The terminal prints the file format, signal levels, device, commands, progress, and ALSA details.
The test saves logs and JSON reports in `.state/diagnostics/`.
It checks software playback; you must confirm that you hear sound.

For a known 440 Hz tone, add `--tone`:

```bash
.venv/bin/python -m app speaker-test --with-screen --verbose --tone --volume 0.1
```

The speaker-focused test needs the amplifier and speaker, with the LCD optional.
It does not need the ADC or buttons.


Run the speaker test at a low starting volume.

```bash
python -m app speaker-test --volume 0.1
```

The app plays the prepared clip from `SPEAKER_01_0014.wav` once.
It converts mono audio to stereo because the I²S output uses two channels.
The clip has short fades at both ends.

To use the configured 20% volume, run:

```bash
python -m app speaker-test
```

The app selects a card whose ALSA listing contains `max98357`.
It does not use HDMI as an automatic fallback.

If automatic selection fails, read the card identifier from `aplay -l`.
Then specify the device directly.
For example, if the identifier is `sndrpimax98357a`, run:

```bash
python -m app speaker-test --device 'plughw:CARD=sndrpimax98357a,DEV=0' --volume 0.1
```

Save that device in the existing `audio` section of `config.json`:

```json
{
  "audio": {
    "device": "plughw:CARD=sndrpimax98357a,DEV=0",
    "volume": 0.2
  }
}
```

Keep the other audio settings in that section.
Use the actual card identifier from your Pi.

**CAUTION:** Connect the speaker only to amplifier OUT+ and OUT−.
The speaker minus terminal does not connect to ground.

Sources: [Adafruit Pi audio wiring](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/raspberry-pi-wiring),
[MAX98357A output and SD pin](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/pinouts).

## 7. Calibrate and test the buttons

First, display the raw button voltage.

```bash
python -m app buttons --seconds 15
```

Press each button separately.
The voltage must change between the idle state and each button.
The expected divider output is approximately 0–2.5 V.
Before calibration, the displayed button state is `unknown`.

Run the mapping command in an interactive SSH terminal after fitting or rotating the buttons in the case.

```bash
make mapping
```

For each prompt:

1. Release all buttons, or hold the requested button.
2. Press Enter in the SSH terminal.
3. Keep the button state unchanged until the voltage result appears.
4. Release the button before the next prompt.

You choose which physical button performs LEFT, RIGHT, UP, DOWN, and CENTER.
Face the front of the assembled case. The board can be horizontal, vertical, or reversed.
The command stops a running service before calibration and restores it afterward, including after an interrupted calibration.
The tool saves six measured states in `.state/buttons.json`.
It rejects overlapping or unstable readings.

Display the calibrated events.

```bash
python -m app buttons
```

Press each button again.
The console displays its name and one press event.
Hold a button to confirm that it does not repeat.
Press `Ctrl+C` to stop.

If you change the ADC model, address, bus, resistor divider, or keypad, repeat calibration.
Calibration belongs to this assembled circuit.

Source: [Texas Instruments ADS1115 register definitions](https://www.ti.com/lit/ds/symlink/ads1115.pdf).

## 8. Run everything together

After the setup check and button calibration, start the on-screen player:

```bash
python -m app doctor
python -m app calibrate-buttons
python -m app player
```

The player tests the LCD, five buttons, ADC, amplifier, and speaker together.
It displays your current picture, the recording name, playback progress, and volume.
The recording plays in full. The five-second limit applies to the separate speaker test.

| Button | Action |
|---|---|
| LEFT | Previous picture, with wraparound |
| RIGHT | Next picture, with wraparound |
| UP | Increase volume by 5 percentage points |
| DOWN | Decrease volume by 5 percentage points |
| Tap CENTER | Play the recording from the start, or stop playback |
| Hold CENTER for 10 seconds | Exit the player (not in the service; `controls.exit_hold_seconds`, 0 = never) |

Use the isolated lower button for CENTER during calibration.
Release CENTER to play or stop. Release all buttons before the first press after startup.
Volume starts at 20% and stays between 0% and the 50% cap, `audio.max_volume`. Check the loudness at ear distance before raising the cap.
Volume changes apply during playback. Picture navigation also works during playback.
The screen controls are indicators for the physical buttons; the LCD has no touch input.

The app stops audio and turns off the backlight when it exits.
It does not shut down the Pi.
Existing calibration remains valid because the five button names stay the same.

Keyboard controls also work in an interactive SSH terminal:

| Key | Action |
|---|---|
| `A` / left arrow | Previous picture |
| `D` / right arrow | Next picture |
| `W` / up arrow | Increase volume |
| `S` / down arrow | Decrease volume |
| Space | Play or stop |
| `Q` / `Ctrl+C` | Exit |

For a keyboard test without the ADC, run `python -m app player --keyboard`.
For pictures without sound, add `--no-audio`.
The existing `gallery` command is an alias for `player`.

```bash
python -m app --simulate player --once
```

This command saves the player screen to `.state/preview/current.png` without Pi hardware.
Simulation uses the recording duration and displays progress. It produces no sound.

## Add photos or sounds

For the optional photo player, edit the existing `config.json` first.
Set `images.input` to `imgs`, `images.prepared` to `media/images`, and `lesson.letters` to `all`.
Set `animations.enabled` and `letter_drawing.enabled` to `false`.
Then put new photos in `imgs`.
Put new sound files in `sounds`.
Then run:

```bash
python -m app prepare
```

The preparation command accepts JPEG, PNG, WebP, and BMP images.
It accepts WAV, MP3, FLAC, OGG, and M4A audio.
It sorts filenames in numeric order, including `illustration_2` before `illustration_10`.

By default, photos keep their aspect ratio and fit inside the screen with white padding.
Transparent pixels use the same white background.
The app applies EXIF orientation before resize.
The original media files remain unchanged.

Preparation runs automatically when the gallery or speaker test needs updated media.
A content hash prevents repeated conversions when the source files and configuration stay unchanged.
The manifest selects current files, so older generated files do not appear in the gallery.
Use `python -m app prepare --full-audio` to prepare complete recordings before the player starts.

To change rotation, fit, or clip length, edit the existing sections in `config.json`.
For example:

```json
{
  "display": {"rotation": 180},
  "images": {"fit": "contain", "background": "#ffffff"},
  "audio": {"clip_seconds": 5.0, "volume": 0.2}
}
```

Alphabet mode accepts rotation `0` or `180`. The optional photo player also accepts `90` or `270`.
At `90` or `270`, prepared images use a 320 × 240 logical canvas.
The display driver rotates that canvas into the native 240 × 320 panel.
The `cover` fit fills the canvas and crops the image edges.

Use the same configuration for preparation and playback.

```bash
python -m app prepare
python -m app gallery
```

## Preview and test on your computer

Install the image dependency.
Install FFmpeg with your computer's package manager if it is absent.
On macOS, the FFmpeg command is `brew install ffmpeg`.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements/base.txt
python -m app prepare
python -m app --simulate doctor
python -m app --simulate screen-test --seconds 0
python -m app --simulate player --once
python -m app --simulate speaker-test
```

Simulation does not access GPIO, SPI, I²C, or your computer's speaker.
It saves display frames to `.state/preview`.
Open `.state/preview/current.png` to see the latest frame.
Use `--simulate gallery` for keyboard navigation and preview updates.
Button voltage tests and calibration require the real ADC.

Run the automated tests:

```bash
python -m unittest discover -s tests -v
```

The tests cover pixel encoding, display addressing, ADC conversions, button calibration, debounce, media conversion, and gallery navigation.
They use simulated hardware.
Physical display and audio behavior still require the Pi tests above.

## Troubleshooting

| Symptom | Action |
|---|---|
| Device permission error | Restart the Pi after installation. Reconnect over SSH. Run `id` and confirm the device groups. |
| `imgs` is absent after a Git checkout | Use the latest app with included `media/images`, or copy those PNGs into a new `imgs` folder. |
| `/dev/i2c-1` is absent | Run `sudo raspi-config nonint do_i2c 0`, then restart the Pi. |
| `/dev/spidev0.0` is absent | Enable SPI in the boot configuration. Restart the Pi. |
| No ADC at `0x48` | Check 3.3 V, GND, SDA, SCL, ADDR, and solder joints. Match the chip model in the configuration. |
| `UU` appears in `i2cdetect` | Remove the ADC kernel overlay. This app needs direct access to the I²C address. Restart the Pi. |
| Display stays black | Check VCC, GND, BL on physical pin 18, and the SPI connections. Stop other display programs. |
| Screen flickers or shows corrupted pixels | Use shorter wires. Set `display.spi_hz` to `4000000`. |
| Red and blue are reversed | Set `display.bgr` to `true` in the local configuration. Repeat the color test. |
| Screen colors appear inverted | Change `display.invert` and repeat the color test. |
| Picture is upside down | Set `display.rotation` to `180`. |
| No MAX98357A card | Check the boot overlay and restart. Run `aplay -l`. |
| Audio plays but the speaker is silent | Check speaker terminals, amplifier 5 V, I²S pins, and the default SD pull-up. |
| Sound is distorted | Decrease `audio.volume`. Check the Pi power supply and speaker wiring. |
| Buttons trigger the wrong action | Repeat calibration. Hold only the requested button during each measurement. |
| Buttons report `unknown` | Run calibration. Check the divider, shared ground, and stable ADC voltage. |
| Another program uses an interface | Stop that program before this app. Run one gallery instance at a time. |

Add `--debug` before the command for a Python traceback:

```bash
python -m app --debug doctor
```

Playback errors include the ALSA error text.
Audio logs are saved in `.state/audio-*.log`.

## Files

| Path | Purpose |
|---|---|
| `app/` | Python app and hardware drivers |
| `app/player.py` | Button actions and on-screen player state |
| `config.json` | Single configuration for hardware, media, animations, audio, and selected letters |
| `imgs/` / `sounds/` | Original media |
| `media/images/` / `media/sounds/` | Prepared PNGs and WAVs |
| `.state/` | Button calibration, previews, and audio logs; ignored by Git |
| `scripts/setup-pi.sh` | Pi package installation |
| `app/speaker_test.py` | Speaker diagnostics, optional LCD status, and saved reports |
| `tests/` | Tests that do not need Pi hardware |
| [wiring.md](wiring.md) | Full wiring tables and hardware references |
| [output/wiring-3d.html](../output/wiring-3d.html) | Rotatable wiring diagram with isolated cables |

The ST7789 initialization uses the Waveshare 2-inch module settings.
The driver writes RGB565 pixels through `spidev` and uses `gpiozero` with `lgpio` for display controls.
The ADC driver uses single-shot A0 measurements through `smbus2`.
The amplifier uses the Raspberry Pi audio driver and `aplay`.
The player streams short PCM blocks with software volume control.
The [ALSA playback options](https://github.com/alsa-project/alsa-utils/blob/master/aplay/aplay.c) define the format, channels, rate, and buffer duration.

References: [Waveshare LCD documentation](https://www.waveshare.com/wiki/2inch_LCD_Module),
[Waveshare driver download](https://www.waveshare.com/w/upload/8/8d/LCD_Module_RPI_code.zip),
[gpiozero output devices](https://gpiozero.readthedocs.io/en/stable/api_output.html),
[spidev buffer transfers](https://pypi.org/project/spidev/),
[ADS1115 datasheet](https://www.ti.com/lit/ds/symlink/ads1115.pdf),
[ADS1015 datasheet](https://www.ti.com/lit/ds/symlink/ads1015.pdf).
