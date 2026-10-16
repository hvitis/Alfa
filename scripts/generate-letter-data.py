#!/usr/bin/env python3
"""Author the complete Polish uppercase tracing catalog as compact vector data."""
import json
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ALPHABET = "AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ"

# Each list is one pen-down stroke, in teaching order. Coordinates use 100x100.
BASES = {
    "A": [[['M', 50, 20], ['L', 20, 80]],
          [['M', 50, 20], ['L', 80, 80]],
          [['M', 33, 55], ['L', 67, 55]]],
    "B": [[['M', 28, 20], ['L', 28, 80]],
          [['M', 28, 20], ['L', 51, 20], ['C', 81, 20, 81, 49, 51, 49], ['L', 28, 49]],
          [['M', 28, 49], ['L', 54, 49], ['C', 85, 49, 85, 80, 54, 80], ['L', 28, 80]]],
    "C": [[['M', 76, 28], ['C', 43, 2, 10, 28, 24, 63], ['C', 32, 83, 58, 86, 76, 72]]],
    "D": [[['M', 28, 20], ['L', 28, 80]],
          [['M', 28, 20], ['L', 46, 20], ['C', 91, 20, 91, 80, 46, 80], ['L', 28, 80]]],
    "E": [[['M', 28, 20], ['L', 28, 80]],
          [['M', 28, 20], ['L', 80, 20]],
          [['M', 28, 49], ['L', 70, 49]],
          [['M', 28, 80], ['L', 80, 80]]],
    "F": [[['M', 28, 20], ['L', 28, 80]],
          [['M', 28, 20], ['L', 78, 20]],
          [['M', 28, 49], ['L', 69, 49]]],
    "G": [[['M', 76, 28], ['C', 43, 2, 10, 28, 24, 63], ['C', 32, 83, 63, 87, 78, 69]],
          [['M', 53, 52], ['L', 78, 52], ['L', 78, 69]]],
    "H": [[['M', 25, 20], ['L', 25, 80]],
          [['M', 75, 20], ['L', 75, 80]],
          [['M', 25, 50], ['L', 75, 50]]],
    "I": [[['M', 50, 20], ['L', 50, 80]]],
    "J": [[['M', 67, 20], ['L', 67, 62], ['C', 67, 86, 27, 88, 27, 64]]],
    "K": [[['M', 28, 20], ['L', 28, 80]],
          [['M', 77, 20], ['L', 28, 53]],
          [['M', 45, 42], ['L', 78, 80]]],
    "L": [[['M', 28, 20], ['L', 28, 80]],
          [['M', 28, 80], ['L', 75, 80]]],
    "M": [[['M', 23, 20], ['L', 23, 80]],
          [['M', 23, 20], ['L', 50, 57], ['L', 77, 20]],
          [['M', 77, 20], ['L', 77, 80]]],
    "N": [[['M', 25, 20], ['L', 25, 80]],
          [['M', 25, 20], ['L', 75, 80]],
          [['M', 75, 20], ['L', 75, 80]]],
    "O": [[['M', 50, 20], ['C', 12, 20, 12, 80, 50, 80], ['C', 88, 80, 88, 20, 50, 20]]],
    "P": [[['M', 28, 20], ['L', 28, 80]],
          [['M', 28, 20], ['L', 52, 20], ['C', 85, 20, 85, 51, 52, 51], ['L', 28, 51]]],
    "R": [[['M', 28, 20], ['L', 28, 80]],
          [['M', 28, 20], ['L', 52, 20], ['C', 85, 20, 85, 51, 52, 51], ['L', 28, 51]],
          [['M', 51, 51], ['L', 79, 80]]],
    "S": [[['M', 76, 27], ['C', 59, 11, 24, 17, 25, 35],
           ['C', 26, 52, 77, 46, 77, 65], ['C', 77, 84, 39, 88, 22, 73]]],
    "T": [[['M', 20, 20], ['L', 80, 20]],
          [['M', 50, 20], ['L', 50, 80]]],
    "U": [[['M', 25, 20], ['L', 25, 59], ['C', 25, 88, 75, 88, 75, 59], ['L', 75, 20]]],
    "W": [[['M', 18, 20], ['L', 33, 80], ['L', 50, 43], ['L', 67, 80], ['L', 82, 20]]],
    "Y": [[['M', 22, 20], ['L', 50, 50]],
          [['M', 78, 20], ['L', 50, 50], ['L', 50, 80]]],
    "Z": [[['M', 22, 20], ['L', 78, 20], ['L', 22, 80], ['L', 78, 80]]],
}
MARKS = {
    "acute": [[['M', 46, 12], ['L', 58, 5]]],
    "ogonek": [[['M', 80, 80], ['C', 67, 88, 68, 98, 81, 93]]],
    "slash": [[['M', 17, 62], ['L', 49, 46]]],
    "dot": [[['M', 50, 8], ['L', 50, 8]]],
}
VARIANTS = {"Ą": ("A", "ogonek"), "Ć": ("C", "acute"), "Ę": ("E", "ogonek"),
            "Ł": ("L", "slash"), "Ń": ("N", "acute"), "Ó": ("O", "acute"),
            "Ś": ("S", "acute"), "Ź": ("Z", "acute"), "Ż": ("Z", "dot")}


def card_ink(index, letter):
    """Sample the dominant solid navy in the actual prepared card, at authoring time."""
    path = ROOT / "media/alphabet" / f"{index:03d}-{index:02d}-{letter}.png"
    if not path.is_file():
        path = ROOT / "assets/alphabet" / f"{index:02d}-{letter}.png"
    with Image.open(path) as source:
        colors = Counter(pixel for pixel in source.convert("RGB").getdata()
                         if pixel[0] < 45 and pixel[1] < 85 and 40 < pixel[2] < 140
                         and pixel[2] > pixel[0] * 1.4 and pixel[2] > pixel[1] * 1.05)
    if not colors:
        raise ValueError(f"No navy letter ink found in {path}")
    color = colors.most_common(1)[0][0]
    return "#" + "".join(f"{channel:02x}" for channel in color)


def generate(destination):
    letters = {}
    for index, letter in enumerate(ALPHABET):
        item = {"audio": f"media/letter-sounds/{index:02d}-{letter}.wav", "ink": card_ink(index, letter)}
        if letter in VARIANTS:
            item["base"], item["mark"] = VARIANTS[letter]
        else:
            item["strokes"] = BASES[letter]
        letters[letter] = item
    data = {"version": 1, "canvas": [100, 100], "alphabet": list(ALPHABET),
            "marks": MARKS, "letters": letters}
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    generate(ROOT / "assets/letter-drawing/letters.json")
