"""Shared metadata for the small, backend-free public showcase."""
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def metadata():
    from app.config import Settings
    from app.letter_paths import LetterCatalog

    settings = Settings.load()
    catalog = LetterCatalog(ROOT / "assets/letter-drawing/letters.json")
    return {
        "schema_version": 1,
        "name": "Moomin Radio",
        "repository": "https://github.com/hvitis/moomin",
        "license": "MIT (original code and documentation)",
        "display": {"width": settings.size[0], "height": settings.size[1], "driver": "ST7789"},
        "audio": {"initial_volume": settings.data["audio"]["volume"], "max_volume": settings.data["audio"]["max_volume"]},
        "buttons": 5,
        "alphabet": list(catalog.letters),
        "hardware": [
            {"part": "Raspberry Pi 3", "quantity": 1, "interface": "Linux controller"},
            {"part": "ST7789 2-inch LCD", "quantity": 1, "interface": "SPI, 240 x 320"},
            {"part": "MAX98357A amplifier", "quantity": 1, "interface": "I2S"},
            {"part": "Speaker", "quantity": 1, "interface": "Amplifier OUT+ / OUT-"},
            {"part": "ADS1115 or ADS1015", "quantity": 1, "interface": "I2C, A0 input"},
            {"part": "Five-button analog keypad", "quantity": 1, "interface": "Resistor ladder"},
            {"part": "10 kOhm divider resistor", "quantity": 2, "interface": "Keypad OUT to ADC A0"},
        ],
    }


def timestamp():
    return datetime.now(timezone.utc).isoformat()
