#!/usr/bin/env python3
"""Export saved 2x2 atlases to portrait PNG, GIF, RGB565-LE and SPI RGB565-BE."""
import argparse
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PIL import Image
from app.hardware import rgb565
from app.media import fit_image


def layered_frames(source, options):
    """Render a smooth head loop over one immutable scene, with a fixed neck pivot."""
    with Image.open(source / options["base"]) as image:
        base = fit_image(image, (240, 320), background="#fffdf5").convert("RGBA")
    poses = []
    with Image.open(source / options["heads"]) as image:
        atlas = image.convert("RGBA")
        if atlas.getchannel("A").getextrema()[0] == 255:
            raise ValueError("Layered head sprites require a transparent background.")
        for index in range(4):
            x, y = index % 2, index // 2
            pose = atlas.crop((x * atlas.width // 2, y * atlas.height // 2,
                               (x + 1) * atlas.width // 2, (y + 1) * atlas.height // 2))
            box = pose.getchannel("A").getbbox()
            if box is None:
                raise ValueError("A head sprite is empty.")
            poses.append(pose.crop(box))
    scale = options.get("head_height", 100) / max(pose.height for pose in poses)
    pivot = (64, 112)
    registered = []
    for pose in poses:
        # The narrow neck at the bottom supplies a stable pivot for each pose.
        alpha = pose.getchannel("A")
        points = [(x, y) for y in range(max(0, pose.height - max(1, pose.height // 25)), pose.height)
                  for x in range(pose.width) if alpha.getpixel((x, y)) > 128]
        neck_x = sum(x for x, _ in points) / len(points) if points else pose.width / 2
        size = (max(1, round(pose.width * scale)), max(1, round(pose.height * scale)))
        sprite = pose.resize(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (128, 128))
        canvas.alpha_composite(sprite, (round(pivot[0] - neck_x * scale), pivot[1] - sprite.height))
        registered.append(canvas)
    frames = []
    count = options.get("frames", 24)
    anchor = options.get("head_anchor", [128, 145])
    for tick in range(count):
        phase = tick / count
        position = phase * len(registered)
        index = int(position)
        fraction = position - index
        ease = fraction * fraction * (3 - 2 * fraction)
        # Premultiplied alpha avoids dark fringes while poses dissolve into each other.
        head = Image.blend(registered[index].convert("RGBa"),
                           registered[(index + 1) % len(registered)].convert("RGBa"), ease).convert("RGBA")
        head = head.rotate(3 * math.sin(phase * math.tau), Image.Resampling.BICUBIC, center=pivot)
        frame = base.copy()
        frame.alpha_composite(head, (anchor[0] - pivot[0], anchor[1] - pivot[1]))
        frames.append(frame.convert("RGB"))
    return frames


def prepare(source, destination):
    destination.mkdir(parents=True, exist_ok=True)
    layout_path = source / "layout.json"
    layout = json.loads(layout_path.read_text()) if layout_path.exists() else {}
    clips = {}
    for atlas_path in sorted(source.glob("*-atlas.png")):
        name = atlas_path.stem.removesuffix("-atlas")
        options = layout.get(name, {})
        frames = []
        previews = []
        if "base" in options:
            pictures = layered_frames(source, options)
        else:
            pictures = []
            with Image.open(atlas_path) as atlas:
                for index in range(4):
                    x, y = index % 2, index // 2
                    box = (x * atlas.width // 2, y * atlas.height // 2,
                           (x + 1) * atlas.width // 2, (y + 1) * atlas.height // 2)
                    pictures.append(fit_image(atlas.crop(box), (240, 320), background="#fffdf5"))
        for index, frame in enumerate(pictures):
            offsets = options.get("frame_offsets", [[0, 0]] * len(pictures))
            dx, dy = offsets[index]
            if dx or dy:
                # Register the animation on its planted feet after native-size fitting.
                canvas = Image.new("RGB", (240, 320), "#fffdf5")
                canvas.paste(frame, (dx, dy))
                frame = canvas
            directory = destination / name
            directory.mkdir(exist_ok=True)
            stem = directory / f"frame-{index:02d}"
            png_path = stem.with_suffix(".png")
            unchanged = False
            if png_path.exists():
                with Image.open(png_path) as previous:
                    unchanged = previous.mode == "RGB" and previous.size == frame.size and previous.tobytes() == frame.tobytes()
            if not unchanged:
                frame.save(png_path)
            previews.append(frame)
            wire = rgb565(frame)
            little = bytearray(len(wire))
            little[0::2], little[1::2] = wire[1::2], wire[0::2]
            stem.with_suffix(".raw").write_bytes(little)
            stem.with_suffix(".bin").write_bytes(wire)
            frames.append({extension: f"{name}/{stem.name}.{extension}"
                           for extension in ("png", "raw", "bin")})
        fps = options.get("preview_fps", 5)
        durations = [round((index + 1) * 100 / fps) * 10 - round(index * 100 / fps) * 10
                     for index in range(len(previews))]
        previews[0].save(destination / name / "preview.gif", save_all=True,
                         append_images=previews[1:], duration=durations, loop=0, disposal=2)
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
