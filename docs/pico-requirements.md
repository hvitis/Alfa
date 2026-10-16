# Pico 2 W findings and future requirements

This document records the Pico research. The current implementation target remains Raspberry Pi 3.
Pico development stopped at the user's request. No Pico firmware, board installation, or flash programming is included.

## Hardware limits

The Pico 2 W uses an RP2350 microcontroller with 520 KB of SRAM and 4 MB of onboard flash.
It runs firmware rather than Raspberry Pi OS.
The current Linux application depends on Pillow, ALSA, `aplay`, `spidev`, `gpiozero`, and `smbus2`.
Those dependencies require replacements on the Pico.
The [Pico 2 W datasheet](https://datasheets.raspberrypi.com/picow/pico-2-w-datasheet.pdf) defines the board, pinout, power inputs, and memory.

The MicroPython board definition currently reserves 2,621,440 bytes (2.5 MiB) for its filesystem.
The remaining flash contains MicroPython and its wireless support.
This value depends on the firmware build and can change.
The future packer must use the installed firmware's actual available storage.
See the [official board definition](https://github.com/micropython/micropython/blob/master/ports/rp2/boards/RPI_PICO2_W/mpconfigboard.cmake).

## Display and media storage

The existing Waveshare ST7789 LCD has 240 × 320 pixels in portrait orientation.
The image transfer uses RGB565, with two bytes per pixel in big-endian wire order.
The card must keep its complete Polish letter and diacritic visible at native resolution.

| Representation | Bytes per 240 × 320 card | Bytes for 32 cards |
| :--- | ---: | ---: |
| RGB888 pixels | 230,400 | 7,372,800 |
| RGB565 pixels | 153,600 | 4,915,200 |
| 8-bit palette indices, before palette/header | 76,800 | 2,457,600 |
| 4-bit palette indices, before palette/header | 38,400 | 1,228,800 |

All 32 raw RGB565 cards exceed the board's total 4 MB flash, before firmware or sound.
The original Pi animation cache held four frames, or 614,400 bytes.
That cache alone exceeds all Pico SRAM.
The optimized Pi version now caches one animation frame. A Pico version still needs a smaller streaming design.

A future packer can use a separate 16-color palette for each card and pack two pixel indices into each byte.
A 32-byte RGB565 palette plus a proposed 12-byte header gives 38,444 bytes per card.
Thirty-two cards then require 1,230,208 bytes, before filesystem overhead.
Eight shared animation frames add approximately 307,552 bytes with the same proposed format.
These are calculated budgets, not measurements from a built Pico package.

Palette reduction changes image quality. Native-size reviews must cover character outlines, letter strokes, dots, acute accents, and ogoneks.
An 8-bit palette gives more colors but leaves little internal storage for audio.
PNG file size does not represent the memory needed after image decoding.

Future requirements:

1. Prepare all images on a computer before deployment.
2. Preserve the original PNG masters in this repository.
3. Deliver exact-size assets in a documented Pico format.
4. Expand palette indices into a reusable buffer of a few display rows.
5. Transfer that buffer over hardware SPI.
6. Avoid a complete framebuffer and caches of multiple full-screen frames.
7. Keep cards in Polish alphabet order and preserve all 32 distinct letters.
8. Measure actual memory, transfer latency, image quality, and free flash on the board.

## Existing Pico wiring proposal

The project already contains a [Pico wiring visualization](../web/hardware-visualisation/src/data/picoSetup.js).
These are Pico GPIO numbers, not Raspberry Pi BCM numbers.

| Module signal | Pico GPIO | Physical pin |
| :--- | :--- | :--- |
| LCD MOSI / DIN | GP19 | 25 |
| LCD SCK / CLK | GP18 | 24 |
| LCD CS | GP17 | 22 |
| LCD DC | GP16 | 21 |
| LCD RESET | GP20 | 26 |
| LCD backlight | GP21 | 27 |
| ADS1x15 SDA | GP4 | 6 |
| ADS1x15 SCL | GP5 | 7 |
| MAX98357A BCLK | GP10 | 14 |
| MAX98357A LRCLK | GP11 | 15 |
| MAX98357A DIN | GP12 | 16 |

The LCD and ADC use the shared 3.3 V output at physical pin 36.
The current proposal supplies the keypad and amplifier from USB VBUS at physical pin 40.
The keypad divider and common ground remain necessary with this wiring.
The ADC model, address, and physical buttons require calibration on the final device.

## Sound requirements

The Pico needs I2S firmware for the MAX98357A.
MicroPython provides `machine.I2S` on RP2 platforms through PIO and DMA.
Its RP2 interface requires the word-select GPIO immediately after the clock GPIO.
The proposed GP10/GP11 pair meets that requirement.
The interface remains a technical preview, so the selected firmware must pass a real playback test.
See the [RP2 reference](https://docs.micropython.org/en/latest/rp2/quickref.html#i2s-bus).

The [MAX98357A datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/max98357a-max98357b.pdf) supports PCM rates from 8 kHz to 96 kHz.
A practical voice format is signed 16-bit mono PCM at 16 kHz, which needs 32,000 bytes per second.
Eight-kilohertz mono PCM needs 16,000 bytes per second, with a loss of high-frequency voice detail.
Sample-rate and channel conversion belong in the computer's preparation pipeline.

The existing recording is approximately 7.18 seconds.
At 16 kHz mono, its PCM data needs approximately 230 KB.
The proposed 4-bit cards, eight shared animation frames, and this recording total approximately 1.77 MB before code and filesystem overhead.
This estimate excludes future per-letter recordings.
The existing recording does not supply 32 letter-specific Polish sounds.

Future requirements:

1. Prepare explicit Polish recordings for each required letter activity.
2. Stream audio through a small reusable buffer.
3. Stop an old clip when the child requests another action.
4. Keep enough buffered audio during display transfers to prevent interruptions.
5. Stop I2S clocks when playback ends.
6. Measure the complete pack against the actual flash budget.
7. Use external storage if the complete recordings exceed that budget.

## Offline startup and continuous operation

A Pico does not require a Linux service or an SSH connection to start the application.
MicroPython executes `main.py` from its local filesystem at power-on.
Files can be installed once over USB, then used without internet access.
See the [MicroPython boot sequence](https://docs.micropython.org/en/latest/reference/reset_boot.html).

The future runtime must start from local assets, display the configured first card, and play the configured startup sound.
It must remain active after playback and accept physical buttons.
It must avoid network initialization, continuous animations while idle, and routine flash writes.
A watchdog must recover from failures. A maintenance path must permit firmware and content updates.
State persistence must tolerate the physical power switch.

## Lowest-resource design options

| Option | Benefit | Additional work |
| :--- | :--- | :--- |
| MicroPython | Fast development and USB updates | Port drivers, build a small media format, and measure the heap |
| C/C++ with Pico SDK | Direct control of memory, PIO, DMA, and power states | Implement firmware, drivers, media handling, and a repeatable build |
| Internal flash | No extra storage module | Keep the complete content pack within the firmware's filesystem budget |
| microSD or external flash | More room for recordings and higher-color images | Add a module, wiring, driver, and power-loss handling |

C/C++ is the recommended production direction when minimum memory and power use take priority.
MicroPython is a practical prototype direction, with a larger interpreter and runtime footprint.
Neither choice has a measured power or battery-life result for this project.

The largest practical power reductions come from backlight control, short animations, idle audio shutdown, and disabled wireless activity.
An optional amplifier shutdown GPIO requires a verified circuit and an available pin.
For deep sleep with button wake-up, direct digital buttons are simpler than the current ADC keypad.
Keeping the ADC keypad requires a tested wake-up source, such as an appropriate ADC alert circuit.
Sleep states must preserve or restore the display and sound hardware correctly.

## Power-switch requirements

An inline switch on the regulated 5 V USB supply powers the Pico and the existing VBUS-powered modules together.
The runtime must start after every cold power-on without a computer.
The project needs repeated cold-start, button, audio, and watchdog tests on the actual assembled device.

Powering only VSYS does not establish a 5 V supply on the USB VBUS pin.
A battery/VSYS design must provide and route the correct supply for the keypad and amplifier separately.
Power inputs, shared grounds, and amplifier supply limits require verification before that wiring change.
The [Pico 2 W datasheet](https://datasheets.raspberrypi.com/picow/pico-2-w-datasheet.pdf) defines the power connections.

## Status

These findings define a possible future port. No Pico firmware or deployable Pico package exists from this work.
The current deliverable is the optimized, supervised Raspberry Pi 3 application.
