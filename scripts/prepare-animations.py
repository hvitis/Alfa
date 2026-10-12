#!/usr/bin/env python3
"""Export two generated 2x2 atlases to portrait PNG, RGB565-LE and SPI RGB565-BE."""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PIL import Image
from moomin.hardware import rgb565
from moomin.media import fit_image


def prepare(source, destination):
    destination.mkdir(parents=True, exist_ok=True)
    clips = {}
    for name in ("listening", "speaking"):
        frames = []
        previews = []
        with Image.open(source / f"{name}-atlas.png") as atlas:
            for index in range(4):
                x, y = index % 2, index // 2
                box = (x * atlas.width // 2, y * atlas.height // 2,
                       (x + 1) * atlas.width // 2, (y + 1) * atlas.height // 2)
                frame = fit_image(atlas.crop(box), (240, 320), background="#fffdf5")
                directory = destination / name
                directory.mkdir(exist_ok=True)
                stem = directory / f"frame-{index:02d}"
                frame.save(stem.with_suffix(".png"))
                previews.append(frame)
                wire = rgb565(frame)
                little = bytearray(len(wire))
                little[0::2], little[1::2] = wire[1::2], wire[0::2]
                stem.with_suffix(".raw").write_bytes(little)
                stem.with_suffix(".bin").write_bytes(wire)
                frames.append({extension: f"{name}/{stem.name}.{extension}"
                               for extension in ("png", "raw", "bin")})
        previews[0].save(destination / name / "preview.gif", save_all=True,
                         append_images=previews[1:], duration=200, loop=0, disposal=2)
        clips[name] = frames
    manifest = {"version": 1, "size": [240, 320], "source_format": "RGB888-PNG",
                "raw_format": "RGB565-LE", "wire_format": "RGB565-BE",
                "fps": 5, "clips": clips}
    (destination / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("assets/animations"))
    parser.add_argument("--destination", type=Path, default=Path("media/animations"))
    args = parser.parse_args()
    prepare(args.source, args.destination)
