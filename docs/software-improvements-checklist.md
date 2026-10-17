# Software Improvements & Verification Checklist

Implementation and verification tracking for Alfa's core interaction updates.
For interaction specifications, see [alphabet-plan.md](alphabet-plan.md). For long-term roadmap items, see [improvements-todo.md](improvements-todo.md).

---

## 1. Core Feature Implementation

- [x] **Continuous ALSA Audio Streaming & Mixing**
  - Keeps one ALSA stream open to eliminate clicks and latency.
  - Mixes navigation sounds, tracing clicks, and guarded press audio in 10 ms blocks without interrupting spoken clips.
  - Implemented in [`app/audio.py`](../app/audio.py).

- [x] **Complete Polish Phonetic Voice Set**
  - Converted existing master recordings for letters A through K.
  - Synthesized remaining 21 Polish letters locally using Piper (`pl_PL-gosia-medium`).
  - Preloaded and normalized in [`media/letter-sounds/`](../media/letter-sounds/README.md).

- [x] **Interactive Call-and-Response Flow (DOWN Button)**
  - Prompts with *"Powiesz ze mną?"*, pauses for 2 seconds to allow speech, then plays encouraging praise.
  - Implemented in [`app/engagement.py`](../app/engagement.py) and [`app/player.py`](../app/player.py).

- [x] **Hold-to-Draw Tracing Physics (CENTER Button)**
  - Tracing animation clock advances strictly while CENTER is held.
  - Pauses immediately on release; subsequent press resumes from exact progress point.
  - Completed trace triggers celebration fireworks before restoring card.
  - Implemented in [`app/player.py`](../app/player.py).

- [x] **Deterministic Single-Action Keypad Controls**
  - Dedicated function per button: LEFT/RIGHT (card transition), UP (listen sound/word), DOWN (speak & praise), CENTER (hold-to-draw).
  - Directional sliding transitions replace generic looping character animations.
  - Implemented in [`app/player.py`](../app/player.py).

- [x] **Dynamic Letter Selection Profile**
  - Loads letter subset from `lesson.letters` in [`config.json`](../config.json) on startup (e.g. child's name or active focus letters).
  - Supports `"all"` for full 32-letter navigation.
  - Implemented in [`app/config.py`](../app/config.py) and [`app/player.py`](../app/player.py).

- [x] **Gentle Idle Character Invitation**
  - Displays a subtle visual peek after 20 seconds of inactivity to re-engage attention without sudden audio.
  - Implemented in [`app/engagement.py`](../app/engagement.py).

- [x] **Peripheral Power Saving & Sleep Mode**
  - Powers down display backlight (GPIO24) and silences MAX98357A amplifier via SD pin (GPIO23) after 5 minutes idle.
  - Preserves system state; instantly wakes on any physical button press.
  - Implemented in [`app/hardware.py`](../app/hardware.py) and [`app/player.py`](../app/player.py).

---

## 2. Automated Software Verification

- [x] **Regression & Unit Test Suite**
  - Audio mixer sample rate, buffering, and concurrent playback tests.
  - Hold/pause/resume state machine tests for tracing.
  - Keypad guard intervals and debouncing.
  - Idle timeout, invitation trigger, and wake-up transitions.
  - Letter profile loading, validation, and error handling.
  - Validated across test suites in [`tests/test_engagement.py`](../tests/test_engagement.py), [`tests/test_player.py`](../tests/test_player.py), [`tests/test_standalone.py`](../tests/test_standalone.py), and [`tests/test_toddler_controls.py`](../tests/test_toddler_controls.py).

- [x] **Repository & Packaging Integrity**
  - Clean configuration, bilingual documentation check, and credential scans verified with `scripts/check_repo.py`.

---

## 3. Physical Bench Verification (Hardware)

The following physical checks require the assembled Raspberry Pi 3 hardware:

- [ ] Measure acoustic loudness at child ear distance (30–50 cm) to verify `audio.max_volume` limit.
- [ ] Measure cold-boot splash to first letter card latency on physical Pi.
- [ ] Measure audio-to-button response latency with oscilloscope or audio probe (~100 ms target).
- [ ] Verify physical amplifier sleep (zero audible hiss on GPIO23 LOW).
- [ ] Long-duration closed-enclosure thermal test under continuous audio and display playback.
