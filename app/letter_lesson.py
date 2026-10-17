"""Clock-driven tracing and celebration. No frame queue or per-letter bitmaps."""
import math
import time

from PIL import Image, ImageDraw

from .ui import font


class Pencil:
    """Two small, antialiased pencil sprites with the graphite tip at a known anchor."""
    def __init__(self):
        self.sprites = [self.sprite(direction) for direction in (-1, 1)]

    @staticmethod
    def sprite(direction):
        zoom = 3
        canvas = Image.new("RGBA", (64 * zoom, 64 * zoom))
        draw = ImageDraw.Draw(canvas)
        tip = (16, 48 if direction == -1 else 12)
        axis = (.55, direction * .835)
        normal = (-axis[1], axis[0])
        def polygon(points, fill, outline=None):
            positions = [((tip[0] + axis[0] * along + normal[0] * across) * zoom,
                          (tip[1] + axis[1] * along + normal[1] * across) * zoom)
                         for along, across in points]
            draw.polygon(positions, fill=fill)
            if outline:
                draw.line(positions + [positions[0]], fill=outline, width=zoom, joint="curve")
        polygon(((11, -5), (36, -5), (36, 5), (11, 5)), "#efbc42", "#a97329")
        polygon(((12, -4), (36, -4), (36, -1), (12, -1)), "#ffe391")
        polygon(((12, 2), (36, 2), (36, 4), (12, 4)), "#d99930")
        polygon(((0, 0), (11, -5), (11, 5)), "#e9c799", "#ae895c")
        polygon(((0, 0), (5, -2), (5, 2)), "#25313b")
        polygon(((36, -5), (39, -5), (39, 5), (36, 5)), "#bdc8cf", "#7b8c98")
        polygon(((39, -5), (44, -5), (46, -3), (46, 3), (44, 5), (39, 5)), "#e98e91", "#b66370")
        return canvas.resize((64, 64), Image.Resampling.LANCZOS), tip

    def draw(self, frame, tip):
        # Accents need a downward shaft so the pencil stays clear of the header.
        sprite, anchor = self.sprites[1 if tip[1] < 85 else 0]
        position = (round(tip[0] - anchor[0]), round(tip[1] - anchor[1]))
        frame.paste(sprite, position, sprite)


class LetterRenderer:
    background = "#fffdf5"
    ink = "#012a5f"

    def __init__(self, size=(240, 320)):
        self.size = size
        self.scale = min(size[0] / 96, size[1] / 128)
        self.width = max(6, round(self.scale * 6.4))
        self.pencil = Pencil()
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

    def prepare(self, strokes, ink="#012a5f"):
        self.strokes = strokes
        self.ink = ink
        self.guide = Image.new("RGB", self.size, self.background)
        draw = ImageDraw.Draw(self.guide)
        # The guide keeps the whole shape visible, including accents and ogoneks.
        for stroke in strokes:
            self.line(draw, stroke.points, "#dce3ee")
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
            points = stroke.prefix(fraction if phase == "draw" else 0)
            if phase == "draw" and fraction:
                self.line(draw, points, self.ink)
            tip = points[-1]
            if phase == "pause":
                previous = self.strokes[current - 1].points[-1]
                following = stroke.points[0]
                ease = fraction * fraction * (3 - 2 * fraction)
                tip = tuple(a + (b - a) * ease for a, b in zip(previous, following))
            self.pencil.draw(frame, self.point(tip))
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
                 celebration_seconds=1.8, clock=time.monotonic, celebration_clock=None):
        self.catalog, self.clock, self.fps = catalog, clock, fps
        self.celebration_clock = celebration_clock or clock
        self.finished_at = None
        self.draw_seconds, self.stroke_pause = draw_seconds, stroke_pause
        self.intro_seconds, self.hold_seconds = intro_seconds, hold_seconds
        self.celebration_seconds = celebration_seconds
        self.renderer = LetterRenderer(size)
        self.active = None
        self.serial = 0
        self.timeline = ()

    def start(self, letter, audio_seconds=0):
        strokes = self.catalog.strokes(letter)
        self.renderer.prepare(strokes, self.catalog.ink(letter))
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
        self.finished_at = None
        self.serial += 1

    def stop(self):
        self.active = None
        self.finished_at = None
        self.renderer.guide = None
        self.renderer.strokes = ()
        self.timeline = ()

    def state(self):
        if self.active is None:
            return None
        elapsed = self.elapsed()
        if elapsed >= self.duration:
            self.stop()
            return None
        count = len(self.timeline)
        if elapsed >= self.celebration_start:
            return ("celebrate", count, None, 1,
                    (elapsed - self.celebration_start) / self.celebration_seconds)
        if elapsed >= self.draw_end:
            return ("hold", count, None, 1, 0)
        for index, (start, end) in enumerate(self.timeline):
            if elapsed < start:
                if index == 0:
                    return ("intro", 0, 0, 0, 0)
                previous_end = self.timeline[index - 1][1]
                fraction = max(0, min(1, (elapsed - previous_end) / (start - previous_end)))
                return ("pause", index, index, fraction, 0)
            if elapsed < end:
                return ("draw", index, index, (elapsed - start) / (end - start), 0)

    def elapsed(self):
        elapsed = max(0, self.clock() - self.started)
        if self.finished_at is None and elapsed >= self.draw_end:
            # Only the pencil needs a held button. Completion runs on real time.
            self.finished_at = self.celebration_clock() - (elapsed - self.draw_end)
        if self.finished_at is not None:
            return self.draw_end + max(0, self.celebration_clock() - self.finished_at)
        return elapsed

    def render_key(self):
        state = self.state()
        if state is None:
            return (None, self.serial)
        phase, count, current, _, _ = state
        # The pencil moves between strokes as well as while drawing.
        tick = int(self.elapsed() * self.fps) if phase in ("draw", "pause", "celebrate") else None
        return (self.active, self.serial, phase, count, current, tick)

    def frame(self):
        state = self.state()
        if state is None:
            return None
        return self.renderer.frame(state)
