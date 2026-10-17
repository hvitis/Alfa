"""Behavioral checks for the toddler alphabet, including input while output is busy."""
import copy
import hashlib
import io
import json
import struct
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from PIL import Image, ImageChops

from app.app import run_gallery
from app.animation import CharacterAnimation
from app.audio import LetterRecordings, StreamingAudioPlayer, read_pcm
from app.config import ROOT, Settings
from app.engagement import CardMotion, HoldClock, IdlePlay
from app.hardware import Amplifier, LatestDisplay, ST7789
from app.letter_lesson import LetterLesson
from app.letter_paths import LetterCatalog
from app.player import PlayerSession


class EngagementTests(unittest.TestCase):
    def setUp(self):
        self.now = 0.0
        self.clock = lambda: self.now
        self.settings = Settings.load(ROOT / 'config.json')
        self.catalog = LetterCatalog(ROOT / 'assets/letter-drawing/letters.json')
        self.audio = StreamingAudioPlayer(self.settings, simulate=True)
        self.addCleanup(self.audio.close)
        self.paths = [ROOT / 'media/alphabet' / name for name in ('000-00-A.png', '002-02-B.png')]

    def session(self):
        session = PlayerSession(self.paths, [], self.audio, fullscreen=True)
        session.hold_clock = HoldClock(self.clock)
        session.drawing = LetterLesson(self.catalog, clock=session.hold_clock, celebration_clock=self.clock)
        session.card_motion = CardMotion(self.clock)
        session.animation = CharacterAnimation(ROOT / 'media/animations', clock=self.clock)
        session.letter_recordings = LetterRecordings(self.catalog, ROOT, self.audio)
        session.letter_recordings.preload(['A', 'B'])
        return session

    def test_trace_pauses_and_resumes_without_restarting_and_other_actions_cancel(self):
        session = self.session()
        session.action('draw')
        self.now = 1.2
        state = session.drawing.state()
        session.release('center')
        self.now = 50
        self.assertEqual(session.drawing.state(), state)
        session.action('draw')
        self.now = 51
        self.assertNotEqual(session.drawing.state(), state)
        self.assertEqual(session.drawing.serial, 1)
        session.action('right')
        self.assertIsNone(session.drawing.active)
        self.assertIsNone(session.hold_clock.since)
        session.action('draw')
        self.assertEqual(session.drawing.active, 'B')
        self.assertEqual(session.drawing.serial, 2)

    def test_navigation_and_taps_play_the_selected_recording_from_the_start(self):
        session = self.session()
        with patch('app.audio.read_pcm', side_effect=AssertionError('Use preloaded letter audio')):
            for button, letter in [('right', 'B'), ('right', 'A'), ('left', 'B'), ('left', 'A')]:
                session.action(button)
                self.assertEqual(self.audio._speech, self.audio.preload(self.catalog.audio_path(ROOT, letter)))
                self.audio._mix_block()
                self.assertGreater(self.audio._cursor, 0)
                session.action('center')
                self.assertEqual(self.audio._cursor, 0)
                self.assertTrue(self.audio.playing)
                self.assertIsNone(session.drawing.active)
                self.assertEqual(session.last_action, 'Listen')
                self.assertEqual(self.audio.volume, .2)

    def test_tap_cancels_paused_drawing_and_muted_navigation_stays_silent(self):
        session = self.session()
        session.action('draw')
        self.now = 1
        session.release('center')
        session.action('center')
        self.assertIsNone(session.drawing.active)
        self.assertIsNone(session.hold_clock.since)
        self.assertEqual(session.frame().tobytes(), session.card().tobytes())
        session.letter_recordings.enabled = False
        session.action('right')
        self.assertFalse(self.audio.playing)
        session.action('center')
        self.assertFalse(self.audio.playing)

    def test_characters_slide_in_as_still_frames_then_start_their_own_voice_and_animation(self):
        session = self.session()
        for button, clip, speech in [('up', 'speaking', 'prompt'), ('down', 'clapping', 'praise_2')]:
            card = session.card()
            with patch('app.player.random.choice', return_value='clapping'):
                session.action(button)
            self.assertFalse(self.audio.playing, 'Voice must wait until the slide finishes')
            self.assertIsNone(session.animation.active)
            self.assertIsNone(session.drawing.active)
            self.assertEqual(session.card_motion.direction, button)
            self.assertEqual(session.frame().tobytes(), card.tobytes())
            self.now += .14
            first = session.animation.first_frame(clip)
            expected = Image.new('RGB', card.size, '#fffdf5')
            offset = -160 if button == 'up' else 160
            expected.paste(card, (0, -offset))
            expected.paste(first, (0, offset))
            self.assertEqual(session.frame().tobytes(), expected.tobytes())
            self.assertFalse(self.audio.playing)
            self.assertIsNone(session.animation.active)
            self.now += .15
            session.render_key()
            self.assertEqual(session.animation.active, clip)
            self.assertEqual(session.animation.index(), 0)
            self.assertEqual(self.audio._speech, read_pcm(ROOT / f'media/letter-sounds/{speech}.wav'))
            self.assertEqual(session.frame().tobytes(), first.tobytes())
            self.assertGreaterEqual(session.animation.duration, self.audio.duration)
            self.assertEqual(self.audio.volume, .2)
            self.now += session.animation.duration + .01
            self.assertEqual(session.frame().tobytes(), card.tobytes())
            self.assertEqual(session.gallery.index, 0)
            session.action('right')
            self.now += .3
            session.frame()
            session.action('left')
            self.now += .3
            session.frame()
        session.action('right')
        self.assertEqual(self.audio._speech, read_pcm(self.catalog.audio_path(ROOT, 'B')))

    def test_down_randomly_selects_a_fixed_character_voice_pair_once_per_completed_action(self):
        session = self.session()
        praises = {name: read_pcm(ROOT / f'media/letter-sounds/praise_{index}.wav')
                   for name, index in [('hemulen', 1), ('clapping', 2)]}
        self.assertNotEqual(praises['hemulen'], praises['clapping'])
        # Consecutive duplicates are valid random choices; the old sequence alternated.
        choices = ['hemulen', 'clapping', 'clapping', 'hemulen']
        with patch('app.audio.read_pcm', side_effect=AssertionError('Playback must use preloaded audio')), \
             patch('app.player.random.choice', side_effect=choices) as choose:
            for count, name in enumerate(choices, 1):
                session.action('down')
                self.assertEqual(choose.call_count, count)
                self.assertEqual(set(choose.call_args.args[0]), {'hemulen', 'clapping'})
                self.assertEqual(session.pending_character, (name, 'down'))
                session.action('down')
                self.assertEqual(choose.call_count, count, 'A pending slide must not reroll')
                self.now += .3
                session.render_key()
                self.assertEqual(session.animation.active, name)
                self.assertEqual(self.audio._speech, praises[name])
                self.assertAlmostEqual(self.audio.duration, len(self.audio._speech) / 192000)
                serial = session.animation.serial
                session.action('down')
                self.assertEqual(choose.call_count, count, 'An active animation must not reroll')
                self.assertEqual(session.animation.serial, serial)
                self.assertEqual(self.audio._speech, praises[name])
                self.now += session.animation.duration + .01
                session.render_key()

    def test_muted_down_still_randomly_selects_both_animations_and_restores_the_card(self):
        session = self.session()
        session.letter_recordings.enabled = False
        with patch('app.player.random.choice', side_effect=['hemulen', 'clapping']):
            for name in ('hemulen', 'clapping'):
                session.action('down')
                self.now += .3
                session.render_key()
                self.assertEqual(session.animation.active, name)
                self.assertFalse(self.audio.playing)
                self.now += session.animation.duration + .01
                self.assertEqual(session.frame().tobytes(), session.card().tobytes())

    def test_navigation_and_center_cancel_pending_character_and_its_delayed_voice(self):
        session = self.session()
        for button in ('left', 'right', 'center'):
            session.action('up')
            self.assertIsNotNone(session.pending_character)
            session.action(button)
            self.now += .4
            session.render_key()
            self.assertIsNone(session.pending_character)
            self.assertIsNone(session.animation.active)
            letter = session.drawing.catalog.letter_for_image(session.gallery.paths[session.gallery.index])
            self.assertEqual(self.audio._speech, read_pcm(self.catalog.audio_path(ROOT, letter)))
            self.assertIsNone(session.drawing.active)

    def test_fireworks_finish_after_center_is_released_at_the_final_stroke(self):
        session = self.session()
        session.action('draw')
        self.now = session.drawing.draw_end + .001
        session.release('center')
        held_time = session.hold_clock()
        self.assertEqual(session.drawing.state()[0], 'hold')
        self.now += session.drawing.hold_seconds + .1
        self.assertEqual(session.drawing.state()[0], 'celebrate')
        first = session.drawing.render_key()
        self.now += .1
        self.assertNotEqual(session.drawing.render_key(), first)
        self.assertEqual(session.hold_clock(), held_time)
        self.now += session.drawing.celebration_seconds
        self.assertEqual(session.frame().tobytes(), session.card().tobytes())
        self.assertIsNone(session.drawing.active)

    def test_card_enters_from_the_button_direction_and_returns_to_the_exact_card(self):
        old = Image.new('RGB', (100, 100), 'red')
        new = Image.new('RGB', (100, 100), 'blue')
        for direction, point in [('right', (99, 50)), ('left', (0, 50)),
                                 ('up', (50, 0)), ('down', (50, 99))]:
            self.now = 0
            motion = CardMotion(self.clock, duration=1)
            motion.start(old, new, direction)
            self.now = .25
            self.assertEqual(motion.frame().getpixel(point), (0, 0, 255))
            self.assertEqual(motion.frame().getpixel((50, 50)), (255, 0, 0))
            self.now = 1
            self.assertIsNone(motion.frame())
            self.assertFalse(motion.active)

    def test_every_accepted_and_guarded_press_has_an_effect(self):
        session = self.session()
        with patch.object(self.audio, 'effect') as effect:
            for button, expected in [('left', 'whoosh'), ('right', 'whoosh'), ('center', 'pop'), ('up', 'tick'), ('down', 'tick')]:
                session.feedback(button)
                effect.assert_called_with(expected)
                session.feedback(button, accepted=False)
                effect.assert_called_with('tick')

    def test_mixer_adds_effect_without_restarting_speech_and_stop_keeps_the_effect(self):
        speech = struct.pack('<hh', 10000, -10000) * 4800
        self.audio.play_pcm(speech)
        started = self.audio._started
        self.audio._mix_block()
        self.audio.effect('pop')
        block = self.audio._mix_block()
        self.assertNotEqual(block, struct.pack('<hh', 2000, -2000) * 480)
        self.assertEqual(self.audio._cursor, 3840)
        self.assertEqual(self.audio._started, started)
        self.assertTrue(self.audio.playing)
        self.audio.stop()
        self.assertNotEqual(self.audio._mix_block(), bytes(1920))
        self.audio.silence()
        self.assertEqual(self.audio._mix_block(), bytes(1920))
        # All concurrent effects stay bounded and cannot overflow PCM or the volume cap.
        self.audio.set_volume(1)
        for _ in range(100):
            self.audio.effect('pop')
        self.assertEqual(len(self.audio._effects), 8)
        samples = struct.unpack('<960h', self.audio._mix_block())
        self.assertLessEqual(max(map(abs, samples)), 16384)

    def test_one_stream_survives_speech_changes_effects_and_silence(self):
        audio = StreamingAudioPlayer(self.settings)
        self.addCleanup(audio.close)
        writing, release = threading.Event(), threading.Event()
        class Pipe:
            def write(self, payload):
                writing.set()
                release.wait(2)
                return len(payload)
            def close(self): pass
        process = Mock(stdin=Pipe())
        process.poll.return_value = None
        process.terminate.side_effect = lambda: (process.poll.configure_mock(return_value=0), release.set())
        with patch('app.audio.audio_device', return_value='test'), patch('app.audio.subprocess.Popen', return_value=process) as spawn:
            audio.start()
            self.assertTrue(writing.wait(1))
            audio.play(self.catalog.audio_path(ROOT, 'A'))
            audio.effect('whoosh')
            audio.stop()
            audio.play(self.catalog.audio_path(ROOT, 'B'))
            self.assertEqual(spawn.call_count, 1)
            process.terminate.assert_not_called()
            self.assertIn('--buffer-time=20000', spawn.call_args.args[0])
            audio.close()

    def test_idle_invites_once_then_sleeps_and_any_touch_wakes(self):
        display, amplifier = Mock(), Mock()
        idle = IdlePlay(display, self.audio, amplifier, clock=self.clock)
        self.now = 20
        idle.update()
        self.assertTrue(idle.peeking)
        self.now = 21
        card = Image.new('RGB', (240, 320), 'white')
        card.paste(Image.new('RGB', (240, 160), 'blue'), (0, 160))
        card.paste(Image.new('RGB', (80, 80), 'yellow'), (80, 180))
        card.paste(Image.new('RGB', (80, 80), 'red'), (160, 20))
        self.assertIsNotNone(ImageChops.difference(idle.frame(card), card).getbbox())
        self.assertEqual(idle.frame(card).getpixel((220, 220)), (255, 0, 0), 'The peek includes the face area')
        self.now = 24
        idle.update()
        self.assertFalse(idle.peeking)
        self.audio.effect('pop')
        self.now = 300
        idle.update()
        self.assertTrue(idle.sleeping)
        self.assertEqual(self.audio._effects, [])
        display.set_awake.assert_called_once_with(False)
        amplifier.set_awake.assert_called_once_with(False)
        self.now = 86400
        idle.touch()
        self.assertFalse(idle.sleeping)
        display.set_awake.assert_called_with(True)
        amplifier.set_awake.assert_called_with(True)
        self.now += 20
        idle.update(held=True)
        self.assertFalse(idle.peeking, 'Holding the pencil is activity')

    def test_settings_selection_is_validated_and_reloaded_on_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = json.loads((ROOT / 'config.json').read_text())
            path = root / 'config.json'
            for letters in (['Ż', 'A'], 'all', ['M']):
                data['lesson']['letters'] = letters
                path.write_text(json.dumps(data))
                self.assertEqual(Settings.load(root=root).data['lesson']['letters'], letters)
            for letters in ([], ['A', 'A'], ['a'], ['Q'], None, [True], 'ABC'):
                data['lesson']['letters'] = letters
                path.write_text(json.dumps(data))
                with self.assertRaises(ValueError):
                    Settings.load(root=root)
            for key, value in [('shutdown_pin', 24), ('shutdown_pin', True), ('shutdown_pin', 18)]:
                bad = Settings(ROOT, copy.deepcopy(self.settings.data))
                bad.data['audio'][key] = value
                with self.assertRaises(ValueError): bad.validate()

    def test_all_bundled_audio_is_complete_audible_and_has_provenance(self):
        manifest = json.loads((ROOT / 'media/letter-sounds/manifest.json').read_text())['recordings']
        self.assertEqual(set(manifest), set(self.catalog.letters) | {'prompt', 'praise_1', 'praise_2'})
        personal = []
        for name, item in manifest.items():
            path = ROOT / item['file']
            pcm = read_pcm(path)
            self.assertTrue(any(pcm), name)
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), item['sha256'])
            if item['source'].startswith('sounds/'):
                personal.append(name)
        self.assertEqual(set(personal), set('ABCDEFGHIJK'))

    def test_startup_filters_cards_in_settings_order_and_keeps_all_available(self):
        sessions = []
        class Session(PlayerSession):
            def __init__(self, *args):
                super().__init__(*args)
                sessions.append(self)
        for selected, expected in [(['B', 'A'], ['B', 'A']), ('all', list(self.catalog.letters))]:
            self.settings.data['lesson']['letters'] = selected
            with patch('app.app.PlayerSession', Session):
                run_gallery(self.settings, simulate=True, no_audio=True, prepared_only=True, once=True)
            self.assertEqual([self.catalog.letter_for_image(path) for path in sessions[-1].gallery.paths], expected)
        self.settings.data['lesson']['letters'] = ['Ż']
        with patch('app.app.prepare_images', return_value=self.paths):
            with self.assertRaisesRegex(ValueError, 'no prepared cards: Ż'):
                run_gallery(self.settings, simulate=True, no_audio=True, once=True)

    def test_slow_display_does_not_block_input_and_drops_only_obsolete_frames(self):
        entered, release = threading.Event(), threading.Event()
        shown = []
        class Display:
            def show(self, frame):
                shown.append(frame.getpixel((0, 0)))
                entered.set()
                release.wait(2)
        output = LatestDisplay(Display())
        try:
            output.show(Image.new('RGB', (10, 10), 'red'))
            self.assertTrue(entered.wait(1))
            started = time.monotonic()
            output.show(Image.new('RGB', (10, 10), 'blue'))
            output.show(Image.new('RGB', (10, 10), 'green'))
            self.assertLess(time.monotonic() - started, .05)
            self.assertEqual(shown, [(255, 0, 0)])
        finally:
            release.set()
            output.close()
        self.assertEqual(shown, [(255, 0, 0), (0, 128, 0)])

    def test_backlight_and_amplifier_use_peripheral_control_only(self):
        display = ST7789.__new__(ST7789)
        display.backlight = Mock()
        display.set_awake(False)
        display.backlight.off.assert_called_once()
        display.set_awake(True)
        display.backlight.on.assert_called_once()
        amplifier = Amplifier.__new__(Amplifier)
        amplifier.pin = Mock()
        amplifier.set_awake(False)
        amplifier.pin.off.assert_called_once()
        amplifier.set_awake(True)
        amplifier.pin.on.assert_called_once()
        amplifier.close()
        amplifier.pin.close.assert_called_once()

    def test_display_worker_failure_reaches_the_main_loop(self):
        display = Mock()
        display.show.side_effect = OSError('SPI disconnected')
        output = LatestDisplay(display)
        output.show(Image.new('RGB', (10, 10)))
        output.worker.join(1)
        self.assertFalse(output.worker.is_alive())
        with self.assertRaisesRegex(OSError, 'SPI disconnected'):
            output.check()
        with self.assertRaisesRegex(OSError, 'SPI disconnected'):
            output.close()

    def test_real_loop_ignores_guarded_tap_and_wakes_with_the_requested_action(self):
        self.settings.data['lesson']['letters'] = ['A', 'B']
        script = iter([(0, None), (.1, ('press', 'center')), (.2, ('release', 'center')),
                       (.25, ('press', 'center')), (.3, ('release', 'center')),
                       (20.4, None), (300.4, None), (301, ('press', 'up'))])
        sessions, snapshots = [], []
        event = [None]
        outer = self
        class Keyboard:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self):
                if sessions:
                    session = sessions[0]
                    snapshots.append((outer.now, session.hold_clock(), session.idle.sleeping, session.idle.peeking))
                try:
                    outer.now, event[0] = next(script)
                except StopIteration:
                    raise KeyboardInterrupt
                return ''
        class Session(PlayerSession):
            def __init__(self, *args):
                super().__init__(*args)
                sessions.append(self)
        debounce = Mock()
        debounce.update.side_effect = lambda *_: event[0]
        display = Mock(spec=['show', 'close', 'set_awake'])
        with patch('app.app.prepare_images', return_value=self.paths), patch('app.app.display_resource', return_value=display), \
             patch('app.app.adc_resource', return_value=Mock()), patch('app.app.load_calibration', return_value={}), \
             patch('app.app.classify', return_value='center'), patch('app.app.Debouncer', return_value=debounce), \
             patch('app.app.StreamingAudioPlayer', return_value=self.audio), patch('app.app.PlayerSession', Session), \
             patch('app.app.Keyboard', Keyboard), patch('app.app.time.monotonic', side_effect=self.clock), \
             patch('app.app.time.sleep'), patch.object(self.audio, 'effect', wraps=self.audio.effect) as effect:
            with self.assertRaises(KeyboardInterrupt):
                run_gallery(self.settings, standalone=True)
        self.assertAlmostEqual(snapshots[5][1], 0)
        self.assertIn((20.4, 0, False, True), [(t, round(c, 2), s, p) for t, c, s, p in snapshots])
        self.assertTrue(any(sleeping for _, _, sleeping, _ in snapshots))
        self.assertEqual(sessions[0].last_action, 'Which letter?')
        self.assertEqual(sessions[0].drawing.serial, 0)
        self.assertEqual([call.args[0] for call in effect.call_args_list], ['pop', 'tick', 'tick'])
        display.set_awake.assert_any_call(False)
        display.set_awake.assert_any_call(True)


if __name__ == '__main__':
    unittest.main()
