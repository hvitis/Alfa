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
        self.settings = Settings.load(ROOT / 'config.alphabet.json')
        self.catalog = LetterCatalog(ROOT / 'assets/letter-drawing/letters.json')
        self.audio = StreamingAudioPlayer(self.settings, simulate=True)
        self.addCleanup(self.audio.close)
        self.paths = [ROOT / 'media/alphabet' / name for name in ('000-00-A.png', '002-02-B.png')]

    def session(self):
        session = PlayerSession(self.paths, [], self.audio, fullscreen=True)
        session.hold_clock = HoldClock(self.clock)
        session.drawing = LetterLesson(self.catalog, clock=session.hold_clock)
        session.card_motion = CardMotion(self.clock)
        session.letter_recordings = LetterRecordings(self.catalog, ROOT, self.audio)
        session.letter_recordings.preload(['A', 'B'])
        return session

    def test_trace_pauses_and_resumes_without_restarting_and_other_actions_cancel(self):
        session = self.session()
        session.action('center')
        self.now = 1.2
        state = session.drawing.state()
        session.release('center')
        self.now = 50
        self.assertEqual(session.drawing.state(), state)
        session.action('center')
        self.now = 51
        self.assertNotEqual(session.drawing.state(), state)
        self.assertEqual(session.drawing.serial, 1)
        session.action('right')
        self.assertIsNone(session.drawing.active)
        self.assertIsNone(session.hold_clock.since)
        session.action('center')
        self.assertEqual(session.drawing.active, 'B')
        self.assertEqual(session.drawing.serial, 2)

    def test_up_and_down_always_play_their_own_audio_and_do_not_change_volume(self):
        session = self.session()
        for prior in ('center', 'up', 'down', 'right'):
            session.action(prior)
            session.action('up')
            letter = self.catalog.letter_for_image(session.gallery.paths[session.gallery.index])
            self.assertEqual(self.audio._speech, read_pcm(self.catalog.audio_path(ROOT, letter)))
            self.assertIsNone(session.drawing.active)
            self.assertEqual(session.card_motion.direction, 'up')
            session.action('down')
            prompt = read_pcm(ROOT / 'media/letter-sounds/prompt.wav')
            praises = [read_pcm(ROOT / f'media/letter-sounds/praise_{index}.wav') for index in (1, 2)]
            self.assertIn(self.audio._speech, [prompt + bytes(384000) + praise for praise in praises])
            self.assertEqual(session.card_motion.direction, 'down')
            self.assertEqual(self.audio.volume, .2)
        session.action('right')
        self.assertFalse(self.audio.playing, 'Changing letters cancels queued praise')

    def test_repeat_alternates_preloaded_praises_with_the_full_response_pause(self):
        session = self.session()
        prefix = read_pcm(ROOT / 'media/letter-sounds/prompt.wav') + bytes(384000)
        praises = [read_pcm(ROOT / f'media/letter-sounds/praise_{index}.wav') for index in (1, 2)]
        self.assertNotEqual(praises[0], praises[1])
        with patch('app.audio.read_pcm', side_effect=AssertionError('Playback must use preloaded audio')):
            for index in (0, 1, 0, 1):
                session.action('down')
                self.assertEqual(self.audio._speech, prefix + praises[index])
                self.assertAlmostEqual(self.audio.duration, len(self.audio._speech) / 192000)

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
            (root / 'config.json').write_text((ROOT / 'config.json').read_text())
            path = root / 'settings.json'
            for letters in (['Ż', 'A'], 'all', ['M']):
                path.write_text(json.dumps({'letters': letters}))
                self.assertEqual(Settings.load(root=root).data['lesson']['letters'], letters)
            for letters in ([], ['A', 'A'], ['a'], ['Q'], None, [True], 'ABC'):
                path.write_text(json.dumps({'letters': letters}))
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

    def test_real_loop_resumes_guarded_hold_and_wakes_with_the_requested_action(self):
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
        self.assertAlmostEqual(snapshots[5][1], .15)
        self.assertIn((20.4, .15, False, True), [(t, round(c, 2), s, p) for t, c, s, p in snapshots])
        self.assertTrue(any(sleeping for _, _, sleeping, _ in snapshots))
        self.assertEqual(sessions[0].last_action, 'Listen')
        self.assertEqual(sessions[0].drawing.serial, 1)
        self.assertEqual([call.args[0] for call in effect.call_args_list], ['pop', 'tick', 'tick'])
        display.set_awake.assert_any_call(False)
        display.set_awake.assert_any_call(True)


if __name__ == '__main__':
    unittest.main()
