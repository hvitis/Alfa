# Raspberry Pi 3: offline startup and recovery

The standalone service displays the alphabet at power-on.
It accepts physical button input and stays running when idle.
It starts without a graphical desktop, login, SSH session, or internet connection.
The [Pico findings](pico-requirements.md) describe a separate future firmware project.

## Existing installations

Before installing Alfa, stop and disable any previous player and splash service units on the Pi.
The Alfa units use `alfa.service` and `alfa-splash.service`.
The application package is `app`; runtime configuration uses `ALFA_RUNTIME_DIR`.
Install from the `Alfa` project directory after the previous services release the GPIO pins.



## Install on the Pi

Copy the current project files to the Pi first. New local files do not reach the Pi through a Git pull alone.
From the computer's project directory, run:

```bash
rsync -av --exclude='.venv' --exclude='.state' --exclude='.git' --exclude='node_modules' --exclude='dist' ./ pi@PI_HOST:~/Code/Alfa/
```

Replace `PI_HOST` with the Pi's SSH address.
The `.state` exclusion preserves the Pi's existing button calibration.

On the Pi, run:

```bash
cd ~/Code/Alfa
bash scripts/install-service.sh
```

The installer uses `.venv/bin/python` when available, or the installed `python3`.
It requires the existing Pi dependencies, SPI/I2C/audio setup, and button calibration.
It does not download dependencies or change the wiring.
It compiles the deployed cards into RGB565 frames and does a simulated startup check.
It also prepares a retained illustration with the text “Starting…” for the early boot splash.
It validates both service units with `systemd-analyze verify` before installation.
It enables `alfa-splash.service` and `alfa.service`.
It also starts the service immediately.
After this update, reinstall the service to replace its old shutdown hook.

If the buttons need calibration, run:

```bash
.venv/bin/python -m app --config config.standalone.json calibrate-buttons
```

For display-only operation without the amplifier, run the installer with `--no-audio`.
For another hardware user, add `--user USERNAME`.
To inspect the generated service without installation, use:

```bash
bash scripts/install-service.sh --dry-run --user pi
```

## Startup and recovery

### Early boot splash

The splash starts during early Linux initialization, before the normal app and without a wait for sound or cloud-init.
It waits for access to SPI and GPIO, then sends one prepared frame to the LCD.
The splash keeps the backlight on while the main app loads.
The main app requests the display immediately before it claims the GPIOs.
The splash releases SPI and GPIO before it acknowledges the request.
The LCD can briefly go dark while the main app resets the display.

The splash uses `DefaultDependencies=no` to avoid the normal wait for `sysinit.target` and `basic.target`.
It requires only its filesystem mounts and display access.
It has no dependency on audio, button calibration, a desktop, or the network.
The splash stops after the display handoff and does not restart during app recovery.
An inactive splash service after startup is normal.
A splash failure does not prevent the main app from starting.

The firmware and kernel still run before the splash can appear.
The first image time requires a cold-boot measurement on the Pi.
The splash log records when the image becomes visible, in seconds since kernel startup.

After copying the updated files to the Pi, install both services:

```bash
cd ~/Code/Alfa
make restart
sudo reboot
```

After reconnecting, read both service logs:

```bash
journalctl -b -u alfa-splash.service -u alfa.service -o short-monotonic --no-pager
```

To prepare a PNG preview without hardware, run:

```bash
python3 -m app.splash --prepare
```

The preview is `.state/boot-splash.png`.
The installer prepares the matching RGB565 frame in `.state/boot-splash.bin`.
Reinstall the services after a display rotation change to rebuild the frame.

### Main app

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
| Temporary audio logs in `/run/alfa` | The service avoids routine audio-log writes to the SD card |

The frame-cache measurements describe payload bytes, not total process RAM.
ADC conversion and display transfer time also contribute to the loop duration.
The program skips late animation frames instead of creating a growing queue.
The LCD retains its current picture while idle, so the program does not continuously refresh a static card.
The complete app's CPU use, RAM use, and startup time still need measurement on the Pi.

Button calibration stays in the project's persistent `.state/buttons.json`.
Temporary service files go to `/run/alfa` and disappear at reboot.
The service disables Python bytecode writes and limits repetitive journal messages.
Its socket restriction permits local Unix sockets and prevents IP socket creation by the app.
The Pi can still retain SSH access through its separate system services.

## Check and maintain the service

To pull and load the newest committed code, run as your normal Pi user:

```bash
cd /home/pi/Code/Alfa
make update
```

The Makefile calls [update-app.sh](../scripts/update-app.sh).
The script performs these steps in order:

1. Stop `alfa.service` to release the display pins.
2. Pull the current branch with `git pull --ff-only`.
3. Update Python dependencies in the existing virtual environment.
4. Reset the service failure state.
5. Compile display frames and validate the service unit with the installer.
6. Reload systemd, enable the service, and restart the app.
7. Verify that the service is active and print the loaded Git revision.

If an update fails, the script tries to restart a service that was running before the update.
It reports the failure and preserves local code edits, configuration, recordings, and button calibration.
It does not discard local edits or roll back a completed Git pull.

| Command | Action |
|---|---|
| `make update` or `make reset` | Pull and perform the complete update |
| `make restart` | Reinstall and restart the current checkout without a pull or dependency download |
| `make stop` | Stop the service and release its GPIO pins |
| `make start` | Reset the failure state and start the service |
| `make status` | Show service status |
| `make logs` | Follow recent service logs |
| `make run` | Stop the service, run the alphabet manually, then restore the service |
| `make preview` | Regenerate the lesson GIF and completed-letter contact sheet |
| `make test` | Run the hardware-free tests |

To update a silent service, run:

```bash
make update INSTALL_ARGS=--no-audio
```

To use another service user, run:

```bash
make update INSTALL_ARGS='--user pi'
```

After copying files without Git, run `make restart`.
The first installation still requires [setup-pi.sh](../scripts/setup-pi.sh), hardware configuration, and button calibration.
Git updates need a connection. Restarting a local checkout works offline.

The manual test uses both physical buttons and keyboard input.
Press Q or Ctrl+C to finish the test.
If the service was running, the script starts it again after the test, including after a test failure.

For configuration changes, edit `config.standalone.json` and run `make restart`.
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
cd ~/Code/Alfa
make restart
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
