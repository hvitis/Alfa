# Alphabet interaction

The alphabet has one card for each Polish uppercase letter. Each button has a fixed action.
There are no LISTEN/SAY rows or hidden activity modes.

| Button | Action | Feedback |
| --- | --- | --- |
| LEFT | Select the previous letter | A whoosh and a card that enters from the left |
| RIGHT | Select the next letter | A whoosh and a card that enters from the right |
| UP (ear) | Play the current letter recording, including its sound and word | A tick and a card that enters from the top |
| DOWN (mouth) | Play “Powiesz ze mną?”, wait two seconds, then play praise | A tick and a card that enters from the bottom |
| CENTER | Start or resume tracing while held | A pop, the letter guide, and a moving pencil |

Release CENTER to pause the pencil. Another CENTER press resumes the same trace.
LEFT, RIGHT, UP, and DOWN cancel the trace. These buttons also cancel its recording.
A completed trace shows fireworks, then restores the card.
CENTER never exits the alphabet. Q or Ctrl+C exits a manual run. The service ignores Q.

Every debounced press produces feedback, including a press rejected by the 400 ms guard.
A guarded CENTER press can resume an existing trace. It cannot start a new one.
The guard limits actions and never suppresses a release.

The player keeps one ALSA stream open and mixes effects with speech in 10 ms blocks.
It preloads selected recordings before accepting input. Playback needs no network or speech synthesis.
The default debounce is 30 ms. ALSA uses a 20 ms buffer and a bounded Linux pipe.
A display worker sends the newest frame, so SPI transfers cannot block button input.
The response target is approximately 100 ms from a stable physical press. Measure this latency on the Pi.

The generic girl animations remain available to older configurations. The alphabet presets use card movement instead.

## Letter selection

Edit [settings.json](../settings.json) before restarting the Pi or service.
The default starter set is A, L, F, M, O, S. This set is an example, not a known child's name.
Replace it with five or six letters from the child's name and favorite characters.
The list order controls navigation. Duplicate, lowercase, unknown, and empty selections produce a startup error.

```json
{"letters": ["M", "A", "J", "S", "O", "T"]}
```

To enable all 32 letters, use:

```json
{"letters": "all"}
```

The app retains all cards and recordings. A selection only changes the available navigation choices.
The app reads the selection once at startup. Changes take effect after `make restart` or a Pi restart.
Without `settings.json`, the `lesson.letters` value in the main configuration applies.

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
Piper also generated the prompt. The praise clips use `praise_1.wav` and `praise_2.wav` from the repository root.
DOWN inserts a two-second silence after the prompt and alternates between the two praise clips.

[The recording guide](../media/letter-sounds/README.md) explains generation and individual voice replacements.
[The drawing guide](../assets/letter-drawing/README.md) explains the stroke data and rendering components.
[The implementation checklist](software-improvements-checklist.md) records verification and the remaining physical checks.
