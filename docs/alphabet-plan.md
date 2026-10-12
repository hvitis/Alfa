# Alphabet App Plan

This document describes the broader planned alphabet interface.
The gallery already displays letter cards and plays TOP/BOTTOM character animations with `config.alphabet.json`.
The activity indicators, letter dial, recordings for each letter, and parent menu remain planned.
The [animation documentation](../assets/animations/README.md) describes the current implementation.

## Core Idea
A grid navigation interface.
- Moving **horizontally** (LEFT / RIGHT) changes the letter.
- Moving **vertically** (UP / DOWN) toggles between the two activities for that letter: **LISTEN** and **SAY**.
- The child stays on one letter while doing more with it, matching how a 3-year-old learns.
- Volume controls move to a parent menu, freeing UP and DOWN for activity switching.

---

## Navigation Grid

```
              ◀ LEFT / RIGHT: letter (wraps around) ▶
           S        M        A        T        (active letters only)
LISTEN    [S]      [M]      [A]      [T]    ▲  UP: LISTEN
SAY       [S]      [M]      [A]      [T]    ▼  DOWN: SAY
```

- **UP**: Switches to **LISTEN** row (stops at top with a soft bounce).
- **DOWN**: Switches to **SAY** row (stops at bottom with a soft bounce).
- **LEFT / RIGHT**: Changes letter (wraps around continuously like a radio dial).

---

## Screen Layout (240 × 320, Portrait)

```
┌──────────────────────────┐
│                        ● │ ← ear    LISTEN (UP)
│            M             │
│                        ○ │ ← mouth  SAY (DOWN)
│     [ Moomin picture ]   │
│                          │
├──────────────────────────┤
│   K   L  ( M )  N   O    │ ← letter dial
└──────────────────────────┘
```

- **Right edge**: 2 activity indicators with icons (Ear for LISTEN, Mouth for SAY). The active row is highlighted/enlarged. Since a toddler can't read, each row change triggers a spoken voice prompt.
- **Center**: A letter card contains the current letter in large thick type alongside the character/object artwork. The renderer does not duplicate the large letter.
- **Letter colour**: Each letter maintains a consistent signature colour across both rows.
- **Bottom**: A letter dial displaying where the child is in the alphabet.

---

## Rows and Buttons

| Row | Button | Action / Audio Behavior |
| :--- | :--- | :--- |
| **LISTEN**<br>*(UP / Home)* | **On arrival** | Plays the letter's phonetic sound: *"Mmm"*. |
| | **LEFT / RIGHT** | Moves to previous/next letter; plays that letter's sound. |
| | **CENTER** | Plays full clip: *"Mmm. M. M is for Moomin!"* |
| **SAY**<br>*(DOWN)* | **On arrival** | Spoken prompt + response: *"Can you say mmm?"*, a 2-second pause, then *"Mmm! Well done!"* |
| | **LEFT / RIGHT** | Changes letter and plays the new letter's prompt/pause/praise sequence. |
| | **CENTER** | Replays the prompt: *"Can you say mmm?"* |

---

## Navigation & Toddler Rules

1. **Instant feedback**: Every press triggers sound and visual movement immediately. A new press cancels/stops any currently playing audio clip.
2. **Axis physics**:
   - Horizontal axis wraps around continuously like a dial.
   - Vertical axis stops at top (LISTEN) and bottom (SAY) with a small bounce animation so the child learns there are only two rows.
3. **Voice prompts**: Changing rows announces the activity voice name (*"Listen"*, *"Your turn"*).
4. **Toddler input handling**: Debounce input for ~250 ms after each move. A held button counts as only a single press.
5. **Start screen**: The app launches directly on the LISTEN row at the configured "letter of the day".
6. **Small dial**: The dial shows only enabled/active letters, initially seeded with letters in the child's name and favourite characters.

---

## Parent Menu (Hidden Access)

- **Opening**: Hold **CENTER for 10 seconds** (prevents toddler accidental trigger; eliminates 2-second accidental quits).
- **Layout**: Simple text list menu.
  - **UP / DOWN**: Navigate menu options.
  - **LEFT / RIGHT**: Adjust values.
  - **CENTER**: Confirm selection.
- **Options**:
  - Letter of the day
  - Active letters selection
  - Volume control & volume cap
  - Sleep timer (bedtime mode)
  - Back to child mode
  - Exit app / Shutdown
- **Safety**: Automatically returns to child mode after 30 seconds of inactivity.

---

## Content Structure per Letter

The first release uses Polish letters, Polish example words, and Polish voice recordings.
The English phrases elsewhere in this plan are behavior examples.

```
assets/letters/M/
  picture-master.png  # Supplied 960 × 1280 portrait letter card
media/letters/M/
  picture.png     # Prepared 240 × 320 RGB letter card, shared by LISTEN and SAY
  sound.wav       # Phonetic sound ("Mmm")
  name.wav        # Full phrase ("M is for Moomin")
  full.wav        # Combined: "Mmm. M. M is for Moomin!"
  say.wav         # Combined: prompt + 2s silence + "Mmm! Well done!"
media/letters/shared/
  listen.wav      # Row prompt: "Listen"
  say.wav         # Row prompt: "Your turn"
  bonk.wav        # Edge bounce audio feedback
  goodnight.wav   # Sleep timer clip
```

> **Audio playback note**: The player handles one audio stream at a time. Multi-part sequences (e.g., prompt + pause + praise, or sound + name) are pre-stitched into combined WAV files during media preparation to eliminate the need for runtime audio queueing.

---

## Polish Alphabet Image Requirements

### Required Letter Set

The complete set contains **32 letter cards**, in this order:

```text
A Ą B C Ć D E Ę F G H I J K L Ł M N Ń O Ó P R S Ś T U W Y Z Ź Ż
```

The nine letters with diacritics are `Ą Ć Ę Ł Ń Ó Ś Ź Ż`.
Each has its own card, even when its spoken sound matches another letter.
`Q`, `V`, and `X` are outside the default set.
Combinations such as `CH`, `CZ`, and `SZ` are outside this single-letter set.
The [Polish educational platform ZPE](https://zpe.gov.pl/a/nie-trac-gruntu-pod-nogami-nie-myl-glosek-z-literami/D10I8pLqZ) lists the alphabet and explains the difference between letters and sounds.

The parent menu can enable a smaller selection. The complete asset delivery still contains all 32 cards.
Both activities use the same card, so the first release needs 32 images rather than 64.
Uppercase is the default. Lowercase cards are an optional later set.

### What to Deliver

1. Deliver one portrait PNG per letter, named `picture-master.png` inside that letter's folder.
2. Use a **960 × 1280 pixel** canvas for each master.
3. Include one large uppercase letter and one familiar character or object on each card.
4. Use an opaque, simple background and the sRGB color space.
5. Keep the same illustration style, letter style, and background treatment across all cards.
6. Include a CSV or JSON list with each letter, Polish example word, and signature color.
7. Keep the editable originals, with the letter and illustration on separate layers, for future layouts.

For example, deliver `assets/letters/M/picture-master.png` with `M` and Muminek.
Deliver `assets/letters/Ą/picture-master.png` with `Ą` and a snake for the example word `wąż`.
Folder names retain Polish diacritics. The planned pipeline must normalize names to Unicode NFC and preserve their letter identity.

The large letter must remain recognizable as a printed letter.
Decoration must not replace its strokes or hide its diacritic.
The letter and example word must match the Polish recording.
Most example words start with the target letter. A word containing the target letter is also acceptable.

| Letter | Example word | Picture | Association |
| :--- | :--- | :--- | :--- |
| A | auto | Car | Starts with A |
| M | Muminek | Moomin character | Starts with M |
| Ą | wąż | Snake | Contains Ą |
| Ę | gęś | Goose | Contains Ę |
| Ń | koń | Horse | Contains Ń |
| Ó | ołówek | Pencil | Contains Ó |
| Y | ryba | Fish | Contains Y |
| Ź | źrebak | Foal | Starts with Ź |
| Ż | żaba | Frog | Starts with Ż |

These are proposed associations, not a required illustration list.
A recording for a word containing the letter must describe that relationship accurately.
For example, `W słowie wąż jest Ą` replaces a claim that the word starts with Ą.

### Resolution and Full-Screen Display

**All dimensions are width × height in pixels. The current screen needs a 240 × 320 final frame.**
The driver rejects frames with another size.
The [display settings](../moomin/config.py) select the size, and the [display driver](../moomin/hardware.py) checks it.

| Asset or display | Required dimensions | Purpose |
| :--- | :--- | :--- |
| Portrait master to deliver | **960 × 1280** | Four times the native dimensions, for clean downscaling and later edits |
| Minimum portrait input | **240 × 320** | Native-size input, with limited room for future resizing |
| Prepared portrait `picture.png` | **240 × 320** | Current display at rotation 0° or 180° |
| Optional landscape master | **1280 × 960** | Separate composition for rotation 90° or 270° |
| Prepared landscape card | **320 × 240** | Landscape display, if alphabet mode implements that layout |

Portrait cards have a **3:4 aspect ratio**. Landscape cards have a **4:3 aspect ratio**.
Pixel dimensions determine screen detail. A DPI value such as 72 or 300 does not change the displayed size.
The supplied PNG is standard RGB, with 8 bits per channel. The driver converts the final frame to RGB565 for the display.
The delivery does not need raw RGB565 files.

A matching aspect ratio lets the card cover the complete screen without distortion or cropping.
The app draws the activity indicators and letter dial over the card.
Only the background extends behind these controls.

### Portrait Safe Area

The following dimensions are proposed layout requirements for alphabet mode, not measurements of the existing player interface.
Coordinates start at `(0, 0)` in the top-left corner. The ranges include both endpoints.

| Region on the 240 × 320 card | Coordinates | Content |
| :--- | :--- | :--- |
| Main safe area | x = 12–195, y = 12–259 | Complete letter, diacritic, face, and essential illustration details |
| Right activity strip | x = 204–239, y = 0–271 | Background only, beneath the ear and mouth indicators |
| Bottom dial strip | x = 0–239, y = 272–319 | Background only, beneath the letter dial |

For a 960 × 1280 master, scale the outer edges of each region by four.
The main safe area starts at `(48, 48)` and ends before `(784, 1040)`.
The right strip starts at x = 816. The bottom strip starts at y = 1088.

At native resolution, use a letter about **80–100 pixels tall**, including its diacritic.
Use letter strokes at least **3 pixels thick** after downscaling.
These values correspond to 320–400 pixels of letter height and 12 pixels of stroke thickness in the master.
Use strong contrast between the letter and background.
Keep accents, dots, tails, and the Ł stroke clear at native size.
The distinctions between `Z/Ź/Ż`, `L/Ł`, `A/Ą`, and `E/Ę` must remain visible.
Signature color supports recognition, but letter shape must also distinguish each card.

### Other Screen Sizes and Orientations

A single portrait PNG cannot fill every screen shape while preserving the complete composition.
For other aspect ratios, the renderer must choose one of these behaviors:

- **Contain**: Preserve the complete card and add background padding where necessary. This is the default for letter cards.
- **Separate layout**: Reposition the letter, illustration, and controls for the target screen. Separate layers support this option.
- **Cover**: Fill the screen by cropping edges. Use this only for backgrounds because cropping can remove letter marks.

The [existing image preparation code](../moomin/media.py) supports `contain` and `cover` for gallery images.
It does not yet prepare alphabet cards or arrange their controls.
The planned alphabet pipeline must prepare exact-size RGB cards before playback.
It must preserve the letter and diacritic instead of stretching the image or cropping them.
Landscape support needs its own safe area and control layout.
The first delivery targets the portrait layout above.

### Delivery Acceptance

1. Make sure that all 32 letters have a card and a matching entry in the content list.
2. Make sure that each master is a valid 960 × 1280 PNG in sRGB.
3. Inspect each prepared card at 240 × 320, at 100% scale.
4. Make sure that every letter and diacritic remains clear after downscaling.
5. Preview the activity indicators and letter dial over each card.
6. Make sure that the controls do not cover the letter, diacritic, or essential illustration details.
7. Make sure that the Polish example word matches the illustration and planned recording.
8. Inspect the cards on the physical display for legibility and color differences.

---

## Code Architecture

### Current Artwork Delivery

The [generated artwork set](../assets/alphabet/README.md) contains 32 cards with different Moomin characters.
Twenty-one cards match a Polish character initial, including `M — Migotka`, `C — Czarodziej`, and `T — Tata Muminka`.
The remaining characters are visual companions. Their names do not teach the displayed letter.
The current viewer displays these cards across the complete screen with `--fullscreen`.
The planned activity layout must fit the cards into its safe area before it adds icons or the dial.

```bash
python3 -m moomin --config config.alphabet.json gallery --fullscreen --no-audio
```

### Planned Alphabet Mode

- **`moomin/alphabet.py`**:
  - Implements `AlphabetSession` matching the `PlayerSession` interface (`action(button)`).
  - Plugs directly into `run_gallery` (reuses loop, event debounce, render trigger, CLI `--mode alphabet`).
- **Row Handlers**:
  - `ListenRow` and `SayRow` objects with `enter()`, `horizontal(direction)`, `center()`, and `draw(frame)`.
- **Parent Menu**:
  - Isolated overlay/session swapped in upon a 10-second CENTER hold.
- **Performance**:
  - Optimized for Raspberry Pi 3 refresh limits (minimizing SPI display transfer overhead).
  - Short 2–3 frame transitions or partial updates (e.g. dial bar redraws).

---

## Build Order

1. **Grid navigation & LISTEN row**: Basic 2-row vertical toggle (UP/DOWN) and horizontal dial (LEFT/RIGHT) with placeholder clips. Test via `--keyboard` and `--simulate`.
2. **Parent menu**: 10-second hold mechanism and configuration controls.
3. **SAY row**: Prompt/pause/praise audio pipeline and visual state.
4. **Content pipeline**: Validate all 32 Polish masters, downscale them to exact-size RGB cards, and prepare stitched audio clips per letter. Apply the image requirements above.
5. **State & persistence**: Log usage in `.state/` and remember letter of the day.
