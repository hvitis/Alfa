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
        root = Path(root)
        # Load exactly one complete file. No presets, overrides, or hidden selection file.
        data = json.loads((Path(path) if path else root / "config.json").read_text(encoding="utf-8"))
        sections = {"display", "adc", "images", "animations", "letter_drawing", "audio", "lesson", "controls"}
        if not isinstance(data, dict):
            raise ValueError("Configuration must be a JSON object.")
        data.pop("power", None)  # Ignore the retired shutdown feature in older complete files.
        if set(data) != sections or any(not isinstance(data[key], dict) for key in sections):
            raise ValueError("Configuration must contain all sections: " + ", ".join(sorted(sections)))
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
        cap = audio.get("max_volume", 1)
        if type(cap) not in (int, float) or not math.isfinite(cap) or not 0 < cap <= 1:
            raise ValueError("Audio max_volume must be above 0.0 and at most 1.0.")
        if audio["volume"] > cap:
            raise ValueError(f"Audio volume {audio['volume']} is above max_volume {cap}.")
        controls = self.data.get("controls", {})
        hold = controls.get("exit_hold_seconds", 10)
        if type(hold) not in (int, float) or not math.isfinite(hold) or not (hold == 0 or 3 <= hold <= 60):
            raise ValueError("Controls exit_hold_seconds must be 0 (never exit) or between 3 and 60.")
        guard = controls.get("press_guard_ms", 400)
        if type(guard) not in (int, float) or not math.isfinite(guard) or not 0 <= guard <= 2000:
            raise ValueError("Controls press_guard_ms must be between 0 and 2000.")
        if not math.isfinite(audio["clip_seconds"]) or not 0.1 <= audio["clip_seconds"] <= 30:
            raise ValueError("Audio clip length must be between 0.1 and 30 seconds.")
        for section in ("images", "audio"):
            if self.path(section, "input") == self.path(section, "prepared"):
                raise ValueError("Prepared media must use a different directory from the originals.")
        animations = self.data.get("animations", {})
        lesson = self.data.get("lesson", {})
        letters = lesson.get("letters", "all")
        if letters != "all" and (not isinstance(letters, list) or not letters
                or any(not isinstance(letter, str) or letter not in list("AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ") for letter in letters)
                or len(set(letters)) != len(letters)):
            raise ValueError("Lesson letters must be all or a nonempty list of unique Polish uppercase letters.")
        invite, sleep = lesson.get("invite_seconds", 20), lesson.get("sleep_seconds", 300)
        if (any(type(value) not in (int, float) or not math.isfinite(value) for value in (invite, sleep))
                or not 1 <= invite < sleep <= 86400):
            raise ValueError("Lesson idle times need 1 <= invite_seconds < sleep_seconds <= 86400.")
        amp_pin = audio.get("shutdown_pin")
        if amp_pin is not None and (type(amp_pin) is not int or not 0 <= amp_pin <= 27
                                   or amp_pin in reserved.union(pins)):
            raise ValueError("Audio shutdown_pin must be an unused BCM GPIO, or null.")
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
            clips = animations.get("clips", {})
            if not isinstance(clips, dict):
                raise ValueError("Animation clips must be an object of timing options.")
            for name, options in clips.items():
                if not isinstance(options, dict) or set(options) - {"fps", "cycles"}:
                    raise ValueError(f"Invalid animation timing options for {name}.")
                clip_fps, clip_cycles = options.get("fps", fps), options.get("cycles", cycles)
                if type(clip_fps) not in (int, float) or not math.isfinite(clip_fps) or not 4 <= clip_fps <= 6:
                    raise ValueError(f"Animation {name} FPS must be between 4 and 6.")
                if type(clip_cycles) is not int or not 1 <= clip_cycles <= 4:
                    raise ValueError(f"Animation {name} cycles must be between 1 and 4.")

    @property
    def exit_hold(self):
        """Seconds CENTER must be held to quit a non-service run; 0 never quits."""
        return self.data.get("controls", {}).get("exit_hold_seconds", 10)

    @property
    def press_guard(self):
        """Seconds after an accepted button press during which further presses are ignored."""
        return self.data.get("controls", {}).get("press_guard_ms", 400) / 1000

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
        return Path(os.environ.get("ALFA_RUNTIME_DIR", str(self.state)))

    def path(self, section, key):
        return (self.root / self.data[section][key]).resolve()
