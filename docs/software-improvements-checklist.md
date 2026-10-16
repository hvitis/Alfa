# Software improvements

Implementation and verification checklist for the five requested changes.

- [ ] Keep one ALSA stream open. Mix navigation, CENTER, and ignored-press effects without interrupting speech.
- [ ] Convert all existing A–K recordings. Generate the remaining Polish recordings locally with Piper.
- [ ] Provide a prompt, a two-second response pause, and praise for DOWN.
- [ ] Advance the drawing clock only while CENTER is held. Preserve progress across releases and guarded presses.
- [ ] Give each alphabet button one fixed action. Replace generic animations with directional card movement.
- [ ] Load a small letter selection from `settings.json` at startup. Keep all 32 letters available.
- [ ] Show a character invitation after 20 seconds idle.
- [ ] Disable the backlight and amplifier after five minutes. Wake on any button without rebooting.
- [ ] Add regression tests for audio mixing, hold/release, fixed actions, selection, idle, and wake behavior.
- [ ] Run the full Python suite and repository checks. Record results and hardware verification limits here.
