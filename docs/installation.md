# Installation

Run the commands from the repository root unless a step names another directory.
All application settings are in [`config.json`](../config.json).
Read [configuration.md](configuration.md) for hardware settings and letter selection.

## Dependency files

| File | Use |
| --- | --- |
| `requirements/base.txt` | Python app and hardware-free preview |
| `requirements/dev.txt` | App, repository checks, and Python tests |
| `requirements/pi.txt` | App and Raspberry Pi hardware libraries |
| `requirements/viewer.txt` | Optional FastAPI hardware viewer and its tests |

The development and Pi files include `base.txt` from the same directory.
Node dependencies remain in `package.json` and `package-lock.json`.

## Local preview

Use Python 3.12 or newer.
Install FFmpeg for audio conversion and audio integration tests.
On macOS, run `brew install ffmpeg`. On Debian or Ubuntu, run `sudo apt-get install ffmpeg`.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements/base.txt
python -m app --simulate player --prepared-only --once --no-audio
```

The preview appears in `.state/preview/current.png`.
Simulation does not access Pi hardware or produce audio.

## Local development

Use Node.js 22, npm, Make, and Git in addition to the local preview prerequisites.

```bash
make install
make check
make serve
```

`make install` installs `requirements/dev.txt`, npm dependencies, and Chromium.
On Linux, install Chromium system dependencies with `npx playwright install --with-deps chromium`.
Read [build-guide.md](build-guide.md) for packaging and browser checks.

## Raspberry Pi

Use Raspberry Pi OS Bookworm or newer.
Run the setup script as the normal hardware user:

```bash
bash scripts/setup-pi.sh
```

The script installs FFmpeg, ALSA tools, I²C tools, fonts, and Python system packages, including `python3-lgpio`.
It creates `.venv` with `--system-site-packages` and installs `requirements/pi.txt`.
It also adds the current user to the `gpio`, `i2c`, `spi`, and `audio` groups.

Enable SPI and I²C in `sudo raspi-config`.
Configure the amplifier overlay and wiring as described in [hardware-guide.md](hardware-guide.md).
Restart the Pi and reconnect so the interfaces and group changes take effect.
Edit the existing `config.json` for the installed ADC and audio device.

```bash
.venv/bin/python -m app doctor
make mapping
bash scripts/install-service.sh
```

`make mapping` assigns the fitted buttons and restores a previously running service.
The installer prepares display transfers and the splash, validates startup, and installs the service units.
Both units read `config.json` from the project directory.

For later updates, run `make update`.
It installs dependencies from `requirements/pi.txt` before reinstalling the service.
For local code or configuration changes, run `make restart`.

For a loading image before Linux starts on Pi 3, follow the [firmware splash installation](early-boot-splash.md).
After enabling compatible Pi firmware, `make firmware-splash-install` prepares the image, backs up boot files, and enables the splash.
Use `make firmware-splash-status` to inspect it, or `make firmware-splash-remove` to remove it.

## Optional hardware viewer

From the repository root, install the separate viewer dependencies:

```bash
.venv/bin/python -m pip install -r requirements/viewer.txt
```

Read [the viewer guide](../web/hardware-visualisation/README.md) for its frontend setup and server commands.
