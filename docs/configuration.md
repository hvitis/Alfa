# Application configuration

The app uses one complete file: [`config.json`](../config.json).
The manual player, Pi service, boot splash, mapping tool, and website preview use this file.
There are no alphabet or standalone overlays, and no separate letter selection file.

## Settings

| Section | Purpose |
| --- | --- |
| `display` | LCD pins, SPI settings, rotation, and colors |
| `adc` | Analog converter model, I²C bus, address, and debounce |
| `images` | Source artwork, prepared cards, fit, and background |
| `animations` | Prepared animation directory, frame rate, and cycles |
| `letter_drawing` | Stroke data and drawing and celebration timing |
| `audio` | Recordings, ALSA device, amplifier pin, volume, and volume cap |
| `lesson` | Selected letters and idle timers |
| `controls` | Physical button guard and exit timing |

The current alphabet uses A, D, G, M, P, T, W, in that order.
The default animations run at 4 FPS, matching the former standalone configuration.
`animations.clips.hemulen` selects 6 FPS and two cycles for Hemulen's 24-frame animation, giving eight seconds of playback.

## Change selected letters

Edit `lesson.letters` in `config.json`.
Use a list of unique Polish uppercase letters, or the string `all` for all 32 letters.
For example, replace only the existing `letters` value with `["M", "A", "J"]`.
Keep `invite_seconds`, `sleep_seconds`, and the other configuration sections.

On the Pi, apply the change with:

```bash
make restart
```

The app reads configuration at startup. The website preview reads it when the website builds or its development server reloads.

## Hardware settings

Edit `adc.model` to select `ads1115` or `ads1015`.
Edit `audio.device` if automatic ALSA detection cannot identify the amplifier.
Alphabet mode requires portrait rotation `0` or `180`.

After fitting or rotating the buttons in the case, run `make mapping`.
Measured button voltages remain in `.state/buttons.json`. This generated calibration is specific to the assembled device.
It contains hardware measurements rather than a second set of application settings.

## Optional photo player

The same configuration can enable the generic photo player.
Set `animations.enabled` and `letter_drawing.enabled` to `false`.
Set `images.input` to `imgs`, `images.prepared` to `media/images`, and `lesson.letters` to `all`.
The release kit uses these values for its neutral demo and still contains only one runtime configuration.

For automated tools, `--config PATH` selects another complete configuration instead of `config.json`.
The loader reads only that file. It does not merge it with repository defaults.
Relative media paths still resolve from the project directory.

## Upgrade an installed Pi

Run `make restart` after updating this checkout on the Pi.
The installer replaces the service units so the player and splash use the single configuration.
Old preset or selection files left on a device have no effect.
Before an upgrade, preserve any device-specific settings in the current `config.json`.

## Protection against repeated button presses

The physical buttons ignore additional actions while a card slides, a character animation runs, or the alphabet speaks.
Ignored presses produce no sound and do not queue actions.
A paused letter drawing can resume with another CENTER hold after speech ends.

The fifth physical press within two seconds shows a sad face.
All five buttons share this count, including presses that the app ignores.
The face clears and the buttons work again after two seconds without a press.
Further presses extend this pause.
A held button counts once, and a release cannot trigger a rejected CENTER action.
An active recording continues during the pause.

The audio watchdog replaces a stalled or failed playback stream without restarting the lesson.
It detects a stream that accepts no audio for one second.
Three recovery attempts within ten seconds cause an audio error if playback fails again.
SSH keyboard controls remain available for adult testing.
