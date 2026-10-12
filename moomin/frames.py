"""Compile native transfers once; retain only the displayed card during playback."""
import json
from pathlib import Path

from PIL import Image

from .hardware import rgb565
from .media import atomic_json, image_sources


def prepare_wire_images(settings):
    paths, _ = image_sources(settings, prepared_only=True)
    rotation = settings.data["display"]["rotation"]
    directory = settings.path("images", "prepared") / f"wire-{rotation}"
    directory.mkdir(parents=True, exist_ok=True)
    items = []
    for path in paths:
        name = path.stem + ".bin"
        with Image.open(path) as source:
            payload = rgb565(source.rotate(rotation, expand=True))
        if len(payload) != 153600:
            raise ValueError(f"Incorrect native display size: {path}")
        destination = directory / name
        temporary = destination.with_suffix(".tmp")
        temporary.write_bytes(payload)
        temporary.replace(destination)
        items.append({"png": path.name, "bin": name, "source_mtime_ns": path.stat().st_mtime_ns})
    atomic_json(directory / "manifest.json", {"rotation": rotation, "size": list(settings.size),
                                                "format": "RGB565-BE", "items": items})
    return directory


class WireFrames:
    def __init__(self, settings):
        rotation = settings.data["display"]["rotation"]
        self.directory = settings.path("images", "prepared") / f"wire-{rotation}"
        self.paths = {}
        manifest = self.directory / "manifest.json"
        if manifest.is_file():
            data = json.loads(manifest.read_text())
            if data.get("rotation") != rotation or data.get("size") != list(settings.size) or data.get("format") != "RGB565-BE":
                raise ValueError("Wire images do not match this display. Run prepare --wire-only.")
            for item in data["items"]:
                for key in ("png", "bin"):
                    if not isinstance(item[key], str) or Path(item[key]).name != item[key]:
                        raise ValueError("Wire image filenames must stay inside their media folder.")
                self.paths[item["png"]] = (self.directory / item["bin"], item.get("source_mtime_ns"))
        self.current, self.payload = None, None

    def frame(self, image):
        entry = self.paths.get(Path(image).name)
        if entry is None:
            return None
        path, modified = entry
        if modified != Path(image).stat().st_mtime_ns:
            return None
        if path != self.current:
            self.payload = None
            payload = path.read_bytes()
            if len(payload) != 153600:
                raise ValueError(f"Incorrect RGB565 frame length: {path}")
            self.current, self.payload = path, payload
        return self.payload
