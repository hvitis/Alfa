How it teaches
1. Sound before name. Have each letter start with its sound, then its name: "Mmm… M is for Moomin!" Keep three clips per letter: the sound, the name, and a character saying the word.
2. Characters as anchors. Tie letters to characters where the cartoon allows: M for Moomin, S for Snufkin, L for Little My, G for Groke, H for Hemulen. Use everyday words from the episodes for the other letters.
3. Don't go A→Z. Start with the letters in his name and his favourite characters' names. Add a new letter when he's asking for the current ones.
4. Say it with me. A clip asks "Can you say mmm?", waits 2 seconds, then the character answers "Mmm! Well done!" He gets to join in, and it needs no microphone.
5. Two-choice game. Show two big letters, one per side. The voice asks "Where's the M?" and he presses LEFT or RIGHT. A wrong press gets "That's S, for Snufkin! Try again." No scores or failure sounds.
6. Quiet repetition. Log each letter he plays and each game answer in .state/. Then bring back the letters he hears less often or gets wrong.
7. Full-screen letters. Fill the screen with the letter in thick type, one fixed colour per letter, next to the character. Start with uppercase, since kids this age usually learn capitals first.
8. Radio channels. Channels make it feel like a radio: letters, the alphabet song with each letter lit on screen as it's sung, and a story clip or two.

Content pipeline (run on your laptop, not the Pi)

9. Find words automatically. Your clip names (SPEAKER_01_0014) look like they came from a tool that splits episodes by speaker. Run WhisperX on the episodes to get the time of every word and who said it. Index the words by first letter and cut clips of characters saying "M" words.
10. Name the speakers once. A small table mapping SPEAKER_01 to "Moomintroll" lets the screen show who's talking and lets you pick favourites.
11. Even loudness. Use ffmpeg (already installed) to bring every clip to the same loudness, trim silence and add short fades, so no clip comes out much louder than the rest.
12. One folder per letter. For example media/letters/M/ holding sound.wav, name.wav, word-*.wav and picture.png. The existing manifest and change-detection code in media.py can extend to this.
13. Your own voice as a backup. Record yourself for letters the cartoon doesn't cover well. A parent's voice also teaches well at this age.

Toddler-proofing

14. Volume cap. Right now UP goes all the way to 100%. Cap it (say 50%) and take volume off his buttons. Check the loudness at ear distance with a phone sound-meter app.
15. No accidental exit. He'll find "hold CENTER 2 s to quit" by accident. The button board can't reliably detect two buttons at once, so a two-button combo won't work. Use a 10-second hold, a hidden switch inside the case, or exit only over SSH.
16. Button mashing. Ignore presses for the first few hundred ms of a clip, and don't restart the clip on every press. If he sits on a button, count it as one press.
17. Bedtime mode. Add a 10–15 minute sleep timer that ends with a character saying goodnight. For a dimmable screen, switch the backlight (GPIO24) from OutputDevice to PWMOutputDevice.
18. Start at boot. Run the player as a service that starts on power-on and restarts after a crash, with a splash screen within seconds.
19. Survive pulled plugs. Turn on the Overlay File System in raspi-config so a power cut can't corrupt the SD card. Changes are then lost at reboot, so keep #6's log on a small partition that stays writable.
20. Parent page. A tiny web page served by the Pi would let you, from your phone, pick today's letter, set the time limit, see what he played and upload clips.

5 hardware add-ons

1. Radio tuning knob. Use a rotary encoder that clicks as it turns, e.g. a KY-040. Each click moves to the next letter, with a short burst of radio static in between. Wire it to GPIO5, 6 and 13 (pins 29, 31, 33), which the screen, audio and ADC don't use. A potentiometer on the ADC's spare A1 input needs no free pins, but its steps feel less crisp.
2. NFC letter cards or figures (PN532 board, set to I²C mode). He taps an "M" card, or a Moomin figure with a sticker tag, and that letter plays, like a Toniebox. It shares the ADC's I²C wires at address 0x24, so the two don't clash. NTAG213 stickers are cheap.
3. Big arcade buttons (30 mm, lit). Wire them in parallel with the button board's tiny switches. The board's voltages stay the same, so you only need to run calibrate-buttons again. If you wire the LEDs to GPIO pins, the game can light up the button he should press.
4. Battery with safe shutdown. Use a battery board that fits your Pi model, such as a PiSugar, with a protected cell, a power button and safe shutdown. Make sure it can supply the amp's peak current at high volume. Check its I²C address doesn't clash with 0x48.
5. Microphone for "say it back". Record his attempt and play it back, maybe pitch-shifted so it "sounds like Moomin". Use a USB mini mic, because the amp already uses the Pi's I²S audio port. Keep the recordings on the device.