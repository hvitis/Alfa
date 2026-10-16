# Alfa Feature Roadmap & Backlog

This document outlines proposed improvements, educational research, ergonomic toddler-proofing principles, and hardware expansion ideas for Alfa.

For the active interaction model, see [alphabet-plan.md](alphabet-plan.md).
For the current software implementation status, see the [software improvements checklist](software-improvements-checklist.md).

---

## 1. Educational Methodology & Pedagogy

1. **Phonetic Sound Before Letter Name**
   - Teach phonetic sounds before formal letter names (*"Mmm… M jak motyl"*).
   - Maintain three audio clips per letter: the raw phonetic phone, the letter name, and a spoken exemplar word.

2. **Familiar Pictorial Anchors**
   - Anchor letter concepts with common Polish vocabulary (*M* for *most*, *S* for *słońce*, *L* for *las*).
   - Coordinate illustration cards and audio assets so each letter forms a consistent visual and auditory unit.

3. **Curated Letter Progression**
   - Avoid rigid A–Z alphabetical navigation for early learners.
   - Start with letters from the child's name and familiar character names.
   - Introduce new letters gradually as previous ones are mastered.

4. **Call-and-Response Participation**
   - Promote verbal interaction without requiring microphone hardware: play a voice prompt (*"Powiesz ze mną mmm?"*), insert a timed 2-second listening pause, and follow up with praise (*"Mmm! Brawo!"*).

5. **Two-Choice Identification Games**
   - Render two large letter glyphs side-by-side on the display.
   - Audio prompt queries: *"Gdzie jest M?"*; the child selects via LEFT or RIGHT buttons.
   - Gentle, low-frustration error handling without harsh buzzer effects: incorrect choices receive polite phonetic re-anchoring (*"To jest S, jak słońce! Spróbuj jeszcze raz"*).

6. **Adaptive Spaced Repetition**
   - Track letter exposure and response accuracy locally in `.state/`.
   - Surface less frequently heard letters or recently missed items during subsequent sessions.

7. **Clear Full-Screen Typography**
   - Maximize screen real estate with bold, high-contrast letterforms.
   - Assign dedicated color signatures per letter.
   - Focus initially on uppercase forms for early recognition.

8. **Radio Audio Channels**
   - Introduce thematic modes: alphabet lessons, alphabet songs with synchronized letter highlights, and short bedtime story excerpts.

---

## 2. Content Pipeline (Workstation Tools)

The content preparation pipeline runs off-device on a computer rather than the Raspberry Pi:

1. **Automated Vocabulary & Dialogue Extraction**
   - Process source animation audio using transcription engines (e.g., WhisperX) to index timestamps and speaker identifications.
   - Automatically slice clips corresponding to targeted initial letters and identified characters.

2. **Unified Speaker Normalization**
   - Maintain a speaker lookup table (e.g., `SPEAKER_01` → `"Narrator"`) for on-screen speaker indicators and personalized character selections.

3. **Audio Loudness Matching & Conditioning**
   - Apply automated batch normalization via FFmpeg (`loudnorm` filter) with short fade-in/out ramps and silence trimming to prevent sudden volume spikes.

4. **Structured Letter Directory Architecture**
   - Standardize media layout under `media/letters/<LETTER>/` containing:
     - `sound.wav` (phonetic phone)
     - `name.wav` (letter name)
     - `word-*.wav` (word exemplars)
     - `picture.png` (visual card)

5. **Parent Voice Recordings**
   - Provide fallback paths to record and incorporate parent speech for letters lacking clear cartoon clips, strengthening personal connection.

---

## 3. Toddler Ergonomics & Kiosk Hardening

1. **Strict Volume Limits**
   - Enforce digital volume ceilings in software (`audio.max_volume`, default 50%).
   - Decouple volume adjustments from child-accessible keypad buttons during active learning modes.
   - Calibrate sound pressure levels (SPL) at child ear distance (30–50 cm) using a calibrated meter.

2. **Accidental Exit Prevention**
   - Require a sustained 10-second CENTER button hold (`controls.exit_hold_seconds`) during manual development runs.
   - In production kiosk mode (`--standalone`), disable button exits entirely, allowing termination solely via SSH.

3. **Button Mashing & Debounce Guard**
   - Suppress rapid successive button strikes within a 400 ms guard interval (`controls.press_guard_ms`).
   - Treat continuous pressing (sitting on a button) as a single discrete event requiring full release before re-triggering.
   - Allow current tracing and audio clips to complete without abrupt restart loops.

4. **Bedtime Routine & Display Sleep**
   - Implement a 10–15 minute sleep timer concluding with a quiet night greeting.
   - Transition LCD backlight (GPIO24) using PWM dimming to softly reduce brightness before peripheral shutdown.

5. **Kiosk Auto-Boot**
   - Launch application immediately upon power-on via `alfa.service` with an early-boot splash screen (`alfa-splash.service`).

6. **Read-Only SD Card Filesystem (Power-Switch Resilience)**
   - Protect Raspberry Pi OS against filesystem corruption caused by abrupt physical power cuts.
   - Configure a RAM-backed overlay filesystem (`overlayfs`) via `raspi-config`.
   - Direct all temporary logs and runtime files to `tmpfs` (`/run/alfa`).
   - Document a writable maintenance mode workflow for software updates and button recalibration.

7. **Local Companion Web Portal**
   - Serve a lightweight local administrative web interface on the local network.
   - Allow parents to select the active letter set, configure sleep timers, review engagement history, and upload custom audio clips.

---

## 4. Hardware Extensions & Enclosure Engineering

1. **Rotary Tuning Knob**
   - Incorporate a mechanical rotary encoder with detents (e.g., KY-040) mapped to GPIO5, GPIO6, and GPIO13.
   - Provide tactile radio-dial clicks and subtle tuning static effects between letters.
   - Dual-purpose knob as an interactive drawing control.

2. **NFC / RFID Tangible Cards (PN532)**
   - Integrate an I²C RFID reader (PN532 at address `0x24`) sharing the I²C bus with the ADS1115 ADC (`0x48`).
   - Allow children to tap physical letter cards or figurines with embedded NTAG213 tags to immediately load the associated lesson.

3. **Large Illuminated Arcade Buttons**
   - Provide 30 mm tactile arcade buttons wired in parallel with the AD-Key resistive ladder, or mapped directly to GPIO inputs.
   - Distinct physical layout: LEFT placed to the left of the screen, RIGHT to the right, and a prominent CENTER button beneath the window.
   - Illuminate active or prompted buttons using GPIO outputs during interactive questions.

4. **Integrated Battery Management & Safe Shutdown**
   - Integrate a dedicated power management board (e.g., PiSugar 3) with an onboard battery fuel gauge, charging port, and clean shutdown signaling.
   - Ensure supply circuitry handles transient amplifier peaks without brownouts.

5. **Interactive Microphone Input**
   - Connect a compact USB microphone to record short speech attempts and play them back with playful pitch shifts.
   - Keeps all voice data strictly local and offline.

6. **Amplifier Sleep Circuitry**
   - Drive the MAX98357A `SD_MODE` pin via GPIO23.
   - Pulling LOW completely disables amplifier output during idle periods, eliminating idle speaker hiss and conserving power.

7. **Larger Display Module**
   - Evaluate a 2.8-inch ST7789 display (240 × 320) as a direct drop-in software replacement offering larger physical pixels.

---

## 5. Tangible Play & Physical Tokens

1. **Phonetic Word Blender**
   - Tap individual letter tokens sequentially (e.g., *K*, *O*, *T*); the system sounds each letter phonetically and concludes with the blended word (*"K… O… T… KOT!"*) and an on-screen illustration.

2. **Real-World Scavenger Hunt**
   - Affix NFC stickers to household toys and objects.
   - Radio prompts: *"Znajdź coś na literę M"*; child scans the toy to verify (*"Miś zaczyna się na M! Brawo!"*).

3. **Tactile 3D-Printed Letter Tokens**
   - Fabricate 32 tokens with embossed Montessori-style letterforms and embedded internal NFC tags.
   - Safety requirement: Tokens must exceed 45 mm diameter to comply with small-parts child choking hazard safety regulations (exceeding the standard 31.7 mm cylinder test).

4. **Progress Passport Card**
   - Store session milestones and letter discovery counts directly on an NTAG215 tag (504 bytes storage).
   - Allows multi-child profile tracking even when the Pi host runs on a read-only filesystem.

5. **Token Mailbox Slot**
   - Physical enclosure slot where tokens are posted into the radio, triggering playback as they pass an internal optical or NFC sensor before exiting through a rear catch door.
