# Moomin: Raspberry Pi screen, speaker, and button tests

This Python app tests the hardware in your photos over SSH. It runs without a graphical desktop.

- The screen test displays colors, a border, and orientation labels.
- The speaker test plays a short clip from `sounds` through the MAX98357A amplifier.
- The gallery displays the photos from `imgs` and uses the five buttons for navigation.
- The button tools display the ADC voltage and save calibration for each button.

The six supplied photos are prepared in `media/images` as **240 × 320 RGB PNGs**.
The supplied WAV is prepared in `media/sounds` as a **5-second, 48 kHz, stereo, 16-bit WAV**.
The original files stay in `imgs` and `sounds`.

The app starts at **20% digital audio volume**.
It uses **BCM GPIO24** for the backlight, so the display does not share GPIO18 with the amplifier.

## Interactive hardware visualisation

[Open the 3D viewer](hardware-visualisation/viewer.html) for clickable module explanations, the R1/R2 close-up, and free camera movement.
The **Pi 3 setup** and **Pico 2 WH setup** views show the same modules with different controller connections.
The Pico view marks changed pins in amber and compares all 19 header connections.
It also marks the two shared supply joins and explains the separate Pico firmware requirement.
The modular Three.js viewer and FastAPI server are in [hardware-visualisation](hardware-visualisation/README.md).
The screen cable colors match `photos/colors.jpg`.

For live updates, start the server from that folder:

```bash
cd hardware-visualisation
.venv/bin/python server.py
```

Open `http://127.0.0.1:8000`.
The browser refreshes after source changes and keeps its camera position.
Read the visualisation README for first-time installation.

## 1. Copy this folder to the Pi

Run this command on your computer, from this folder.
Replace `PI_USER` and `PI_HOST` with your SSH username and address.

```bash
rsync -av --exclude='.venv' --exclude='.state' --exclude='.git' --exclude='node_modules' --exclude='dist' ./ PI_USER@PI_HOST:~/moomin/
ssh PI_USER@PI_HOST
```

Run the remaining hardware commands in the SSH session.

```bash
cd ~/moomin
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
cd ~/moomin
source .venv/bin/activate
```

Repeat the last two commands in each new SSH session.
Run the app as your normal user.

Sources: [Raspberry Pi overlay settings](https://github.com/raspberrypi/firmware/blob/master/boot/overlays/README),
[Adafruit MAX98357A setup](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/raspberry-pi-usage).

## 4. Select the ADC and check the setup

The photographed ADC board says `ADS1115/ADS1015`.
The app supports both chips.
The default is `ads1115`, with I²C address `0x48` and input `A0`.

If your chip is an ADS1015, create `config.local.json` with:

```json
{
  "adc": {
    "model": "ads1015"
  }
}
```

Use `--config config.local.json` **before** the command name for all subsequent commands:

```bash
python -m moomin --config config.local.json doctor
```

The commands below use the default configuration.
Add the configuration argument if you created a local configuration.

Run the setup check.

```bash
python -m moomin doctor
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

[Read the full wiring guide](docs/wiring.md) or [open the clearer 3D diagram](output/wiring-3d.html).

## 5. Test the screen

Run the color and orientation test.

```bash
python -m moomin screen-test
```

The screen displays red, green, blue, white, black, and an orientation pattern.
Each pattern stays visible for 1.5 seconds.
The final pattern has a border and TOP/BOTTOM labels.
The backlight turns off when the command ends.

For a slower test, run:

```bash
python -m moomin screen-test --seconds 4
```

Display your photos with keyboard controls before calibrating the buttons:

```bash
python -m moomin gallery --keyboard --no-audio
```

Press `A` or `D` to change the photo.
Press `Q` to stop.

## 6. Test the speaker with your sound

For the speaker test with LCD status and detailed diagnostics, read [Speaker testing instructions](docs/speaker-testing.md).
The guide uses the corrected **LRC-first, BCLK-second** header order from `photos/max4.jpg`.

```bash
.venv/bin/python -m moomin speaker-test --with-screen --verbose --repeat 3 --volume 0.1
```

The LCD displays playback status. The terminal prints the file format, signal levels, device, commands, progress, and ALSA details.
The test saves logs and JSON reports in `.state/diagnostics/`.
It checks software playback; you must confirm that you hear sound.

For a known 440 Hz tone, add `--tone`:

```bash
.venv/bin/python -m moomin speaker-test --with-screen --verbose --tone --volume 0.1
```

The speaker-focused test needs the amplifier and speaker, with the LCD optional.
It does not need the ADC or buttons.


Run the speaker test at a low starting volume.

```bash
python -m moomin speaker-test --volume 0.1
```

The app plays the prepared clip from `SPEAKER_01_0014.wav` once.
It converts mono audio to stereo because the I²S output uses two channels.
The clip has short fades at both ends.

To use the configured 20% volume, run:

```bash
python -m moomin speaker-test
```

The app selects a card whose ALSA listing contains `max98357`.
It does not use HDMI as an automatic fallback.

If automatic selection fails, read the card identifier from `aplay -l`.
Then specify the device directly.
For example, if the identifier is `sndrpimax98357a`, run:

```bash
python -m moomin speaker-test --device 'plughw:CARD=sndrpimax98357a,DEV=0' --volume 0.1
```

You can save that device in `config.local.json`:

```json
{
  "audio": {
    "device": "plughw:CARD=sndrpimax98357a,DEV=0",
    "volume": 0.2
  }
}
```

If a local configuration already exists, add the `audio` section to it.
Use the actual card identifier from your Pi.

**CAUTION:** Connect the speaker only to amplifier OUT+ and OUT−.
The speaker minus terminal does not connect to ground.

Sources: [Adafruit Pi audio wiring](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/raspberry-pi-wiring),
[MAX98357A output and SD pin](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/pinouts).

## 7. Calibrate and test the buttons

First, display the raw button voltage.

```bash
python -m moomin buttons --seconds 15
```

Press each button separately.
The voltage must change between the idle state and each button.
The expected divider output is approximately 0–2.5 V.
Before calibration, the displayed button state is `unknown`.

Run calibration in an interactive SSH terminal.

```bash
python -m moomin calibrate-buttons
```

For each prompt:

1. Release all buttons, or hold the requested button.
2. Press Enter in the SSH terminal.
3. Keep the button state unchanged until the voltage result appears.
4. Release the button before the next prompt.

You choose which physical button performs LEFT, RIGHT, UP, DOWN, and CENTER.
The tool saves six measured states in `.state/buttons.json`.
It rejects overlapping or unstable readings.

Display the calibrated events.

```bash
python -m moomin buttons
```

Press each button again.
The console displays its name and one press event.
Hold a button to confirm that it does not repeat.
Press `Ctrl+C` to stop.

If you change the ADC model, address, bus, resistor divider, or keypad, repeat calibration.
Calibration belongs to this assembled circuit.

Source: [Texas Instruments ADS1115 register definitions](https://www.ti.com/lit/ds/symlink/ads1115.pdf).

## 8. Run everything together

Start the photo browser.

```bash
python -m moomin gallery
```

| Button | Action |
|---|---|
| LEFT | Previous photo; wraps to the last photo |
| RIGHT | Next photo; wraps to the first photo |
| UP | First photo |
| DOWN | Last photo |
| Tap CENTER | Play the first sound clip, or stop the current clip |
| Hold CENTER for 2 seconds | Exit the app |

Release CENTER to play the sound.
The app waits for release to distinguish a tap from a hold.
Release all buttons before the first press after startup.

The status bar displays the photo number and playback state.
The app stays responsive during audio playback.
It stops audio and turns off the backlight when it exits.
It does not shut down the Pi.

Keyboard controls also work in an interactive SSH terminal:

| Key | Action |
|---|---|
| `A` / left arrow | Previous photo |
| `D` / right arrow | Next photo |
| `W` | First photo |
| `S` | Last photo |
| Space | Play or stop the sound |
| `Q` / `Ctrl+C` | Exit |

To use the keyboard without the ADC, add `--keyboard`.
To use the gallery without audio, add `--no-audio`.

## Add photos or sounds

Put new photos in `imgs`.
Put new sound files in `sounds`.
Then run:

```bash
python -m moomin prepare
```

The preparation command accepts JPEG, PNG, WebP, and BMP images.
It accepts WAV, MP3, FLAC, OGG, and M4A audio.
It sorts filenames in numeric order, including `moomin_2` before `moomin_10`.

By default, photos keep their aspect ratio and fit inside the screen with white padding.
Transparent pixels use the same white background.
The app applies EXIF orientation before resize.
The original media files remain unchanged.

Preparation runs automatically when the gallery or speaker test needs updated media.
A content hash prevents repeated conversions when the source files and configuration stay unchanged.
The manifest selects current files, so older generated files do not appear in the gallery.

To change rotation, fit, or clip length, create a local configuration.
For example:

```json
{
  "display": {"rotation": 180},
  "images": {"fit": "contain", "background": "#ffffff"},
  "audio": {"clip_seconds": 5.0, "volume": 0.2}
}
```

Rotation accepts `0`, `90`, `180`, or `270`.
At `90` or `270`, prepared images use a 320 × 240 logical canvas.
The display driver rotates that canvas into the native 240 × 320 panel.
The `cover` fit fills the canvas and crops the image edges.

Use the same configuration for preparation and playback.

```bash
python -m moomin --config config.local.json prepare
python -m moomin --config config.local.json gallery
```

## Preview and test on your computer

Install the image dependency.
Install FFmpeg with your computer's package manager if it is absent.
On macOS, the FFmpeg command is `brew install ffmpeg`.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m moomin prepare
python -m moomin --simulate doctor
python -m moomin --simulate screen-test --seconds 0
python -m moomin --simulate gallery --once
python -m moomin --simulate speaker-test
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
python -m moomin --debug doctor
```

Playback errors include the ALSA error text.
Audio logs are saved in `.state/audio-*.log`.

## Files

| Path | Purpose |
|---|---|
| `moomin/` | Python app and hardware drivers |
| `config.json` | Default wiring and media configuration |
| `config.local.json` | Optional local overrides; ignored by Git |
| `imgs/` / `sounds/` | Original media |
| `media/images/` / `media/sounds/` | Prepared PNGs and WAVs |
| `.state/` | Button calibration, previews, and audio logs; ignored by Git |
| `scripts/setup-pi.sh` | Pi package installation |
| `moomin/speaker_test.py` | Speaker diagnostics, optional LCD status, and saved reports |
| `tests/` | Tests that do not need Pi hardware |
| [docs/wiring.md](docs/wiring.md) | Full wiring tables and hardware references |
| [output/wiring-3d.html](output/wiring-3d.html) | Rotatable wiring diagram with isolated cables |

The ST7789 initialization uses the Waveshare 2-inch module settings.
The driver writes RGB565 pixels through `spidev` and uses `gpiozero` with `lgpio` for display controls.
The ADC driver uses single-shot A0 measurements through `smbus2`.
The amplifier uses the Raspberry Pi audio driver and `aplay`.

References: [Waveshare LCD documentation](https://www.waveshare.com/wiki/2inch_LCD_Module),
[Waveshare driver download](https://www.waveshare.com/w/upload/8/8d/LCD_Module_RPI_code.zip),
[gpiozero output devices](https://gpiozero.readthedocs.io/en/stable/api_output.html),
[spidev buffer transfers](https://pypi.org/project/spidev/),
[ADS1115 datasheet](https://www.ti.com/lit/ds/symlink/ads1115.pdf),
[ADS1015 datasheet](https://www.ti.com/lit/ds/symlink/ads1015.pdf).
