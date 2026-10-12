#!/usr/bin/env python3
"""Export an offline lesson GIF and a contact sheet of all completed letters."""
import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PIL import Image, ImageDraw

from moomin.config import ROOT
from moomin.letter_lesson import LetterLesson
from moomin.letter_paths import LetterCatalog
from moomin.ui import font


def preview(letter, destination, contact_sheet):
    catalog = LetterCatalog(ROOT / "assets/letter-drawing/letters.json")
    now = [0.0]
    lesson = LetterLesson(catalog, clock=lambda: now[0])
    lesson.start(letter)
    frames = []
    for tick in range(int(lesson.duration * 20) + 1):
        now[0] = tick / 20
        frame = lesson.frame()
        if frame is not None:
            frames.append(frame)
    with Image.open(ROOT / "assets/alphabet" / f"{list(catalog.letters).index(letter):02d}-{letter}.png") as card:
        frames.append(card.resize((240, 320), Image.Resampling.LANCZOS).convert("RGB"))
    destination.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(destination, save_all=True, append_images=frames[1:],
                   duration=[50] * (len(frames) - 1) + [1400], loop=0, disposal=2)

    sheet = Image.new("RGB", (8 * 144, 4 * 205), "#eee9dd")
    for index, glyph in enumerate(catalog.letters):
        now[0] = 0
        lesson.start(glyph)
        now[0] = lesson.draw_end + .01
        frame = lesson.frame().resize((132, 176), Image.Resampling.LANCZOS)
        x, y = (index % 8) * 144 + 6, (index // 8) * 205 + 6
        sheet.paste(frame, (x, y))
        ImageDraw.Draw(sheet).text((x + 56, y + 179), glyph, fill="#235b56", font=font(16))
    contact_sheet.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(contact_sheet)
    print(f"Saved {destination} and {contact_sheet}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--letter", default="Ą")
    parser.add_argument("--destination", type=Path, default=ROOT / "assets/letter-drawing/preview.gif")
    parser.add_argument("--contact-sheet", type=Path, default=ROOT / "docs/letter-drawing-contact-sheet.png")
    args = parser.parse_args()
    preview(args.letter, args.destination, args.contact_sheet)
