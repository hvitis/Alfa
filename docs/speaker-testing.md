# Test the speaker with LCD status

This test plays your sound through the MAX98357A and displays playback status on the LCD.
It uses the sound in `sounds/` by default. It does not need the buttons or ADC.
The terminal displays detailed diagnostics when you use `--verbose`.

## 1. Copy the updated code

The new command options need the updated Python files on the Pi.
Run this command on your computer, from the project folder.
Replace `PI_HOST` with the address you use for SSH.

```bash
rsync -av --exclude='.venv' --exclude='.state' --exclude='.git' --exclude='node_modules' --exclude='dist' ./ pi@PI_HOST:~/Code/moomin/
ssh pi@PI_HOST
```

Run the remaining commands in the Pi SSH session.

```bash
cd ~/Code/moomin
```

This folder contains `README.md`, `config.json`, and the `moomin/` Python package.
Your working screen test already uses the required virtual environment.
If `.venv` is missing, run the installer once:

```bash
bash scripts/setup-pi.sh
```

## 2. Finish the amplifier connections

Disconnect Pi power before soldering or changing wires.
Solder all seven header pins on the underside of the amplifier.
Only five pins need external jumper wires.

With the component side up, put the green speaker terminal at the top and the yellow header at the bottom.
**The order confirmed by [max4.jpg](../photos/max4.jpg) is LRC, BCLK, DIN, GAIN, SD, GND, VIN.**

| Amplifier label | Physical Pi pin | Signal |
|---|---:|---|
| LRC | 35 | GPIO19, I2S left/right clock |
| BCLK | 12 | GPIO18, I2S bit clock |
| DIN | 40 | GPIO21, I2S audio data |
| GAIN | None | Leave unwired |
| SD | None | Leave unwired for the board's default mode |
| GND | 9 | Ground |
| VIN | 2 | 5 V |

Connect speaker minus to the green terminal's minus connection.
Connect speaker plus to its plus connection.
The max4 photo shows a teal lead at minus and a yellow lead at plus.
Neither speaker terminal connects to Pi ground.

**Keep LCD BL on physical pin 18, GPIO24.**
The amplifier BCLK uses physical pin 12, GPIO18.
These are different pins despite the repeated number 18.

The [3D viewer](../hardware-visualisation/viewer.html) has an **Amplifier wiring** button.
It shows the corrected pin order, header assembly, seven solder joints, and each cable separately.
The board's printed labels remain the reference when you connect wires.

## 3. Enable audio

Open the boot configuration on the Pi:

```bash
sudo nano /boot/firmware/config.txt
```

Under `[all]`, keep these settings once.
Replace an existing audio setting or MAX98357A overlay line instead of adding duplicates.

```ini
[all]
dtparam=spi=on
dtparam=audio=off
dtoverlay=max98357a,no-sdmode
```

Save with Ctrl+O and Enter. Exit with Ctrl+X.
Restart the Pi:

```bash
sudo reboot
```

Reconnect over SSH. Check the audio card:

```bash
cd ~/Code/moomin
aplay -l
```

The listing must include the MAX98357A sound card.
The card listing confirms the software driver. It does not confirm the physical speaker connection.
The default test selects that card and does not automatically select HDMI.

References: [MAX98357A signal wiring](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/raspberry-pi-wiring),
[amplifier pin modes](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/pinouts),
[Raspberry Pi overlay parameters](https://github.com/raspberrypi/firmware/blob/master/boot/overlays/README).

## 4. Run the speaker and LCD test

First, test the audio path with a known tone at 10% digital volume:

```bash
.venv/bin/python -m moomin speaker-test --with-screen --verbose --tone --repeat 3 --volume 0.1
```

Listen for three two-second tones. Check that the LCD displays playback status.
Then play your supplied sound at the same starting volume:

```bash
.venv/bin/python -m moomin speaker-test --with-screen --verbose --repeat 3 --volume 0.1
```

The test prepares and plays the first sound from `sounds/` three times.
The supplied sound is `SPEAKER_01_0014.wav`.
The prepared clip is stereo, 48 kHz, 16-bit PCM, with short fades.

The LCD displays preparation, playback number, file name, volume, elapsed time, pauses, and the final result.
Its progress bar estimates progress from elapsed time.
The final status stays visible for three seconds. The backlight turns off when the command exits.

The terminal displays:

- The corrected amplifier pin order and Pi connections.
- Tool paths and the selected ALSA device.
- The sound file, duration, sample rate, channels, and sample width.
- The source peak and RMS level, plus the approximate peak after volume control.
- The FFmpeg volume command and `aplay` command.
- Playback progress and the actual `aplay` exit code.
- ALSA PCM details and any errors.
- The saved log and JSON report paths.

An empty, truncated, or fully silent prepared WAV fails before playback.
A playback error returns exit code 1.
Ctrl+C stops playback, releases the hardware, and returns exit code 130.
A completed run returns exit code 0.
You must still confirm that you heard the sound. The program cannot measure the speaker output.

Check the exit code immediately after the test:

```bash
echo $?
```

## 5. Isolate a sound problem

Use the known 440 Hz tone to test the audio path:

```bash
.venv/bin/python -m moomin speaker-test --with-screen --verbose --tone --repeat 3 --volume 0.1
```

The tone is a generated two-second stereo WAV. The original sounds stay unchanged.
If the tone plays but your clip does not, check the source sound and prepared media.

To test the speaker without LCD status:

```bash
.venv/bin/python -m moomin speaker-test --verbose --tone --volume 0.1
```

To select a card explicitly, use its actual identifier from `aplay -l`.
For example:

```bash
.venv/bin/python -m moomin speaker-test --with-screen --verbose --volume 0.1 --device 'plughw:CARD=sndrpimax98357a,DEV=0'
```

| Observation | Next action |
|---|---|
| MAX98357A is absent from `aplay -l` | Check the overlay line, then reboot. |
| Playback finishes but you hear nothing | Check VIN, GND, solder joints, and the speaker terminal clamps. Confirm LRC is first and BCLK is second. |
| Device or resource busy | Stop another program that uses the same audio card. |
| The LCD fails during initialization | Run the speaker test without `--with-screen`. Check the LCD wires and SPI separately. |
| The file is silent or truncated | Try `--tone`. Replace the sound or run `prepare --force`. |
| The sound is too quiet | First confirm the wiring and source signal. Then repeat at `--volume 0.2`. |

## Reports and local verification

Every run saves a timestamped `.log` and `.json` report in `.state/diagnostics/`.
Verbose playback also leaves the raw ALSA log at the path displayed in the terminal.
The JSON report records the file format, device, elapsed times, exit codes, errors, and whether the run uses simulation.
Its `hearing_confirmed` field stays false because there is no microphone or user-confirmation step.

A local simulation generates LCD previews and logs without accessing Pi hardware:

```bash
python3 -m moomin --simulate speaker-test --with-screen --verbose --tone --repeat 2
python3 -m unittest discover -s tests -v
```

The previews are in `.state/preview/`.
Simulation does not prove that the physical speaker produces sound.
