"""Hold timing, card movement, and idle behavior without hidden lesson modes."""
import time

from PIL import Image


class HoldClock:
    def __init__(self, clock=time.monotonic):
        self.clock = clock
        self.elapsed = 0.0
        self.since = None

    def __call__(self):
        return self.elapsed + (self.clock() - self.since if self.since is not None else 0)

    def hold(self, down):
        if down and self.since is None:
            self.since = self.clock()
        elif not down and self.since is not None:
            self.elapsed += self.clock() - self.since
            self.since = None


class CardMotion:
    fps = 20

    def __init__(self, clock=time.monotonic, duration=.28):
        self.clock, self.duration = clock, duration
        self.active = False

    def start(self, old, new, direction):
        self.old, self.new, self.direction = old.copy(), new.copy(), direction
        self.started, self.active = self.clock(), True

    def render_key(self):
        if not self.active:
            return None
        elapsed = self.clock() - self.started
        if elapsed >= self.duration:
            self.active = False
            self.old = self.new = None
            return None
        return int(elapsed * self.fps)

    def frame(self):
        if self.render_key() is None:
            return None
        t = min(1, max(0, (self.clock() - self.started) / self.duration))
        t = t * t * (3 - 2 * t)
        w, h = self.new.size
        dx, dy = {"left": (-w, 0), "right": (w, 0), "up": (0, -h), "down": (0, h)}[self.direction]
        frame = Image.new("RGB", (w, h), "#fffdf5")
        frame.paste(self.old, (round(-dx * t), round(-dy * t)))
        frame.paste(self.new, (round(dx * (1 - t)), round(dy * (1 - t))))
        return frame

    def stop(self):
        self.active = False
        self.old = self.new = None


class IdlePlay:
    """A card character peeks once, then the peripherals sleep until input."""
    def __init__(self, display, audio, amplifier=None, invite_seconds=20, sleep_seconds=300,
                 clock=time.monotonic):
        self.display, self.audio, self.amplifier = display, audio, amplifier
        self.invite_seconds, self.sleep_seconds, self.clock = invite_seconds, sleep_seconds, clock
        self.last_input = clock()
        self.sleeping = self.peeking = False

    def touch(self):
        self.last_input = self.clock()
        if self.sleeping:
            if self.amplifier:
                self.amplifier.set_awake(True)
            if hasattr(self.display, "set_awake"):
                self.display.set_awake(True)
        self.sleeping = self.peeking = False

    def update(self, held=False):
        if held:
            self.last_input = self.clock()
        elapsed = self.clock() - self.last_input
        if elapsed >= self.sleep_seconds and not self.sleeping:
            self.audio.silence()
            if hasattr(self.display, "set_awake"):
                self.display.set_awake(False)
            if self.amplifier:
                self.amplifier.set_awake(False)
            self.sleeping = True
        self.peeking = self.invite_seconds <= elapsed < self.invite_seconds + 3 and not self.sleeping

    def render_key(self):
        return (self.sleeping, int((self.clock() - self.last_input) * 10) if self.peeking else None)

    def frame(self, card):
        # Faces sit above and behind the letters. Reuse the upper-right artwork.
        frame = card.copy()
        character = card.crop((card.width // 3, 0, card.width, card.height // 2))
        character.thumbnail((card.width // 2, card.height // 2))
        age = self.clock() - self.last_input - self.invite_seconds
        progress = min(1, max(0, age / .4), max(0, (3 - age) / .4))
        frame.paste(character, (card.width - round(character.width * progress), card.height - character.height - 12))
        return frame
