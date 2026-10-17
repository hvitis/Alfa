# Alphabet character animations

In alphabet and standalone mode, TOP (UP) reuses the existing speaking animation.
The character asks “Powiedz jaka to literka.” with offline Piper speech.
BOTTOM (DOWN) randomly selects one of two fixed animation and sound pairs:

| Animation | Prepared sound | Original recording |
| --- | --- | --- |
| Clapping mother character | `media/letter-sounds/praise_2.wav` | `brawo_2.wav` |
| Hemulen inspecting a flower through a magnifying glass | `media/letter-sounds/praise_1.wav` | `brawo_1.wav` |

The root recordings were removed after conversion. Playback uses only the prepared copies.
Each pair has an equal chance. Consecutive presses can select the same pair.

Each character occupies a position above or below the horizontal row of letters.
The screen first slides the character's still first frame in from the button direction.
Animation and speech start after the 0.28-second slide finishes.
The animation runs for at least two cycles and stays visible until its speech ends.
Hemulen uses 24 intermediate head poses at 6 FPS for two cycles, giving eight seconds of playback.
His body, hands, magnifying glass, flower, and background come from one static scene.
Only the head layer turns, tilts, and looks toward the viewer.
The exporter eases pose transitions and rotation around a fixed neck pivot.
The selected letter card returns after playback.
Repeated presses of the same button do not restart an active slide or animation.
LEFT, RIGHT, and CENTER cancel the character and any pending speech.
The animations also work with `--no-audio`.

The original listening and speaking atlases remain available.
The clapping and Hemulen atlases use the same soft ink and watercolor style.
The original atlases contain four poses. Hemulen uses a static scene and a transparent atlas of four head poses.
The exporter renders 24 intermediate Hemulen frames. Every compiled frame is 240 × 320 pixels.
See [the media notice](../../docs/third-party-notices.md).

## Run on the Pi

Run from the project directory:

```bash
python3 -m app gallery --fullscreen --no-audio
```

Add `--keyboard` for SSH keyboard controls:

| Physical button | Keyboard | Action |
| :--- | :--- | :--- |
| LEFT / RIGHT | A / D or left / right arrows | Previous / next letter |
| TOP (UP) | W or up arrow | Slide in the speaking character and ask the question |
| BOTTOM (DOWN) | S or down arrow | Randomly choose a praise pair, then slide it in and play it |
| CENTER | Space | Hold to draw the selected letter |

Run `make mapping` after fitting or rotating the physical buttons in the case.
The guided mapping uses their measured voltages, so horizontal and vertical boards use the same controls.
CENTER never exits alphabet mode. Use Q or Ctrl+C to exit a manual run.
The alphabet configuration uses full-screen cards even without `--fullscreen`.
The standard photo player retains UP/DOWN volume controls when animations are disabled.

## Preview without hardware

Run the interactive simulator:

```bash
python3 -m app --simulate gallery --keyboard --no-audio
```

The simulator saves frames in `.state/preview/current.png`.
It uses no SPI, GPIO, ADC, or audio output.
The `--once` option displays the first letter and exits before keyboard input.

The GIF previews repeat indefinitely for visual review:

- [Listening animation](../../media/animations/listening/preview.gif)
- [Speaking animation, reused for TOP](../../media/animations/speaking/preview.gif)
- [Clapping animation for BOTTOM](../../media/animations/clapping/preview.gif)
- [Hemulen animation for BOTTOM](../../media/animations/hemulen/preview.gif)

## Files and byte order

The built-in `image_gen.imagegen` tool generated the source atlases.
[prompts.json](prompts.json) records the retained atlas paths and playback dimensions.
The compiler splits each atlas in reading order and fits each frame without cropping or stretching.
For listening frames, [layout.json](layout.json) supplies small offsets after resizing to keep her feet anchored.

| Path | Content |
| :--- | :--- |
| `assets/animations/listening-atlas.png` | Listening source atlas, 2 × 2 frames |
| `assets/animations/layout.json` | Listening frame offsets in native LCD pixels |
| `assets/animations/speaking-atlas.png` | Speaking source atlas, reused unchanged for TOP |
| `assets/animations/clapping-atlas.png` | Clapping source atlas for BOTTOM, 2 × 2 frames |
| `assets/animations/hemulen-atlas.png` | Hemulen with a magnifying glass and flower, 2 × 2 frames |
| `assets/animations/hemulen-base.png` | Static scene for the revised Hemulen animation |
| `assets/animations/hemulen-heads.png` | Transparent head poses for the revised Hemulen animation |
| `assets/animations/references/speaking-*.jpg` | Original cartoon stills for mouth reference |
| `media/animations/*/frame-*.png` | RGB PNG frames, 240 × 320; Hemulen has 24 frames |
| `media/animations/*/frame-*.raw` | Little-endian RGB565 pixels |
| `media/animations/*/frame-*.bin` | Byte-swapped RGB565 pixels for the ST7789 SPI transfer |
| `media/animations/manifest.json` | Frame order, dimensions, and pixel formats |

Each `.raw` and `.bin` frame contains exactly 153,600 bytes, with no header.
For a pure red pixel, the `.raw` bytes are `00 f8`, and the SPI `.bin` bytes are `f8 00`.
The ST7789 uses color mode `0x3A = 0x55`.
The driver sends `.bin` bytes directly and performs no PNG decoding or RGB565 encoding for animation transfers.
At 180° rotation, the loader reverses pixel order before playback and preserves the byte order within each pixel.
The animations require portrait rotation 0° or 180°.

The player caches one active wire frame, which contains 153,600 bytes of pixel data.
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
The single `config.json` enables alphabet animations at 4 FPS for two cycles.
Its `animations.clips.hemulen` settings select 6 FPS and two cycles for the longer head animation.
The optional photo player uses the same file with animations and letter drawing disabled.
The supported configuration range is 4–6 FPS and one to four cycles.
