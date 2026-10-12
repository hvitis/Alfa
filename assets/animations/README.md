# Alphabet character animations

TOP (UP) shows Moominmamma listening as she raises her hand to her ear.
Her feet stay at one screen position while her arm, head, and upper body move.
The exporter aligns each pose to the same toe position and sole baseline.
BOTTOM (DOWN) shows Mała Mi (Little My) speaking with four different mouth shapes.
The artwork matches the soft ink and watercolor style of the alphabet cards.

Mała Mi's mouth follows stills from the original 1990 cartoon.
The loop uses a closed asymmetric smile, an open wedge, a small oval, and a narrow opening.
The mouth uses a fine dark contour and a pink interior, with no separate lip outline.
The reference stills appear in a [Polish article](https://kobieta.gazeta.pl/kobieta/7,107881,29627694,podkladala-glos-malej-mi-w-muminkach-ze-slyszenia-znalo-ja.html)
and a [review of the Christmas episode](https://www.millionmonkeytheater.com/22Shit7.html).
The generated loop approximates these mouth shapes; it does not trace a sequence from the cartoon.

Each animation contains four portrait frames at 240 × 320 pixels.
The player uses 5 FPS, so one cycle takes 0.8 seconds.
Each press starts two cycles and then restores the selected letter card.
A new TOP or BOTTOM press restarts the requested animation.
LEFT and RIGHT stop the animation and change the letter, with wraparound at the alphabet ends.
These animations work with `--no-audio`.
The animation assets contain no voice recordings.

## Run on the Pi

Run from the project directory:

```bash
python3 -m moomin --config config.alphabet.json gallery --fullscreen --no-audio
```

Add `--keyboard` for SSH keyboard controls:

| Physical button | Keyboard | Action |
| :--- | :--- | :--- |
| LEFT / RIGHT | A / D or left / right arrows | Previous / next letter |
| TOP (UP) | W or up arrow | Moominmamma listens |
| BOTTOM (DOWN) | S or down arrow | Mała Mi speaks |
| Hold CENTER for two seconds | Q or Ctrl+C | Exit |

Use the existing button calibration for the physical buttons.
The alphabet configuration uses full-screen cards even without `--fullscreen`.
The standard photo player retains UP/DOWN volume controls when animations are disabled.

## Preview without hardware

Run the interactive simulator:

```bash
python3 -m moomin --config config.alphabet.json --simulate gallery --keyboard --no-audio
```

The simulator saves frames in `.state/preview/current.png`.
It uses no SPI, GPIO, ADC, or audio output.
The `--once` option displays the first letter and exits before keyboard input.

The GIF previews repeat indefinitely for visual review:

- [Moominmamma listening](../../media/animations/listening/preview.gif)
- [Mała Mi speaking](../../media/animations/speaking/preview.gif)

## Files and byte order

The built-in `image_gen.imagegen` tool generated both source atlases.
[prompts.json](prompts.json) contains the complete prompts and character references.
The compiler splits each atlas in reading order and fits each frame without cropping or stretching.
For listening frames, [layout.json](layout.json) supplies small offsets after resizing to keep her feet anchored.

| Path | Content |
| :--- | :--- |
| `assets/animations/listening-atlas.png` | Moominmamma source atlas, 2 × 2 frames |
| `assets/animations/layout.json` | Listening frame offsets in native LCD pixels |
| `assets/animations/speaking-atlas.png` | Mała Mi source atlas, 2 × 2 frames |
| `assets/animations/references/little-my-anime-*.jpg` | Original cartoon stills for mouth reference |
| `media/animations/*/frame-00.png` through `frame-03.png` | 24-bit RGB PNG frames, 240 × 320 |
| `media/animations/*/frame-00.raw` through `frame-03.raw` | Little-endian RGB565 pixels |
| `media/animations/*/frame-00.bin` through `frame-03.bin` | Byte-swapped RGB565 pixels for the ST7789 SPI transfer |
| `media/animations/manifest.json` | Frame order, dimensions, and pixel formats |

Each `.raw` and `.bin` frame contains exactly 153,600 bytes, with no header.
For a pure red pixel, the `.raw` bytes are `00 f8`, and the SPI `.bin` bytes are `f8 00`.
The ST7789 uses color mode `0x3A = 0x55`.
The driver sends `.bin` bytes directly and performs no PNG decoding or RGB565 encoding for animation transfers.
At 180° rotation, the loader reverses pixel order before playback and preserves the byte order within each pixel.
The animations require portrait rotation 0° or 180°.

The player caches only the active clip, which contains 614,400 bytes of pixel data.
The frame limit includes SPI transfer time.
If a transfer exceeds the frame interval, the player skips late animation frames instead of queuing them.
Physical timing and colors still need inspection on the Pi and LCD.

## Rebuild the exports

Run from the project directory:

```bash
python3 scripts/prepare-animations.py
```

The compiler rebuilds PNG, `.raw`, `.bin`, and GIF files from the saved atlases.
It needs Pillow and does not call the image generation service.

The `animations` section in `config.json` controls the media directory, frame rate, and cycle count.
The default photo player disables animations.
`config.alphabet.json` enables them at 5 FPS for two cycles.
The supported configuration range is 4–6 FPS and one to four cycles.
