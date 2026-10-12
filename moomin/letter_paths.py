"""Small ordered paths; flatten and measure only the letter being taught."""
import bisect
import json
import math
from dataclasses import dataclass
from pathlib import Path
import re


@dataclass(frozen=True)
class Stroke:
    points: tuple
    distances: tuple

    @classmethod
    def from_commands(cls, commands):
        points = []
        for command in commands:
            op, *values = command
            counts = {"M": 2, "L": 2, "Q": 4, "C": 6}
            if op not in counts or len(values) != counts[op]:
                raise ValueError(f"Invalid stroke command: {command}")
            if any(type(v) not in (int, float) or not math.isfinite(v) or not 0 <= v <= 100 for v in values):
                raise ValueError("Stroke coordinates must be finite numbers from 0 to 100.")
            if op == "M":
                if points:
                    raise ValueError("Each stroke must have exactly one initial M command.")
                points.append(tuple(values))
                continue
            if not points:
                raise ValueError("A stroke must start with M.")
            start = points[-1]
            end = tuple(values[-2:])
            if op == "L":
                points.append(end)
                continue
            # A fixed bound keeps active-letter geometry small and curves smooth.
            controls = [start] + [tuple(values[i:i + 2]) for i in range(0, len(values), 2)]
            for step in range(1, 33):
                t = step / 32
                work = controls
                while len(work) > 1:
                    work = [(a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t)
                            for a, b in zip(work, work[1:])]
                points.append(work[0])
        if len(points) < 2:
            raise ValueError("A stroke needs a move and at least one drawing command.")
        distances = [0.0]
        for a, b in zip(points, points[1:]):
            distances.append(distances[-1] + math.dist(a, b))
        return cls(tuple(points), tuple(distances))

    @property
    def length(self):
        return self.distances[-1]

    def prefix(self, fraction):
        """Interpolate by distance so a curve and a straight line have the same speed."""
        fraction = max(0, min(1, fraction))
        if not self.length or fraction == 1:
            return self.points
        distance = self.length * fraction
        index = bisect.bisect_right(self.distances, distance)
        a, b = self.points[index - 1:index + 1]
        span = self.distances[index] - self.distances[index - 1]
        t = (distance - self.distances[index - 1]) / span if span else 0
        tip = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
        return self.points[:index] + (tip,)


class LetterCatalog:
    def __init__(self, path):
        self.data = json.loads(Path(path).read_text(encoding="utf-8"))
        if self.data.get("version") != 1 or self.data.get("canvas") != [100, 100]:
            raise ValueError("Letter data must use version 1 and a 100x100 canvas.")
        self.letters = self.data["letters"]
        if not self.letters:
            raise ValueError("The letter catalog is empty.")
        # Validate definitions once without retaining flattened paths for all letters.
        for letter in self.letters:
            self.strokes(letter)
            if not re.fullmatch(r"#[0-9a-fA-F]{6}", self.ink(letter)):
                raise ValueError("Letter ink must be a six-digit hex color.")
            audio = Path(self.letters[letter]["audio"])
            if audio.is_absolute() or ".." in audio.parts or audio.suffix != ".wav":
                raise ValueError("Letter audio must be a relative WAV path inside the project.")

    def strokes(self, letter):
        item = self.letters[letter]
        commands = list(item.get("strokes", []))
        if "base" in item:
            base = self.letters[item["base"]]
            if "base" in base:
                raise ValueError("Letter bases cannot refer to another base.")
            commands = list(base["strokes"]) + commands
        if "mark" in item:
            commands += self.data["marks"][item["mark"]]
        if not commands:
            raise ValueError(f"No strokes for {letter}.")
        return tuple(Stroke.from_commands(stroke) for stroke in commands)

    def letter_for_image(self, path):
        # Both master (01-Ą.png) and prepared (001-01-Ą.png) filenames work.
        letter = Path(path).stem.rsplit("-", 1)[-1]
        return letter if letter in self.letters else None

    def audio_path(self, root, letter):
        return Path(root) / self.letters[letter]["audio"]

    def ink(self, letter):
        return self.letters[letter].get("ink", "#012a5f")
