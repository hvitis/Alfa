How it teaches
1. Sound before name. Have each letter start with its sound, then its name: "Mmm… M is for moon!" Keep three clips per letter: the sound, the name, and a character saying the word.
2. Pictures as anchors. Use familiar Polish words: M for most, S for słońce, L for las. Match each recording to its letter.
3. Don't go A→Z. Start with the letters in his name and his favourite characters' names. Add a new letter when he's asking for the current ones.
4. Say it with me. A clip asks "Can you say mmm?", waits 2 seconds, then the character answers "Mmm! Well done!" He gets to join in, and it needs no microphone.
5. Two-choice game. Show two big letters, one per side. The voice asks "Where's the M?" and he presses LEFT or RIGHT. A wrong press gets "That's S, for sun! Try again." No scores or failure sounds.
6. Quiet repetition. Log each letter he plays and each game answer in .state/. Then bring back the letters he hears less often or gets wrong.
7. Full-screen letters. Fill the screen with the letter in thick type, one fixed colour per letter, next to the character. Start with uppercase, since kids this age usually learn capitals first.
8. Radio channels. Channels make it feel like a radio: letters, the alphabet song with each letter lit on screen as it's sung, and a story clip or two.

Content pipeline (run on your laptop, not the Pi)

9. Find words automatically. Your clip names (SPEAKER_01_0014) look like they came from a tool that splits episodes by speaker. Run WhisperX on the episodes to get the time of every word and who said it. Index the words by first letter and cut clips of characters saying "M" words.
10. Name the speakers once. A small table mapping SPEAKER_01 to "Narrator" lets the screen show who's talking and lets you pick favourites.
11. Even loudness. Use ffmpeg (already installed) to bring every clip to the same loudness, trim silence and add short fades, so no clip comes out much louder than the rest.
12. One folder per letter. For example media/letters/M/ holding sound.wav, name.wav, word-*.wav and picture.png. The existing manifest and change-detection code in media.py can extend to this.
13. Your own voice as a backup. Record yourself for letters the cartoon doesn't cover well. A parent's voice also teaches well at this age.

Toddler-proofing

14. Volume cap. Right now UP goes all the way to 100%. Cap it (say 50%) and take volume off his buttons. Check the loudness at ear distance with a phone sound-meter app.
    - [x] Done 2026-10-14: `audio.max_volume` (default 0.5) is enforced inside the audio player, so no path can go louder; a start volume above the cap is a configuration error. In the alphabet/service mode UP and DOWN already play animations, so volume is off his buttons there.
    - [ ] Measure the loudness at ear distance on the real speaker and adjust the cap.
15. No accidental exit. He'll find "hold CENTER 2 s to quit" by accident. The button board can't reliably detect two buttons at once, so a two-button combo won't work. Use a 10-second hold, a hidden switch inside the case, or exit only over SSH.
    - [x] Done 2026-10-14: manual runs (`make run`) now need a 10-second CENTER hold (`controls.exit_hold_seconds`, 0 = never). The service (`--standalone`) still never exits from buttons.
16. Button mashing. Ignore presses for the first few hundred ms of a clip, and don't restart the clip on every press. If he sits on a button, count it as one press.
    - [x] Done 2026-10-14: physical presses within 0.4 s of the last accepted one are ignored (`controls.press_guard_ms`; the SSH keyboard is not limited). CENTER no longer restarts a letter that is still being drawn, and TOP/BOTTOM let their running animation finish. A held button already counted once (the debouncer waits for a release); a test now locks that in.
17. Bedtime mode. Add a 10–15 minute sleep timer that ends with a character saying goodnight. For a dimmable screen, switch the backlight (GPIO24) from OutputDevice to PWMOutputDevice.
18. Start at boot. Run the player as a service that starts on power-on and restarts after a crash, with a splash screen within seconds.
19. [ ] Configure the Raspberry Pi 3 SD card for read-only operation (chosen power-switch approach). Complete dependency installation, media preparation, service setup, and button calibration before enabling the RAM-backed overlay filesystem. Protect the boot partition from writes and keep temporary files and logs in RAM; do not add a writable activity-log partition for normal use. Verify offline startup, buttons, audio, and repeated power-off/power-on cycles on the actual Pi. Document how to enter writable maintenance mode for program updates and persistent calibration changes. This greatly reduces corruption risk when using a physical power switch. See [the standalone guide](raspberry-pi-standalone.md#power-switch-operation).
    - [x] Remove inactivity shutdown. The app stays running without input.
    - [ ] Install the updated service on the Pi and verify idle operation with the LCD, buttons, speaker, and chosen 5000 mAh power bank.
20. Parent page. A tiny web page served by the Pi would let you, from your phone, pick today's letter, set the time limit, see what he played and upload clips.

5 hardware add-ons

1. Radio tuning knob. Use a rotary encoder that clicks as it turns, e.g. a KY-040. Each click moves to the next letter, with a short burst of radio static in between. Wire it to GPIO5, 6 and 13 (pins 29, 31, 33), which the screen, audio and ADC don't use. A potentiometer on the ADC's spare A1 input needs no free pins, but its steps feel less crisp.
2. NFC letter cards or figures (PN532 board, set to I²C mode). He taps an "M" card, or a toy figure with a sticker tag, and that letter plays, like a Toniebox. It shares the ADC's I²C wires at address 0x24, so the two don't clash. NTAG213 stickers are cheap.
3. Big arcade buttons (30 mm, lit). Wire them in parallel with the button board's tiny switches. The board's voltages stay the same, so you only need to run calibrate-buttons again. If you wire the LEDs to GPIO pins, the game can light up the button he should press.
4. Battery with safe shutdown. Use a battery board that fits your Pi model, such as a PiSugar, with a protected cell, a power button and safe shutdown. Make sure it can supply the amp's peak current at high volume. Check its I²C address doesn't clash with 0x48.
5. Microphone for "say it back". Record his attempt and play it back, maybe pitch-shifted for a playful echo. Use a USB mini mic, because the amp already uses the Pi's I²S audio port. Keep the recordings on the device.

Findings from the house-radio design review (2026-10-14)

Fix first
21. [ ] Correct the wrong shutdown advice. The app no longer shuts down when idle, but these still say it does or tell you to wait for sleep: the power page and roof-page step 1 in `design/house-radio/src/plans.py` (Alfa.pdf), the charging page in `design/house-radio/src/booklet.py` (Alfa-assembly.pdf), the charging paragraph in `design/house-radio/README.md`, and the "five-minute inactivity shutdown" paragraph in `design/wooden-case/README.md`. Until 22 or 23 is done, cutting power with the switch can corrupt the SD card.
22. [ ] Make the SD card read-only (item 19). With a physical switch and no shutdown, this is the most important change.
23. [ ] Or replace the power bank with a battery board that shuts down safely (hardware add-on 4, e.g. PiSugar-type). It gives a power button, safe shutdown and a charging socket, and would make the QUARKZMAN cable and opening the roof to charge unnecessary. The house's back gable would need a new layout.

Before cutting wood
24. [ ] Measure the provisional parts and put the numbers into `design/house-radio/parameters.json`, then rebuild (`bash design/house-radio/run-cad.sh python build_all.py`): QUARKZMAN switch body and button (now 18 × 40 × 12 mm, Ø12 hole, 12 mm spacers), USB-C plug overmoulds, the Baseus USB-C socket position (assumed centred on top), the LCD fastener size, and the keypad and small-board mounting holes (transfer marks on the templates).
25. [ ] Bench-test the power chain: Baseus → QUARKZMAN → USB-C to up-angled micro-USB lead → Pi. The Pi must boot and `vcgencmd get_throttled` must print 0x0 with the LCD and loud audio running. The QUARKZMAN cable has only two wires; some banks will not switch on through it. Keep the second cable as a spare.
26. [ ] Run a long test with the box closed and check the Pi and bank temperatures; the vents are unmeasured proposals.

For a small child
27. [x] Items 14, 15 and 16 (volume cap, 10-second exit hold, mashing guard). Done 2026-10-14.
28. [ ] Big 30 mm arcade buttons (hardware add-on 3) as a variant of the house's "door": the 12 mm caps are small for toddler fingers. With woodkit this is a front-gable change plus a rebuild.
29. [ ] A rotary "tuning" knob (hardware add-on 1), e.g. through a side wall of the house.

Project upkeep
30. [x] The standalone hardware viewer (`hardware-visualisation/viewer.html`, `output/wiring-3d.html`) embeds GLB assets and radio images via `scripts/export-single-file.mjs` so the Wooden Case and Wooden Radio tabs load completely offline and in webservers. Done 2026-10-16.
31. [ ] Commit the radio work in logical commits and add CI: `pnpm test`, the server tests and `make test`. The CAD builds are byte-identical, so CI can also check that the synced viewer data matches a fresh build.
32. [ ] Move the wooden case onto `design/woodkit` and `hardware-visualisation/src/scene/workshopScene.js`. Duplicated scene code is how the Wooden Case tab's click crash went unnoticed.



Hardware

1. Use big buttons, placed where their meaning is obvious. Wire 30 mm lit arcade buttons in parallel with the keypad's switches; you only need to recalibrate. Placement matters most:
   - LEFT goes to the left of the screen and RIGHT to the right, so the child presses the side they want to go to.
   - A big CENTER button goes under the window.
   - UP and DOWN get ear and mouth icons.
   - Connect the button lights to free GPIO pins so a game can light the button to press.
2. Add an NFC "porch" for figures. This is the biggest hardware improvement.
   - A PN532 board in I²C mode uses address 0x24, so it shares the bus with the ADS1115 at 0x48.
   - Put NTAG213 stickers under Moomin figures. Standing a figure on the porch jumps to its letter and the character speaks.
   - This is how the Toniebox works, and it's the most proven way toddlers play with this kind of toy. The game then becomes "find Ryjek and put him on the porch".
3. Add a USB microphone for "say it back". Record a 2-second attempt and play it back pitched up like a chipmunk; kids love hearing themselves. It has to be USB because the amplifier already uses the Pi's I²S port. Keep the recordings on the device.
4. Add a tuning knob. A KY-040 rotary encoder on GPIO 5/6/13, with radio static between letters, fits the radio idea. It could also move the pencil: turn the knob to draw.
5. Fix power and amplifier noise.
   - Use a battery board with safe shutdown (PiSugar-type) or make the SD card read-only.
   - Connect the MAX98357A's SD pin to a GPIO so the amplifier is fully off while asleep. That means no hiss and longer battery life.
6. Later, a bigger screen. A 2.8" 240×320 ST7789 module keeps the same driver and resolution with bigger pixels. Measure the window before cutting.


Learning games

1. Sound blender. Polish words are spelled the way they sound, so the child can build words. Tap K, O, T and the radio says "k… o… t… KOT!" and shows a cat. Made-up words get sounded out too, which is half the fun. It needs the per-letter sound clips from todo 1. Add cards for SZ, CZ, CH, RZ and DZ so real words work.
2. "Bring me something that starts with M." Put stickers on real toys and household objects. Each tag stores its word (miś), not its letter. The radio asks for a letter, the child goes hunting around the flat, and the radio checks the first letter. A wrong pick gets a friendly correction, in the no-failure style of todo 5: "Łyżka starts with Ł! We're looking for M."
3. Sound memory. All the cards have the same back. Tap one to hear its sound and see the letter for 2 s. Tap a second card with the same sound and the existing fireworks play. The radio flips the cards, so the whole family can play.
4. Two-choice game with real cards. This is todo 5 with cards on the table instead of the small buttons. The voice asks "Where's the M?" and the child taps a card.

Collecting and progress

5. Letters as gifts. Todo 3 says to add a new letter when the child asks for more. Make the card the unlock: LEFT/RIGHT only moves through letters whose card has been tapped. A new letter becomes a present, maybe wrapped and from grandma.
6. Progress stored on a "passport" card. Once the SD card is read-only (todo 19/22), the Pi can't keep play history. An NTAG215 tag holds 504 bytes, which is enough for play and correct-answer counts for all 32 letters. The child taps their passport at the start. Alfa reads it, uses it for quiet repetition (todo 6), and writes the updated counts back. Siblings each get their own card. Use a versioned record with a CRC, and only write while the tag is still on the reader.

Characters and family

7. Guest host. Stand a tagged figure on a small dock on top of the cloud and that character takes over: its animations, its voice, its favourite letters. Lift it off and the radio goes back to normal. This one uses presence, not a tap.
8. Voice postcards. Tap a photo card of grandma to hear a message she recorded. The tag only stores a clip ID, so the audio stays offline on the Pi. Messages could be added through the parent page (todo 20) during maintenance mode.

Grown-up controls (these fix open todos)

9. Moon card for a safe goodnight. Tapping the moon starts the sleep timer (todo 17). When it ends, a character says Dobranoc, the backlight fades, and the Pi shuts down properly. Cutting power with the switch can corrupt the SD card (todo 21–23), and this turns the safe shutdown into a bedtime ritual the child does themselves. The service will need a sudoers or polkit rule to allow poweroff.
10. Parent key. A tag on your keyring opens a hidden menu with volume (still under the cap), today's letters, timer length and exit. This replaces the "hidden switch" option in todo 15 and takes volume off the child's buttons completely.

Physical pieces

11. 3D-printed letter tokens with the tag inside. Extend the CAD pipeline to generate 32 tokens with raised letters and a pocket for an NFC tag. The manifest would record which layer to pause the print at so you can drop the tag in. Kids can trace the raised letter with a finger, like Montessori sandpaper letters, and then watch the drawing lesson trace it on screen. Each token can use its letter's colour. Choking hazard: a 25 mm tag disc on its own is small enough for a toddler to swallow (smaller than the 31.7 mm small-parts test tube). Keep tokens at least 45 mm, or embed tags in laminated cards.
12. Mailbox slot. The child posts the token into a slot in the cloud, it plays, and it comes back out of a hatch at the back. Toddlers love posting things. This is the speculative one: the battery and Pi fill most of the 86 mm depth, so it needs a layout study first.