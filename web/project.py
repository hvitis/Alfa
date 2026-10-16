"""Generate website specifications from the application configuration."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def metadata():
    from app.config import Settings
    from app.letter_paths import LetterCatalog

    settings = Settings.load()
    catalog = LetterCatalog(ROOT / "assets/letter-drawing/letters.json")
    return {
        "schema_version": 1,
        "name": "Alfa",
        "repository": "https://github.com/hvitis/Alfa",
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

