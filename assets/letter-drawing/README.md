# Letter drawing lessons

CENTER (the fifth button) draws the selected letter in alphabet mode.
The lesson starts on the button press. Release does not start another lesson.
Space starts the same lesson from an SSH keyboard.
The alphabet and standalone presets enable this feature.

The lesson shows a pale guide and a tilted yellow pencil with a graphite tip and pink eraser.
The pencil follows the stroke endpoint and moves smoothly between strokes without adding connecting lines.
The strokes are 16 pixels thick on the 240 × 320 display, compared with the previous 10 pixels.
Each letter uses the navy color sampled from its still-image card.
It draws each stroke in order, with a short pause between strokes.
It draws Polish accents and ogoneks after the main letter.
The finished letter stays visible during the success fireworks.
The original character card returns when the fireworks finish.

![Preview of the Ą lesson](preview.gif)

[View all 32 completed letters](../../docs/letter-drawing-contact-sheet.png).

## Controls and timing

| Button | Action |
|---|---|
| LEFT / RIGHT | Interrupt the lesson and select the previous or next letter |
| UP | Interrupt the lesson and show the listening animation |
| DOWN | Interrupt the lesson and show the repeating animation |
| Press CENTER / Space | Start the selected letter lesson; a press while it is still drawing is ignored |

The normal exit control still applies outside standalone mode.
Hold CENTER for ten seconds, or press Q, to exit (`controls.exit_hold_seconds`).

The default lesson lasts about 8–9 seconds.
It has a 0.5-second introduction, 5 seconds of tracing, and 0.22-second pauses between strokes.
The completed letter stays visible for 0.7 seconds before the 1.8-second fireworks animation.
If the recording lasts longer, the completed letter stays visible until that recording ends.
The app stays running when idle, including with silent placeholders.

The `letter_drawing` section in [config.json](../../config.json) sets these durations and a target of 20 frames per second.
The player skips late frames and transfers only changed rectangles during the lesson.
The actual frame rate depends on the Pi and the display connection.

## Components and data

| Component | Responsibility |
|---|---|
| [letters.json](letters.json) | All 32 Polish uppercase letters, stroke order, shared marks, card colors, and recording paths |
| [LetterCatalog and Stroke](../../moomin/letter_paths.py) | Resolve a card filename, expand shared geometry, and measure stroke paths |
| [LetterLesson](../../moomin/letter_lesson.py) | Control introduction, tracing, pen lifts, the completed letter, and fireworks |
| `LetterRenderer` and `Pencil` in that module | Draw the guide, completed strokes, pencil, and fireworks |
| [LetterRecordings](../../moomin/audio.py) | Play the selected letter recording, or use a silent placeholder |
| [PlayerSession](../../moomin/player.py) | Connect button actions to lessons, audio, navigation, and character animations |
| [AnimationPresenter](../../moomin/frames.py) | Retain one frame and transfer only changed pixels |
| [ST7789.show_region](../../moomin/hardware.py) | Send a rectangle through SPI with the configured display rotation |

The complete stroke catalog is less than 8 KB.
The app retains flattened geometry only for the active letter.
It generates frames as playback advances.
Playback needs no videos, generated frame files, FFmpeg conversion, or additional Python packages.
The GIF and contact sheet are review artifacts. The app does not load them.

Coordinates use a 100 × 100 canvas.
Each stroke starts with `M` and continues with `L`, `Q`, or `C` commands.
These commands mean move, line, quadratic curve, and cubic curve.
Each stroke is one pen movement without a lift.
The renderer advances by path distance for a consistent speed through curves.
Letters such as Ą and Ę reuse the base letter and the shared ogonek.
The generator samples the dominant navy from each prepared card and stores it as the letter's `ink` color.
Playback reads this color from the catalog. It does not sample card pixels during each lesson.
The pencil uses two small sprites generated once, with a separate orientation for accents near the top.

These are simple printed uppercase forms with one consistent teaching sequence.
They do not trace the character artwork or teach cursive handwriting.

To change a letter, edit [generate-letter-data.py](../../scripts/generate-letter-data.py).
Then regenerate the catalog and previews:

```bash
python3 scripts/generate-letter-data.py
python3 scripts/preview-letter-drawing.py
```

To preview another letter, run:

```bash
python3 scripts/preview-letter-drawing.py --letter Ż --destination output/letter-Ż.gif
```

## Add recordings

Each letter has its own recording path in `letters.json`.
Absent files act as silent placeholders.
The app starts the recording when the drawing lesson starts.
Navigation or a character button stops both the lesson and its recording.
`--no-audio` also keeps all drawing lessons silent.

Put prepared WAV recordings in [media/letter-sounds](../../media/letter-sounds/README.md).
Use stereo, 48 kHz, 16-bit PCM WAV files.
For example, convert an original recording with:

```bash
ffmpeg -i sounds/letter-A-original.wav -ar 48000 -ac 2 -c:a pcm_s16le media/letter-sounds/00-A.wav
```

The original recording remains separate from its prepared WAV file.
The player uses the configured digital volume, which defaults to 20%.
The existing speaker-test command remains available for speaker diagnostics.

## Run on the Pi

From the Pi project directory, run:

```bash
make update
```

For a manual hardware test, use `make run`.
This command stops the service to release its GPIO pins, then restores the service after the test ends.

For a silent preview without hardware, run:

```bash
python3 -m moomin --config config.alphabet.json --simulate gallery --fullscreen --keyboard --no-audio
```

Simulation updates `.state/preview/current.png` as the lesson plays.

The automated tests cover all letter mappings, stroke interpolation, marks, recordings, controls, fireworks, card restoration, and rotated rectangle transfers.
The full keyboard loop also covers compiled card transfers before and after a lesson.
Physical display speed and speaker output still need a check on the Pi.

## If CENTER does nothing

Read the active service configuration and recent logs on the Pi:

```bash
systemctl show moomin.service -p WorkingDirectory -p ExecStart
journalctl -u moomin.service -n 30 --no-pager
```

The startup log reports `Letter drawing enabled` and the stroke catalog path.
If drawing is disabled, the log reports the configuration setting to enable.
The service must use `config.standalone.json` from the updated project folder.

After a CENTER action, the log reports the action and selected card filename.
For example, `CENTER: Drawing A; card=000-00-A.png` confirms that the app started the lesson.
`No drawing for this card` means the card filename does not match a letter in the catalog.

If there is no CENTER log, stop the service and inspect physical button events:

```bash
sudo systemctl stop moomin.service
.venv/bin/python -m moomin --config config.standalone.json buttons
```

Press and release the fifth button. Its press event must identify `center`.
Press Ctrl+C to stop the monitor, then restart the service:

```bash
sudo systemctl start moomin.service
```
