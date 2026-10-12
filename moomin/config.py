import json
import math
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


@dataclass
class Settings:
    root: Path
    data: dict

    @classmethod
    def load(cls, path=None, root=ROOT):
        data = json.loads((root / "config.json").read_text())
        if path and Path(path).resolve() != (root / "config.json").resolve():
            custom = json.loads(Path(path).read_text())
            for section, values in custom.items():
                # Old Pi overrides can retain this removed feature's section.
                if section == "power":
                    continue
                if section not in data or not isinstance(values, dict):
                    raise ValueError(f"Unknown configuration section: {section}")
                data[section].update(values)
        settings = cls(root, data)
        settings.validate()
        return settings

    def validate(self):
        display, adc, audio = (self.data[k] for k in ("display", "adc", "audio"))
        pins = [display[k] for k in ("dc_pin", "reset_pin", "backlight_pin")]
        if any(type(pin) is not int or not 0 <= pin <= 27 for pin in pins):
            raise ValueError("Display pins must be BCM GPIO numbers from 0 to 27.")
        reserved = {2, 3, 8, 9, 10, 11, 18, 19, 21}
        if len(set(pins)) != 3 or reserved.intersection(pins):
            raise ValueError("Display control pins conflict with SPI, I²C or I²S. Use DC=25, RST=27, BL=24.")
        if display["rotation"] not in (0, 90, 180, 270):
            raise ValueError("Display rotation must be 0, 90, 180 or 270.")
        if display["spi_bus"] != 0 or display["spi_device"] != 0:
            raise ValueError("This wiring uses SPI bus 0, device 0 (CE0, physical pin 24).")
        if not 100000 <= display["spi_hz"] <= 40000000:
            raise ValueError("SPI speed must be between 100000 and 40000000 Hz.")
        if adc["model"] not in ("ads1115", "ads1015"):
            raise ValueError("ADC model must be ads1115 or ads1015.")
        if self.address not in range(0x48, 0x4C):
            raise ValueError("ADC address must be 0x48, 0x49, 0x4a or 0x4b.")
        if not 20 <= adc["debounce_ms"] <= 1000:
            raise ValueError("Button debounce must be between 20 and 1000 milliseconds.")
        if self.data["images"]["fit"] not in ("contain", "cover"):
            raise ValueError("Image fit must be contain or cover.")
        if not math.isfinite(audio["volume"]) or not 0 <= audio["volume"] <= 1:
            raise ValueError("Audio volume must be between 0.0 and 1.0.")
        if not math.isfinite(audio["clip_seconds"]) or not 0.1 <= audio["clip_seconds"] <= 30:
            raise ValueError("Audio clip length must be between 0.1 and 30 seconds.")
        for section in ("images", "audio"):
            if self.path(section, "input") == self.path(section, "prepared"):
                raise ValueError("Prepared media must use a different directory from the originals.")
        animations = self.data.get("animations", {})
        drawing = self.data.get("letter_drawing", {})
        if drawing.get("enabled"):
            if self.size != (240, 320):
                raise ValueError("Letter drawing needs portrait rotation 0 or 180.")
            limits = {"fps": (4, 30), "draw_seconds": (3, 10), "stroke_pause": (.1, 1),
                      "intro_seconds": (.1, 2), "hold_seconds": (.3, 3),
                      "celebration_seconds": (1, 4)}
            for key, (low, high) in limits.items():
                value = drawing[key]
                if type(value) not in (int, float) or not math.isfinite(value) or not low <= value <= high:
                    raise ValueError(f"Letter drawing {key} must be between {low} and {high}.")
        if animations.get("enabled"):
            if self.size != (240, 320):
                raise ValueError("Alphabet animations need portrait rotation 0 or 180.")
            fps, cycles = animations["fps"], animations["cycles"]
            if not math.isfinite(fps) or not 4 <= fps <= 6:
                raise ValueError("Full-screen animation FPS must be between 4 and 6.")
            if type(cycles) is not int or not 1 <= cycles <= 4:
                raise ValueError("Animation cycles must be an integer between 1 and 4.")

    @property
    def size(self):
        return (320, 240) if self.data["display"]["rotation"] in (90, 270) else (240, 320)

    @property
    def address(self):
        address = self.data["adc"]["address"]
        return int(address, 0) if isinstance(address, str) else int(address)

    @property
    def state(self):
        return self.root / ".state"

    @property
    def runtime_state(self):
        import os
        return Path(os.environ.get("MOOMIN_RUNTIME_DIR", str(self.state)))

    def path(self, section, key):
        return (self.root / self.data[section][key]).resolve()
