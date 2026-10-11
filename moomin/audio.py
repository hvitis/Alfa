import os
import re
import shutil
import subprocess
import time

from .media import run_tool


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
    def __init__(self, settings, simulate=False, volume=None, device=None):
        self.settings, self.simulate = settings, simulate
        self.volume = settings.data["audio"]["volume"] if volume is None else volume
        if not 0 <= self.volume <= 1:
            raise ValueError("Volume must be between 0.0 and 1.0.")
        self.configured_device = device or settings.data["audio"]["device"]
        self.process = self.log = None
        self.simulated_until = 0.0
        self.temp = settings.state / f"playback-{os.getpid()}.wav"
        self.log_path = settings.state / f"audio-{os.getpid()}.log"

    def play(self, path):
        self.stop()
        if self.simulate:
            print(f"[simulation] Would play {path.name} at {self.volume:.0%} digital volume.")
            self.simulated_until = time.monotonic() + 0.1
            return
        device = audio_device(self.configured_device)
        self.settings.state.mkdir(parents=True, exist_ok=True)
        run_tool(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(path), "-af", f"volume={self.volume}", "-c:a", "pcm_s16le", str(self.temp)])
        print(f"Playing {path.name} through {device} at {self.volume:.0%}.")
        self.log = self.log_path.open("w")
        try:
            self.process = subprocess.Popen(["aplay", "-q", "-D", device, str(self.temp)], stdout=subprocess.DEVNULL, stderr=self.log)
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
        if self.log:
            self.log.close()
            self.log = None
        self.process = None
        if code:
            message = self.log_path.read_text()[-2000:].strip()
            raise RuntimeError(f"Audio playback failed: {message}. Run aplay -l and check audio.device.")
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
