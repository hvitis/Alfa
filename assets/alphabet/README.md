# Polish Moomin letter cards

This folder contains 32 portrait letter cards, in Polish alphabet order.
Each card has a large uppercase letter and a different Moomin character behind it.
The artwork follows the letter-and-character compositions in the supplied `photos/alphabet_*` references.

[View all 32 finished cards](../../docs/alphabet-contact-sheet.png).
[View the revised B, M, and P cards](../../docs/alphabet-revisions.png).

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
python3 -m moomin --config config.alphabet.json gallery --fullscreen --no-audio
```

Use LEFT and RIGHT to change the card.
Press TOP (UP) for Moominmamma listening with her hand at her ear.
Press BOTTOM (DOWN) for Mała Mi speaking.
Each animation plays two four-frame cycles at 5 FPS, then restores the selected card.
LEFT and RIGHT stop the animation and change the letter.
Hold CENTER for two seconds to exit the current gallery viewer.
The physical buttons require the existing button calibration.
For SSH keyboard control, add `--keyboard` and use A/D for letters or W/S for animations.

## Preview without hardware

Run:

```bash
python3 -m moomin --config config.alphabet.json --simulate gallery --fullscreen --no-audio --once
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
python3 -m moomin --config config.alphabet.json prepare --images-only
```

The gallery also prepares images automatically before display.
A checkout can use the bundled prepared cards when this source folder is absent.

## Character assignments

Twenty-one cards match the initial of the Polish character name.
The remaining characters are visual companions. Their names do not represent the displayed letter.
Recordings for these cards must teach the letter independently of the character name.
The set keeps the requested `M — Migotka`, `C — Czarodziej`, and `T — Tata Muminka` assignments.
`Czarodziej` is the requested label for the character also called `Czarnoksiężnik`.

| Letter | Polish character name | Matching initial |
| :--- | :--- | :--- |
| A | Alicja | Yes |
| Ą | Muminek | No |
| B | Bobek | Yes |
| C | Czarodziej | Yes |
| Ć | Mała Mi | No |
| D | Duch | Yes |
| E | Emma | Yes |
| Ę | Mama Muminka | No |
| F | Filifionka | Yes |
| G | Gapsa | Yes |
| H | Hatifnat | Yes |
| I | Inspektor | Yes |
| J | Jok | Yes |
| K | Koń Primadonny | Yes |
| L | Latarnik | Yes |
| Ł | Topik | No |
| M | Migotka | Yes |
| N | Nini | Yes |
| Ń | Topcia | No |
| O | Olbrzym Edward | Yes |
| Ó | Mimbla | No |
| P | Paszczak | Yes |
| R | Ryjek | Yes |
| S | Smok | Yes |
| Ś | Too-tiki | No |
| T | Tata Muminka | Yes |
| U | Piżmowiec | No |
| W | Włóczykij | Yes |
| Y | Ynk | Yes |
| Z | Buka | No |
| Ź | Przodek | No |
| Ż | Migotek | No |

[characters.json](characters.json) records the names, file paths, and initial matches.
[prompts.json](prompts.json) records the final prompt for each card and the use of the built-in image generator.
The [official Polish character guide](https://moomin.pl/blogs/news/poznaj-postacie-z-muminkow) supplies most Polish names and descriptions.
The [official Japanese character guide](https://www.moomin.co.jp/moomins/characters) includes additional characters.
The [Polish dubbing credits](https://dubbingpedia.pl/wiki/Muminki) record animated-series names such as Alicja, Jok, and Ynk.

## Layout scope

These cards use the complete screen in the current gallery viewer.
The TOP/BOTTOM character animations work in the gallery with `config.alphabet.json`.
The [animation documentation](../animations/README.md) describes playback and file formats.
Activity indicators, a letter dial, and recordings for each letter remain planned.
Their future interface must fit the artwork into its safe area before it adds these controls.
The full-screen cards must not receive overlays that hide letter strokes or diacritics.
