import os
import re
import shutil
import shlex
import subprocess
import time

from .media import run_tool


class LetterRecordings:
    """Prepared speech; personal recordings can replace individual lesson slots."""
    def __init__(self, catalog, root, player, enabled=True):
        self.catalog, self.root, self.player, self.enabled = catalog, root, player, enabled
        self._repeats = ()
        self._next_repeat = 0

    def preload(self, letters):
        if not self.enabled:
            return
        for letter in letters:
            self.player.preload(self.catalog.audio_path(self.root, letter))
        prefix = self.player.preload(self.root / "media/letter-sounds/prompt.wav") + bytes(2 * 192000)
        self._repeats = tuple(prefix + self.player.preload(self.root / f"media/letter-sounds/praise_{index}.wav")
                              for index in (1, 2))
        self._next_repeat = 0

    def repeat(self):
        if self.enabled and self._repeats:
            self.player.play_pcm(self._repeats[self._next_repeat])
            self._next_repeat = (self._next_repeat + 1) % len(self._repeats)
            return self.player.duration
        return 0

    def play(self, letter):
        path = self.catalog.audio_path(self.root, letter)
        if not self.enabled or not path.is_file():
            return 0
        # StreamingAudioPlayer validates the format and plays the complete file.
        self.player.play(path)
        return self.player.duration


def audio_device(configured="auto", listing=None):
    if configured != "auto":
        return configured
    if listing is None:
        if not shutil.which("aplay"):
            raise RuntimeError("aplay is missing. Install alsa-utils.")
        result = subprocess.run(["aplay", "-l"], capture_output=True, text=True, timeout=10, env={**os.environ, "LC_ALL": "C"})
        listing = result.stdout
        if result.returncode:
            raise RuntimeError(f"Cannot list audio devices: {result.stderr.strip()}")
    matches = []
    for line in listing.splitlines():
        match = re.search(r"card \d+: (\S+) \[.*?\], device (\d+):", line)
        if match and "max98357" in line.lower():
            matches.append(f"plughw:CARD={match[1]},DEV={match[2]}")
    if len(matches) != 1:
        raise ValueError("Cannot identify one MAX98357A sound card. Run aplay -l and set audio.device in config.local.json.")
    return matches[0]


class AudioPlayer:
    def __init__(self, settings, simulate=False, volume=None, device=None, verbose=False, report=None):
        self.settings, self.simulate = settings, simulate
        self.verbose, self.report = verbose, report or print
        self.selected_device, self.last_returncode = None, None
        self.volume = settings.data["audio"]["volume"] if volume is None else volume
        if not 0 <= self.volume <= 1:
            raise ValueError("Volume must be between 0.0 and 1.0.")
        self.configured_device = device or settings.data["audio"]["device"]
        self.process = self.log = None
        self.simulated_until = 0.0
        self.temp = settings.runtime_state / f"playback-{os.getpid()}.wav"
        self.log_path = settings.runtime_state / f"audio-{os.getpid()}.log"

    def play(self, path):
        self.stop()
        self.last_returncode = None
        if self.simulate:
            self.report(f"[simulation] Would play {path.name} at {self.volume:.0%} digital volume.")
            self.simulated_until = time.monotonic() + 0.1
            return
        device = audio_device(self.configured_device)
        self.selected_device = device
        self.settings.runtime_state.mkdir(parents=True, exist_ok=True)
        conversion = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(path), "-af", f"volume={self.volume}", "-c:a", "pcm_s16le", str(self.temp)]
        if self.verbose:
            self.report("Volume conversion: " + shlex.join(conversion))
        run_tool(conversion)
        self.report(f"Playing {path.name} through {device} at {self.volume:.0%} digital volume.")
        self.log = self.log_path.open("w")
        try:
            command = ["aplay", "-v" if self.verbose else "-q", "-D", device, str(self.temp)]
            if self.verbose:
                self.report("Playback command: " + shlex.join(command))
                self.report("ALSA details: " + str(self.log_path))
            self.process = subprocess.Popen(command, stdout=self.log if self.verbose else subprocess.DEVNULL, stderr=self.log)
        except BaseException:
            self.log.close()
            self.log = None
            raise

    @property
    def playing(self):
        if self.simulate:
            return time.monotonic() < self.simulated_until
        if self.process is None:
            return False
        code = self.process.poll()
        if code is None:
            return True
        self.last_returncode = code
        if self.log:
            self.log.close()
            self.log = None
        self.process = None
        if code:
            message = self.log_path.read_text()[-2000:].strip()
            raise RuntimeError(f"Audio playback failed (aplay exit {code}): {message}. Run aplay -l and check audio.device.")
        return False

    def stop(self):
        self.simulated_until = 0.0
        if self.process:
            if self.process.poll() is None:
                self.process.terminate()
                try:
                    self.process.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    self.process.kill()
                    self.process.wait()
            self.process = None
        if self.log:
            self.log.close()
            self.log = None

    def close(self):
        self.stop()
        self.temp.unlink(missing_ok=True)


def scale_pcm16(payload, volume):
    """Scale signed little-endian PCM without changing duration or channel order."""
    from array import array
    import sys
    if volume == 1:
        return payload
    if volume == 0:
        return bytes(len(payload))
    samples = array("h", payload)
    if sys.byteorder != "little":
        samples.byteswap()
    scaled = array("h", (int(value * volume) for value in samples))
    if sys.byteorder != "little":
        scaled.byteswap()
    return scaled.tobytes()


def read_pcm(path):
    import wave
    with wave.open(str(path), "rb") as source:
        if (source.getnchannels(), source.getsampwidth(), source.getframerate(), source.getcomptype()) != (2, 2, 48000, "NONE"):
            raise ValueError("The player needs stereo 48 kHz 16-bit PCM WAV. Run prepare --full-audio.")
        expected = source.getnframes() * 4
        payload = source.readframes(source.getnframes())
        if len(payload) != expected:
            raise ValueError("The recording is truncated.")
    if not payload:
        raise ValueError("The recording contains no audio frames.")
    return payload


def effect_pcm(name):
    """Small deterministic effects, generated once before input starts."""
    import math
    import random
    import struct
    duration = {"whoosh": .075, "pop": .045, "tick": .025}[name]
    count = round(48000 * duration)
    noise = random.Random(42)
    samples = bytearray()
    filtered = 0
    for i in range(count):
        t = i / count
        envelope = math.sin(math.pi * t) ** 2
        if name == "whoosh":
            filtered = .8 * filtered + .2 * noise.uniform(-1, 1)
            value = filtered * .3
        else:
            frequency = 850 - 550 * t if name == "pop" else 1400
            value = math.sin(math.tau * frequency * i / 48000) * (.16 if name == "pop" else .055)
        sample = round(32767 * value * envelope)
        samples.extend(struct.pack("<hh", sample, sample))
    return bytes(samples)


class StreamingAudioPlayer:
    """One warm ALSA stream, with speech and short effects mixed in 10 ms blocks."""
    def __init__(self, settings, simulate=False):
        import threading
        self.settings, self.simulate = settings, simulate
        self.max_volume = settings.data["audio"].get("max_volume", 1)
        self.set_volume(settings.data["audio"]["volume"])
        self.duration = self._started = self._position = 0.0
        self._active = False
        self._process = self._thread = self._log = None
        self._error = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()
        self._speech = b""
        self._cursor = 0
        self._effects = []
        self.effects = {name: effect_pcm(name) for name in ("whoosh", "pop", "tick")}
        self._cache = {}
        self.enabled = True
        self.log_path = settings.runtime_state / f"player-audio-{os.getpid()}.log"

    def set_volume(self, value):
        import math
        if not math.isfinite(value) or not 0 <= value <= 1:
            raise ValueError("Volume must be between 0.0 and 1.0.")
        self.volume = min(value, self.max_volume)

    def preload(self, path):
        key = str(path)
        if key not in self._cache:
            self._cache[key] = read_pcm(path)
        return self._cache[key]

    def start(self):
        import threading
        if self.simulate or not self.enabled or self._process is not None:
            return
        device = audio_device(self.settings.data["audio"]["device"])
        self.settings.runtime_state.mkdir(parents=True, exist_ok=True)
        self._log = self.log_path.open("w")
        try:
            self._process = subprocess.Popen(
                ["aplay", "-q", "-D", device, "-t", "raw", "-f", "S16_LE",
                 "-r", "48000", "-c", "2", "--buffer-time=20000", "--period-time=10000"],
                stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=self._log, bufsize=0)
            # Bound Linux pipe buffering to ~21 ms, instead of a possible 340 ms.
            import fcntl
            if hasattr(fcntl, "F_SETPIPE_SZ") and hasattr(self._process.stdin, "fileno"):
                fcntl.fcntl(self._process.stdin.fileno(), fcntl.F_SETPIPE_SZ, 4096)
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._stream, args=(self._process,), daemon=True)
            self._thread.start()
        except BaseException:
            self.close()
            raise

    def play(self, path):
        self.play_pcm(self.preload(path))

    def play_pcm(self, payload):
        if not self.enabled:
            return
        self.start()
        with self._lock:
            self._speech, self._cursor = payload, 0
            self.duration = len(payload) / 192000
            self._started = time.monotonic()
            self._position = 0.0
            self._active = bool(payload)

    def effect(self, name):
        if not self.enabled:
            return
        self.start()
        with self._lock:
            # Keep effects bounded even during sustained button mashing.
            self._effects = self._effects[-7:] + [(self.effects[name], 0)]

    def _mix_block(self, frames=480):
        from array import array
        import sys
        size = frames * 4
        def samples(payload):
            result = array("h", payload)
            if sys.byteorder != "little":
                result.byteswap()
            return result
        with self._lock:
            chunk = self._speech[self._cursor:self._cursor + size]
            self._cursor += len(chunk)
            output = samples(chunk.ljust(size, b"\0"))
            following = []
            for payload, cursor in self._effects:
                for i, value in enumerate(samples(payload[cursor:cursor + size])):
                    # Speech gets headroom only while an effect is present.
                    output[i] = max(-32768, min(32767, round(output[i] * .75 + value)))
                cursor += size
                if cursor < len(payload):
                    following.append((payload, cursor))
            self._effects = following
            if self._active and self._cursor >= len(self._speech):
                self._active = False
                self._position = self.duration
            volume = self.volume
        if sys.byteorder != "little":
            output.byteswap()
        return scale_pcm16(output.tobytes(), volume)

    def _stream(self, process):
        try:
            while not self._stop_event.is_set():
                code = process.poll()
                if code is not None:
                    raise RuntimeError(f"aplay exit {code}")
                remaining = memoryview(self._mix_block())
                while remaining and not self._stop_event.is_set():
                    written = process.stdin.write(remaining)
                    if not written:
                        raise RuntimeError("The audio stream stopped accepting samples.")
                    remaining = remaining[written:]
        except Exception as error:
            if not self._stop_event.is_set():
                detail = self.log_path.read_text(errors="replace")[-2000:].strip()
                self._error = RuntimeError(f"Audio playback failed: {error}. {detail}")
        finally:
            try:
                process.stdin.close()
            except OSError:
                pass

    @property
    def playing(self):
        if self._error:
            raise self._error
        code = self._process.poll() if self._process else None
        if code is not None:
            detail = self.log_path.read_text(errors="replace")[-2000:].strip()
            raise RuntimeError(f"Audio playback failed (aplay exit {code}): {detail}")
        if self.simulate and self._active and time.monotonic() - self._started >= self.duration:
            self._active = False
            self._position = self.duration
        return self._active

    @property
    def position(self):
        return min(self.duration, max(0, time.monotonic() - self._started)) if self.playing else self._position

    def stop(self):
        """Cancel speech without closing ALSA or silencing button effects."""
        with self._lock:
            self._speech, self._cursor = b"", 0
            self._active = False
            self._position = 0.0

    def silence(self):
        self.stop()
        with self._lock:
            self._effects.clear()

    def close(self):
        self._stop_event.set()
        if self._process and self._process.poll() is None:
            self._process.terminate()
            try:
                self._process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self._process.kill()
                self._process.wait()
        if self._thread:
            self._thread.join(timeout=3)
            if self._thread.is_alive():
                raise RuntimeError("The audio worker did not stop.")
        if self._log:
            self._log.close()
        self._process = self._thread = self._log = None
        self.silence()
        self._cache.clear()
