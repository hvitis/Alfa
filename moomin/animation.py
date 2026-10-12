"""Short, interruptible portrait animations, with precompiled ST7789 transfers."""
import json
import time
from pathlib import Path

from PIL import Image


class CharacterAnimation:
    def __init__(self, directory, fps=5, cycles=2, rotation=0, clock=time.monotonic):
        self.directory = Path(directory)
        manifest = json.loads((self.directory / "manifest.json").read_text())
        if manifest.get("size") != [240, 320] or manifest.get("wire_format") != "RGB565-BE":
            raise ValueError("Animation manifest must specify 240x320 RGB565-BE wire frames.")
        self.clips = manifest["clips"]
        for name in ("listening", "speaking"):
            frames = self.clips[name]
            if not 2 <= len(frames) <= 4:
                raise ValueError("Character animations need 2 to 4 frames.")
            for frame in frames:
                for key in ("png", "bin"):
                    path = Path(frame[key])
                    if path.is_absolute() or ".." in path.parts:
                        raise ValueError("Animation frames must stay inside the media directory.")
                    if not (self.directory / path).is_file():
                        raise ValueError(f"Missing animation frame: {path}")
        self.fps, self.cycles, self.rotation, self.clock = fps, cycles, rotation, clock
        self.active = None
        self.started = 0
        self.serial = 0
        self.payloads = []

    def start(self, name):
        # Cache only the active four-frame clip (614400 bytes at native resolution).
        payloads = []
        for frame in self.clips[name]:
            payload = (self.directory / frame["bin"]).read_bytes()
            if len(payload) != 240 * 320 * 2:
                raise ValueError(f"Invalid RGB565 frame length: {frame['bin']}")
            if self.rotation == 180:
                # Reverse pixel order, preserving each pixel's two-byte wire word.
                payload = b"".join(payload[index:index + 2]
                                   for index in range(len(payload) - 2, -1, -2))
            payloads.append(payload)
        self.payloads = payloads
        self.active, self.started = name, self.clock()
        self.serial += 1

    def stop(self):
        self.active = None
        self.payloads = []

    def index(self):
        if self.active is None:
            return None
        tick = int(max(0, self.clock() - self.started) * self.fps)
        count = len(self.clips[self.active])
        if tick >= count * self.cycles:
            self.stop()
            return None
        return tick % count

    def render_key(self):
        index = self.index()
        return (self.active, self.serial, index)

    def frame(self):
        index = self.index()
        if index is None:
            return None
        with Image.open(self.directory / self.clips[self.active][index]["png"]) as source:
            if source.size != (240, 320):
                raise ValueError("Animation PNG must be 240x320.")
            return source.convert("RGB")

    def wire_frame(self):
        index = self.index()
        return None if index is None else self.payloads[index]
