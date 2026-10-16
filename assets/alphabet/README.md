# Polish letter cards

This folder contains 32 portrait letter cards, in Polish alphabet order.
Each card has a large uppercase letter and an illustration behind it.
The artwork follows the letter-and-character compositions in the supplied `photos/alphabet_*` references.

[View all 32 finished cards](../../docs/alphabet-contact-sheet.png).
[View the revised B, M, and P cards](../../docs/alphabet-revisions.png).
[View the character swaps: Ć ↔ D, Ą ↔ A, Ż ↔ G, E ↔ Ę](../../docs/alphabet-character-swaps.png).

The source cards are **960 × 1280 RGB PNGs**.
The prepared cards in [media/alphabet](../../media/alphabet) are **240 × 320 RGB PNGs** for the project's ST7789 LCD.
The display driver converts each frame to RGB565 before the SPI transfer.
The complete card appears without player panels when the `--fullscreen` option is active.

The lettering uses clear, bold sans-serif shapes inspired by [Andika](https://software.sil.org/andika/), a font designed for literacy.
The built-in image generator draws the letters. These cards do not contain exact glyphs rendered from an Andika font file.
The foreground letters have strong contrast against the pale ivory background.
The character illustrations use soft ink contours, pastel colors, and a faint mint watercolor background.

## Display on the Pi

From the project directory, run:

```bash
python3 -m app --config config.alphabet.json gallery --fullscreen --no-audio
```

Use LEFT and RIGHT to change the card.
Press TOP (UP) for the listening animation.
Press BOTTOM (DOWN) for the speaking animation.
Each animation plays two four-frame cycles at 5 FPS, then restores the selected card.
LEFT and RIGHT stop the animation and change the letter.
Tap CENTER to draw the selected letter with a moving pencil tip.
The finished letter stays visible during fireworks, then the selected card returns.
LEFT, RIGHT, UP, and DOWN interrupt the drawing lesson and stop its recording.
The [drawing lesson guide](../letter-drawing/README.md) includes all 32 stroke definitions and recording slots.
Hold CENTER for two seconds to exit the current gallery viewer.
The physical buttons require the existing button calibration.
For SSH keyboard control, add `--keyboard` and use A/D for letters, W/S for character animations, or Space for drawing.

## Preview without hardware

Run:

```bash
python3 -m app --config config.alphabet.json --simulate gallery --fullscreen --no-audio --once
```

The preview appears in `.state/preview/current.png`.
For keyboard navigation through all cards, replace `--once` with `--keyboard`.
Simulation saves PNG frames. It does not open a desktop window.

## Prepare another display orientation

The normal configuration uses portrait rotation 0°.
The existing media pipeline also prepares cards for the 320 × 240 landscape frame.
With landscape rotation, `contain` preserves each complete portrait card and adds padding at the sides.
The image is not stretched or cropped.
Use a separate prepared folder in a landscape configuration to retain both exports.

Run preparation with the selected configuration:

```bash
python3 -m app --config config.alphabet.json prepare --images-only
```

The gallery also prepares images automatically before display.
A checkout can use the bundled prepared cards when this source folder is absent.

## Asset inventory

[characters.json](characters.json) records the letter order and file paths.
Illustration numbers identify retained assets. They do not teach a letter through a character name.
[prompts.json](prompts.json) records the card dimensions, paths, and prompts for the eight edited cards.
The built-in image generator edited these eight cards using the original cards as references.
See [the media notice](../../THIRD_PARTY_NOTICES.md) for their distribution status.

## Layout scope

These cards use the complete screen in the current gallery viewer.
The TOP/BOTTOM character animations work in the gallery with `config.alphabet.json`.
The [animation documentation](../animations/README.md) describes playback and file formats.
The CENTER drawing lesson uses lightweight stroke data and optional recordings for each letter.
Activity indicators and a letter dial remain planned.
Their future interface must fit the artwork into its safe area before it adds these controls.
The full-screen cards must not receive overlays that hide letter strokes or diacritics.
