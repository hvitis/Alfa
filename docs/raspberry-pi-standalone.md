# Raspberry Pi 3: offline startup and recovery

The standalone service displays the alphabet at power-on.
It accepts physical button input and stays running when idle.
It starts without a graphical desktop, login, SSH session, or internet connection.
The [Pico findings](pico-requirements.md) describe a separate future firmware project.

## Install on the Pi

Copy the current project files to the Pi first. New local files do not reach the Pi through a Git pull alone.
From the computer's project directory, run:

```bash
rsync -av --exclude='.venv' --exclude='.state' --exclude='.git' --exclude='node_modules' --exclude='dist' ./ pi@PI_HOST:~/Code/moomin/
```

Replace `PI_HOST` with the Pi's SSH address.
The `.state` exclusion preserves the Pi's existing button calibration.

On the Pi, run:

```bash
cd ~/Code/moomin
bash scripts/install-service.sh
```

The installer uses `.venv/bin/python` when available, or the installed `python3`.
It requires the existing Pi dependencies, SPI/I2C/audio setup, and button calibration.
It does not download dependencies or change the wiring.
It compiles the deployed cards into RGB565 frames and does a simulated startup check.
It validates the generated unit with `systemd-analyze verify` before installation, then enables `moomin.service`.
It also starts the service immediately.
After this update, reinstall the service to replace its old shutdown hook.

If the buttons need calibration, run:

```bash
.venv/bin/python -m moomin --config config.standalone.json calibrate-buttons
```

For display-only operation without the amplifier, run the installer with `--no-audio`.
For another hardware user, add `--user USERNAME`.
To inspect the generated service without installation, use:

```bash
bash scripts/install-service.sh --dry-run --user pi
```

## Startup and recovery

The service starts through `multi-user.target`.
It has no dependency on network availability or a desktop session.
It uses the same physical buttons and hardware drivers as the existing app.
The configured non-root user needs the existing `gpio`, `i2c`, `spi`, and `audio` access.

The application sends readiness after it initializes the display and buttons.
It sends watchdog notifications through a local Unix socket, normally every five seconds.
If the loop stalls for 30 seconds, systemd terminates it.
The service restarts five seconds after an unexpected exit or failure.
Explicit `systemctl stop` stops the service for maintenance.
These behaviors use [systemd service supervision](https://github.com/systemd/systemd/blob/main/man/systemd.service.xml).

In standalone mode, holding CENTER and pressing Q do not exit the app.
A CENTER press immediately draws the selected letter and plays its optional recording.
The finished letter stays visible during fireworks, then the original card returns.
LEFT/RIGHT change the letter. UP/DOWN start the listening and repeating animations.
These four controls also interrupt the drawing lesson and stop its recording.
The [drawing lesson guide](../assets/letter-drawing/README.md) lists all 32 recording slots and explains the component architecture.
Alphabet mode waits for button input at startup, including when the service supplies `--autoplay`.

## Resource improvements

| Change | Result |
| :--- | :--- |
| `--prepared-only` | Startup skips source-image hashing, resizing, and ffmpeg conversion |
| Precompiled static cards | Hardware display transfers use native RGB565 bytes |
| One cached static card | The app retains one 153,600-byte native card instead of loading all cards |
| One cached animation frame | The raw animation cache decreases from 614,400 to 153,600 bytes |
| Full-screen render key | Audio progress does not cause repeated transfers of an unchanged card |
| Four animation frames per second | The standalone preset reduces transfers from the normal five-per-second preset |
| Drawing with vector paths | The complete stroke catalog occupies less than 8 KB |
| Partial display transfers during drawing | Each lesson sends changed pixels with a target of 20 frames per second |
| A 40 ms interval between polls | Idle input processing wakes less often than the normal 10 ms interval |
| Temporary audio logs in `/run/moomin` | The service avoids routine audio-log writes to the SD card |

The frame-cache measurements describe payload bytes, not total process RAM.
ADC conversion and display transfer time also contribute to the loop duration.
The program skips late animation frames instead of creating a growing queue.
The LCD retains its current picture while idle, so the program does not continuously refresh a static card.
The complete app's CPU use, RAM use, and startup time still need measurement on the Pi.

Button calibration stays in the project's persistent `.state/buttons.json`.
Temporary service files go to `/run/moomin` and disappear at reboot.
The service disables Python bytecode writes and limits repetitive journal messages.
Its socket restriction permits local Unix sockets and prevents IP socket creation by the app.
The Pi can still retain SSH access through its separate system services.

## Check and maintain the service

Run:

```bash
systemctl status moomin.service
journalctl -u moomin.service -n 50 --no-pager
systemctl show moomin.service -p NRestarts -p MemoryCurrent -p CPUUsageNSec
```

For maintenance, run:

```bash
sudo systemctl stop moomin.service
```

After updates, run:

```bash
.venv/bin/python -m moomin --config config.standalone.json prepare --wire-only
sudo systemctl restart moomin.service
```

If original media changed, run normal preparation before compilation:

```bash
.venv/bin/python -m moomin --config config.standalone.json prepare --full-audio
.venv/bin/python -m moomin --config config.standalone.json prepare --wire-only
```

For configuration changes, edit `config.standalone.json` and restart the service.
That file overrides `config.json`. The service does not also read `config.local.json`.
Add an `audio` section there if the amplifier needs an explicit ALSA device or a different volume.

## Idle operation

The player and gallery stay running without input.
The app has no inactivity shutdown timer or operating-system power-off request.
Old `power` sections in override files are ignored.
The updated service has no shutdown hook.
The LCD keeps the selected letter card visible until another action starts.

After copying the updated files, reinstall the service on the Pi:

```bash
cd ~/Code/moomin
bash scripts/install-service.sh
```

The installer replaces the service unit and restarts the app.
The drawing guide includes [CENTER button diagnostics](../assets/letter-drawing/README.md#if-center-does-nothing).

## Power-switch operation

Raspberry Pi OS still uses an SD-card filesystem.
For routine power cuts, configure a read-only overlay filesystem after dependencies, media, service installation, and calibration are complete.
This keeps normal operating-system writes in RAM rather than on the card.
The [Raspberry Pi configuration guide](https://www.raspberrypi.com/documentation/computers/configuration.html) describes the overlay filesystem option.
Updates and persistent calibration changes require a writable maintenance session.

Raspberry Pi OS Lite removes the desktop's resource use.
Disabling unused Wi-Fi and Bluetooth can reduce background activity after maintenance access is arranged.
The installer leaves these system-wide settings under the owner's control.
A Pi with an ordinary writable filesystem still needs a normal shutdown before power removal.

## Verification scope

The repository tests cover prepared-only startup, native frame content, rotation, stale-frame handling, reduced caches, autoplay, and standalone exit behavior.
They also cover local watchdog notifications and service-unit generation.
Regression tests cover idle intervals longer than five minutes and a day, audio completion, manual exit, and resource cleanup.
They verify that the player does not request system shutdown and that the service unit has no shutdown hook.
Physical-button tests cover a held CENTER press and the next press through the real debouncer.
The service still requires installation, a cold-boot check, and hardware measurements on the actual Pi.
No service installation occurs on the development computer.
