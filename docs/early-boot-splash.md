# Firmware LCD splash on Raspberry Pi 3

Alfa can prepare a splash program that Raspberry Pi firmware runs before Linux starts.
It uses the existing loading illustration and the display settings from [`config.json`](../config.json).
The target is a complete image within 3–4 seconds of applying power.
That time still needs measurement on the assembled Pi.

Raspberry Pi announced the feature on 4 September 2026 and demonstrated an ST7789 display.
The [official announcement](https://www.raspberrypi.com/news/configure-early-boot-splash-screens-for-spi-and-i2c-based-displays/) describes firmware beta access and startup within a few seconds.
The scripts below target Alfa's Raspberry Pi 3 with SPI0 CE0 and its 240 × 320 ST7789.
They do not update firmware or reboot the Pi automatically.

## Install on the Pi

1. Copy or sync the updated Alfa checkout to the Pi.
   Run the following commands from its root directory as your normal Pi user.
   The normal [Pi setup](installation.md#raspberry-pi) must already be complete, including `.venv` and enabled SPI.

2. Enable firmware that supports `splash_screen`.
   Raspberry Pi's published procedure uses:

   ```bash
   sudo raspi-config
   ```

   Select **Advanced Settings / Advanced Options → Beta Access**.
   Then update and reboot:

   ```bash
   sudo apt update
   sudo apt full-upgrade
   sudo reboot
   ```

   This updates system packages as well as firmware.
   Use Raspberry Pi's current OS image and firmware guidance if your installation has no Beta Access option.
   Alfa's installer cannot prove feature support from a firmware version string.

3. Reconnect, return to the Alfa directory, and refresh the existing Linux splash and app service:

   ```bash
   make restart
   ```

4. Prepare, inspect, and install the firmware splash:

   ```bash
   make firmware-splash
   make firmware-splash-install FIRMWARE_ARGS=--dry-run
   make firmware-splash-install
   make firmware-splash-status
   sudo reboot
   ```

   The preview is `.state/firmware-splash/preview.png`.
   Installation prepares the bundle again as your normal user, then uses `sudo` only for boot-file changes.
   The dry run prepares local files and prints the proposed boot configuration without changing the boot partition.
   No separate assembler download is needed on the Pi.

## What installation changes

The installer copies the compiled program to `/boot/firmware/alfa-splash.bin`.
It appends a marked block to `/boot/firmware/config.txt` under `[all]`:

```ini
# BEGIN ALFA FIRMWARE SPLASH
[all]
gpio=27=op,dh
gpio=24=op,dh
splash_screen=alfa-splash.bin
# END ALFA FIRMWARE SPLASH
```

These pins come from the current configuration. GPIO 27 releases reset; GPIO 24 enables the backlight.
The program uses software reset, the shared ST7789 initialization sequence, and four 80-row pixel transfers.
It preserves rotation, color order, inversion, and SPI speed.
With the current 10 MHz setting, pixel transfer alone needs about 0.123 seconds.
The program also includes 0.31 seconds of explicit panel delays.
These calculations exclude firmware startup and interpreter overhead.

Before each change, the installer saves the current configuration and any previous program in:

```text
/boot/firmware/alfa-splash-backup-<UTC timestamp>/
```

It validates bundle checksums and the current configuration before writing boot files.
It rejects competing `splash_screen` settings, including settings in included files.
It uses atomic file replacement and restores previous contents if an installation operation fails.
Existing boot settings remain in place.

The Pi boot configuration is a system file. Alfa still reads one application configuration: `config.json`.
Generated files and their checksum inventory stay under `.state/firmware-splash/`.
After changing the illustration or display configuration, run `make firmware-splash-install` again.
`make restart` alone does not replace the firmware program.

## Check a cold boot

Keep `alfa-splash.service` enabled as the Linux fallback.
Firmware draws the first image, Linux redraws it, and the app then shows the alphabet.
The Linux driver resets the panel during takeover, so a brief blackout can occur.
The early backlight level can also reveal a blank frame before firmware finishes drawing.
GPIO ordering, panel behavior, and image persistence require a test on the actual hardware.

Run these diagnostic commands after boot:

```bash
make firmware-splash-status
vcgencmd version
systemd-analyze time
journalctl -b -u alfa-splash.service -u alfa.service -o short-monotonic --no-pager
```

The Linux splash log measures time since kernel startup. It does not measure firmware drawing or time since power-on.
To check the 3–4 second target, shut down, disconnect power, and film the LCD while applying power again.
Repeat across several cold boots. Record the first complete image and any blackout before the alphabet appears.
If only the later Linux splash appears, check firmware support first, then the configured wiring and GPIO levels.

## Remove or recover

To return to the Linux splash:

```bash
make firmware-splash-remove
sudo reboot
```

Removal backs up the current boot files, removes the marked block, and deletes `alfa-splash.bin`.
It preserves unrelated edits, including settings added after installation.
To inspect removal without changing boot files, add `FIRMWARE_ARGS=--dry-run`.

If the Pi cannot boot, insert its SD card into another computer.
On the boot partition, remove the block between the Alfa markers from `config.txt`.
Alternatively, restore `config.txt` from the backup saved before installation.
The firmware package upgrade is separate; removing the splash does not downgrade firmware.

## Format and local validation

[`app/firmware_splash.py`](../app/firmware_splash.py) emits the upstream `SPLASH ASM` version 1 format.
Its equivalent assembler source is `.state/firmware-splash/alfa-splash.splash`.
The binary was checked byte for byte against Raspberry Pi's official assembler at commit
[`b57c48e97f7f43d95d86334798650cfda1ebc8a1`](https://github.com/raspberrypi/utils/tree/b57c48e97f7f43d95d86334798650cfda1ebc8a1/splashasm).
The upstream assembler requires Python 3.12; Alfa's generator uses the existing app environment.
The source leaves SPI polarity parameters at their defaults to preserve format version 1.

Tests decode the program independently, reconstruct the frame, and check rotations and color settings.
They also exercise boot edits, repeat installation, backup, removal, conflict detection, checksums, and failure recovery.
These checks do not replace physical cold-boot validation.

References: [upstream format and usage](https://github.com/raspberrypi/utils/tree/master/splashasm),
[firmware GPIO settings](https://www.raspberrypi.com/documentation/computers/config_txt.html#gpio).
