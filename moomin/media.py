import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

IMAGE_TYPES = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
AUDIO_TYPES = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}


def natural_key(path):
    return [int(p) if p.isdigit() else p.lower() for p in re.split(r"(\d+)", path.name)]


def source_files(directory, types):
    if not directory.is_dir():
        raise ValueError(f"Media directory does not exist: {directory}")
    return sorted((p for p in directory.iterdir() if p.is_file() and p.suffix.lower() in types), key=natural_key)


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(value, indent=2) + "\n")
    temp.replace(path)


def fit_image(image, size, fit="contain", background="#ffffff"):
    image = ImageOps.exif_transpose(image).convert("RGBA")
    matte = Image.new("RGBA", image.size, background)
    matte.alpha_composite(image)
    rgb = matte.convert("RGB")
    if fit == "cover":
        return ImageOps.fit(rgb, size, method=Image.Resampling.LANCZOS)
    resized = ImageOps.contain(rgb, size, method=Image.Resampling.LANCZOS)
    frame = Image.new("RGB", size, background)
    frame.paste(resized, ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2))
    return frame


def fingerprint(files, options):
    digest = hashlib.sha256(json.dumps(options, sort_keys=True).encode())
    for path in files:
        digest.update(path.name.encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()


def cached_manifest(directory, signature):
    manifest = directory / "manifest.json"
    if manifest.exists():
        data = json.loads(manifest.read_text())
        if data.get("signature") == signature and all((directory / item["file"]).is_file() for item in data["items"]):
            return data
    return None


def prepare_images(settings, force=False):
    cfg = settings.data["images"]
    files = source_files(settings.path("images", "input"), IMAGE_TYPES)
    if not files:
        raise ValueError("No supported images in imgs. Add PNG, JPEG, WebP or BMP files.")
    directory = settings.path("images", "prepared")
    signature = fingerprint(files, {"version": 1, "size": settings.size, "fit": cfg["fit"], "background": cfg["background"]})
    cached = None if force else cached_manifest(directory, signature)
    if cached:
        return [directory / item["file"] for item in cached["items"]]
    directory.mkdir(parents=True, exist_ok=True)
    items = []
    for index, path in enumerate(files):
        name = f"{index:03d}-{path.stem}.png"
        output = directory / name
        with Image.open(path) as image:
            frame = fit_image(image, settings.size, cfg["fit"], cfg["background"])
            frame.save(output.with_suffix(".tmp"), format="PNG")
        output.with_suffix(".tmp").replace(output)
        items.append({"source": path.name, "file": name, "size": list(settings.size)})
    atomic_json(directory / "manifest.json", {"signature": signature, "items": items})
    return [directory / item["file"] for item in items]


def run_tool(command):
    result = subprocess.run(command, capture_output=True, text=True, timeout=60)
    if result.returncode:
        raise RuntimeError(f"{command[0]} failed: {result.stderr.strip()}")
    return result.stdout


def prepare_audio(settings, force=False, *, full=False):
    files = source_files(settings.path("audio", "input"), AUDIO_TYPES)
    if not files:
        raise ValueError("No supported sound files in sounds. Add a WAV or MP3 file.")
    directory = settings.path("audio", "prepared") / "full" if full else settings.path("audio", "prepared")
    clip_seconds = None if full else settings.data["audio"]["clip_seconds"]
    signature = fingerprint(files, {"version": 1, "seconds": clip_seconds, "rate": 48000, "channels": 2})
    cached = None if force else cached_manifest(directory, signature)
    if cached:
        return [directory / item["file"] for item in cached["items"]]
    for program in ("ffmpeg", "ffprobe"):
        if not shutil.which(program):
            raise RuntimeError(f"{program} is missing. Install ffmpeg, then run prepare again.")
    directory.mkdir(parents=True, exist_ok=True)
    items = []
    for index, path in enumerate(files):
        duration = float(run_tool(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)]).strip())
        duration = duration if full else min(duration, clip_seconds)
        if duration <= 0:
            raise ValueError(f"Sound is empty: {path.name}")
        fade = min(0.08, duration / 4)
        filters = f"afade=t=in:st=0:d={fade},afade=t=out:st={duration - fade}:d={fade}"
        name = f"{index:03d}-{path.stem}.wav"
        output = directory / name
        temp = output.with_name(output.stem + ".tmp.wav")
        run_tool(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(path), "-t", str(duration), "-af", filters, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(temp)])
        temp.replace(output)
        items.append({"source": path.name, "file": name, "seconds": duration, "rate": 48000, "channels": 2})
    atomic_json(directory / "manifest.json", {"signature": signature, "items": items})
    return [directory / item["file"] for item in items]
