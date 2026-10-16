import os
import re
import shutil
import shlex
import subprocess
import time

from .media import run_tool


class LetterRecordings:
    """Optional per-letter PCM recordings; absent files are silent placeholders."""
    def __init__(self, catalog, root, player, enabled=True):
        self.catalog, self.root, self.player, self.enabled = catalog, root, player, enabled

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


class StreamingAudioPlayer:
    """Feed short PCM blocks to ALSA so volume can change during playback."""
    def __init__(self, settings, simulate=False):
        import threading
        self.settings, self.simulate = settings, simulate
        self.max_volume = settings.data["audio"].get("max_volume", 1)
        self.volume = settings.data["audio"]["volume"]
        self.set_volume(self.volume)
        self.duration = self._started = self._position = 0.0
        self._active = False
        self._process = self._thread = self._log = None
        self._error = None
        self._stop_event = threading.Event()
        self._device = None
        self.log_path = settings.runtime_state / f"player-audio-{os.getpid()}.log"

    def set_volume(self, value):
        import math
        if not math.isfinite(value) or not 0 <= value <= 1:
            raise ValueError("Volume must be between 0.0 and 1.0.")
        # Toddler ears: requests above the configured cap stop at the cap.
        self.volume = min(value, self.max_volume)

    def play(self, path):
        import threading
        import wave
        self.stop()
        with wave.open(str(path), "rb") as source:
            if (source.getnchannels(), source.getsampwidth(), source.getframerate(), source.getcomptype()) != (2, 2, 48000, "NONE"):
                raise ValueError("The player needs stereo 48 kHz 16-bit PCM WAV. Run prepare --full-audio.")
            self.duration = source.getnframes() / source.getframerate()
            if self.duration <= 0:
                raise ValueError("The recording contains no audio frames.")
        self._error = None
        self._position = 0.0
        self._stop_event.clear()
        self._started = time.monotonic()
        if self.simulate:
            self._active = True
            return
        self._device = self._device or audio_device(self.settings.data["audio"]["device"])
        self.settings.runtime_state.mkdir(parents=True, exist_ok=True)
        self._log = self.log_path.open("w")
        try:
            self._process = subprocess.Popen(
                ["aplay", "-q", "-D", self._device, "-t", "raw", "-f", "S16_LE",
                 "-r", "48000", "-c", "2", "--buffer-time=100000"],
                stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=self._log, bufsize=0)
            self._active = True
            self._started = time.monotonic()
            self._thread = threading.Thread(target=self._stream, args=(path, self._process), daemon=True)
            self._thread.start()
        except BaseException:
            self.stop()
            raise

    def _stream(self, path, process):
        import wave
        try:
            with wave.open(str(path), "rb") as source:
                while not self._stop_event.is_set():
                    payload = source.readframes(480)
                    if not payload:
                        break
                    remaining = memoryview(scale_pcm16(payload, self.volume))
                    while remaining and not self._stop_event.is_set():
                        written = process.stdin.write(remaining)
                        if not written:
                            raise RuntimeError("The audio stream stopped accepting samples.")
                        remaining = remaining[written:]
            process.stdin.close()
            code = process.wait(timeout=self.duration + 5)
            if code and not self._stop_event.is_set():
                message = self.log_path.read_text(errors="replace")[-2000:].strip()
                raise RuntimeError(f"Audio playback failed (aplay exit {code}): {message}")
            if not self._stop_event.is_set():
                self._position = self.duration
        except Exception as error:
            if not self._stop_event.is_set():
                detail = self.log_path.read_text(errors="replace")[-2000:].strip()
                self._error = RuntimeError(f"Audio playback failed: {error}. {detail}")
                if process.poll() is None:
                    process.kill()
                    process.wait()
        finally:
            try:
                process.stdin.close()
            except OSError:
                pass
            self._active = False

    @property
    def playing(self):
        if self._error:
            raise self._error
        if self.simulate and self._active and time.monotonic() - self._started >= self.duration:
            self._active = False
            self._position = self.duration
        return self._active

    @property
    def position(self):
        return min(self.duration, max(0, time.monotonic() - self._started)) if self.playing else self._position

    def stop(self):
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
        self._active = False
        self._position = 0.0
        self._error = None

    def close(self):
        self.stop()
