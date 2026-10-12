"""Clock-driven tracing and celebration. No frame queue or per-letter bitmaps."""
import math
import time

from PIL import Image, ImageDraw

from .ui import font


class LetterRenderer:
    background = "#fffdf5"
    ink = "#235b56"

    def __init__(self, size=(240, 320)):
        self.size = size
        self.scale = min(size[0] / 96, size[1] / 128)
        self.width = max(4, round(self.scale * 4))
        self.guide = None
        self.strokes = ()

    def point(self, point):
        x, y = point
        return (self.size[0] / 2 + (x - 50) * self.scale,
                self.size[1] * .14 + y * self.scale)

    def line(self, draw, points, color, width=None):
        width = width or self.width
        positions = [self.point(p) for p in points]
        draw.line(positions, fill=color, width=width, joint="curve")
        r = width / 2
        for x, y in (positions[0], positions[-1]):
            draw.ellipse((x - r, y - r, x + r, y + r), fill=color)

    def prepare(self, strokes):
        self.strokes = strokes
        self.guide = Image.new("RGB", self.size, self.background)
        draw = ImageDraw.Draw(self.guide)
        # The guide keeps the whole shape visible, including accents and ogoneks.
        for stroke in strokes:
            self.line(draw, stroke.points, "#dbe7df")
        self.caption(draw, "Rysujemy", 15, 17, self.ink)

    def caption(self, draw, text, y, size, color):
        face = font(size)
        x = (self.size[0] - draw.textlength(text, font=face)) / 2
        draw.text((x, y), text, font=face, fill=color)

    def frame(self, state):
        phase, completed, current, fraction, celebration = state
        frame = self.guide.copy()
        draw = ImageDraw.Draw(frame)
        if phase == "celebrate":
            # Paint sparks first so the completed letter always stays in front.
            self.fireworks(draw, celebration)
        for stroke in self.strokes[:completed]:
            self.line(draw, stroke.points, self.ink)
        if current is not None:
            stroke = self.strokes[current]
            points = stroke.prefix(fraction)
            if fraction:
                self.line(draw, points, self.ink)
            x, y = self.point(points[-1])
            # A small pencil tip shows the direction without covering the line.
            radius = 7
            draw.ellipse((x - radius, y - radius, x + radius, y + radius),
                         fill="#f2b84c", outline=self.background, width=2)
            draw.ellipse((x - 2, y - 2, x + 2, y + 2), fill=self.ink)
        if phase in ("hold", "celebrate"):
            caption = "Brawo!"
        else:
            caption = f"Kreska {min(len(self.strokes), (current or 0) + 1)} z {len(self.strokes)}"
        self.caption(draw, caption, self.size[1] - 27, 15, self.ink)
        return frame

    def fireworks(self, draw, progress):
        """Deterministic radial bursts in the margin; the letter stays untouched."""
        w, h = self.size
        colors = ("#e77970", "#e5b947", "#63a99a", "#a890bd")
        bursts = ((.10, .22, 0), (.89, .31, .12), (.10, .72, .26), (.89, .76, .38))
        for burst, (cx, cy, delay) in enumerate(bursts):
            age = (progress - delay) / .58
            if not 0 <= age <= 1:
                continue
            radius = (4 + 19 * math.sin(age * math.pi / 2)) * w / 240
            color = colors[burst]
            fade = max(0, (age - .58) / .42)
            rgb = tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))
            bg = (255, 253, 245)
            color = tuple(round(a + (b - a) * fade) for a, b in zip(rgb, bg))
            for ray in range(8):
                angle = ray * math.tau / 8 + burst * .23
                dx, dy = math.cos(angle), math.sin(angle)
                x, y = cx * w, cy * h
                tail = max(0, radius - 6 * (1 - age))
                draw.line((x + dx * tail, y + dy * tail, x + dx * radius, y + dy * radius),
                          fill=color, width=2)
                px, py = x + dx * radius, y + dy * radius
                draw.ellipse((px - 1, py - 1, px + 1, py + 1), fill=color)


class LetterLesson:
    def __init__(self, catalog, size=(240, 320), fps=20, draw_seconds=5,
                 stroke_pause=.22, intro_seconds=.5, hold_seconds=.7,
                 celebration_seconds=1.8, clock=time.monotonic):
        self.catalog, self.clock, self.fps = catalog, clock, fps
        self.draw_seconds, self.stroke_pause = draw_seconds, stroke_pause
        self.intro_seconds, self.hold_seconds = intro_seconds, hold_seconds
        self.celebration_seconds = celebration_seconds
        self.renderer = LetterRenderer(size)
        self.active = None
        self.serial = 0
        self.timeline = ()

    def start(self, letter, audio_seconds=0):
        strokes = self.catalog.strokes(letter)
        self.renderer.prepare(strokes)
        # Extra weight gives short crossbars and diacritics enough visible time.
        weights = [stroke.length + 35 for stroke in strokes]
        available = max(self.draw_seconds, len(strokes) * .6)
        cursor = self.intro_seconds
        timeline = []
        for weight in weights:
            duration = available * weight / sum(weights)
            timeline.append((cursor, cursor + duration))
            cursor += duration + self.stroke_pause
        self.timeline = tuple(timeline)
        self.draw_end = timeline[-1][1]
        # Keep the result on screen until the entire custom recording has played.
        self.celebration_start = max(self.draw_end + self.hold_seconds, audio_seconds)
        self.duration = self.celebration_start + self.celebration_seconds
        self.active, self.started = letter, self.clock()
        self.serial += 1

    def stop(self):
        self.active = None
        self.renderer.guide = None
        self.renderer.strokes = ()
        self.timeline = ()

    def state(self):
        if self.active is None:
            return None
        now = self.clock()
        if now >= self.started + self.duration:
            self.stop()
            return None
        elapsed = max(0, now - self.started)
        count = len(self.timeline)
        if elapsed >= self.celebration_start:
            return ("celebrate", count, None, 1,
                    (elapsed - self.celebration_start) / self.celebration_seconds)
        if elapsed >= self.draw_end:
            return ("hold", count, None, 1, 0)
        for index, (start, end) in enumerate(self.timeline):
            if elapsed < start:
                return ("intro" if index == 0 else "pause", index, index, 0, 0)
            if elapsed < end:
                return ("draw", index, index, (elapsed - start) / (end - start), 0)

    def render_key(self):
        state = self.state()
        if state is None:
            return (None, self.serial)
        phase, count, current, _, _ = state
        # Static lead-ins, pen lifts and the finished letter do not need redraws.
        tick = int((self.clock() - self.started) * self.fps) if phase in ("draw", "celebrate") else None
        return (self.active, self.serial, phase, count, current, tick)

    def frame(self):
        state = self.state()
        if state is None:
            return None
        return self.renderer.frame(state)
