# Alphabet interaction

The alphabet has one card for each Polish uppercase letter. Each button has a fixed action.
There are no LISTEN/SAY rows or hidden activity modes.

| Button | Action | Feedback |
| --- | --- | --- |
| LEFT | Select the previous letter | A whoosh and a card that enters from the left |
| RIGHT | Select the next letter | A whoosh and a card that enters from the right |
| UP | Show the speaking character and ask “Powiedz jaka to literka.” | Slide the first frame in from above, then start animation and speech |
| DOWN | Randomly choose the clapping character or Hemulen with its paired praise | Slide the first frame in from below, then start animation and speech |
| CENTER | Start or resume tracing while held | A pop, the letter guide, and a moving pencil |

Release CENTER to pause the pencil. Another CENTER press resumes the same trace.
LEFT, RIGHT, UP, and DOWN cancel the trace. These buttons also cancel its recording.
A completed trace shows fireworks, then restores the card.
The fireworks run without a held button after the final stroke.
CENTER never exits the alphabet. Q or Ctrl+C exits a manual run. The service ignores Q.

Every debounced press produces feedback, including a press rejected by the 400 ms guard.
A guarded CENTER press can resume an existing trace. It cannot start a new one.
The guard limits actions and never suppresses a release.

The player keeps one ALSA stream open and mixes effects with speech in 10 ms blocks.
It preloads selected recordings before accepting input. Playback needs no network or speech synthesis.
The default debounce is 30 ms. ALSA uses a 20 ms buffer and a bounded Linux pipe.
A display worker sends the newest frame, so SPI transfers cannot block button input.
The response target is approximately 100 ms from a stable physical press. Measure this latency on the Pi.

The single `config.json` enables both tracing and character animations.
Run `make mapping` after fitting or rotating the buttons in the case.
Assign each action by pressing its chosen button. Measured voltages support horizontal, vertical, and reversed boards.

## Letter selection

Edit `lesson.letters` in [config.json](../config.json) before restarting the Pi or service.
The current starter set is A, D, G, M, P, T, W.
Replace it with five or six letters from the child's name and favorite characters.
The list order controls navigation. Duplicate, lowercase, unknown, and empty selections produce a startup error.

```json
{"lesson": {"letters": ["M", "A", "J", "S", "O", "T"]}}
```

To enable all 32 letters, use:

```json
{"lesson": {"letters": "all"}}
```

The app retains all cards and recordings. A selection only changes the available navigation choices.
The app reads the selection once at startup. Changes take effect after `make restart` or a Pi restart.
Edit the existing `lesson` section and retain its idle timers. No separate selection file is loaded.

## Invitation and sleep

After 20 seconds without input, a small character from the current card peeks in for three seconds.
The invitation is silent and occurs once per idle interval. Any button starts a new interval.
Holding CENTER counts as activity.

After five minutes, the app disables the backlight and the MAX98357A amplifier through its SD pin.
The Pi, button input, and ALSA stream stay running. The app never requests shutdown or reboot.
Any button wakes the peripherals and performs its normal action. Guarded presses also wake the device.

The `lesson.invite_seconds` and `lesson.sleep_seconds` values control these times.
The `audio.shutdown_pin` value selects the BCM GPIO for amplifier sleep, with GPIO23 as the default.
Read [the wiring instructions](wiring.md#amplifier-sleep-control) before connecting that pin.

## Recordings and verification

All 32 letter slots contain prepared recordings. Existing `literka_A` through `literka_K` files supply 11 slots.
Piper generated the other 21 clips locally with its Polish `pl_PL-gosia-medium` voice.
Piper also generated the prompt. The prepared praise clips were imported from the original `brawo_1.wav` and `brawo_2.wav` recordings.
The root originals were removed after conversion. Playback uses the prepared copies.
UP plays the question after its slide. DOWN randomly selects one fixed character and sound pair after each completed action.
Hemulen uses `praise_1.wav`. The clapping character uses `praise_2.wav`.
Edited manifest text controls Piper regeneration. Unchanged clips and personal replacements stay unchanged during an ordinary run.

[The recording guide](../media/letter-sounds/README.md) explains generation and individual voice replacements.
[The drawing guide](../assets/letter-drawing/README.md) explains the stroke data and rendering components.
[The implementation checklist](software-improvements-checklist.md) records verification and the remaining physical checks.
