"""Shared bridge to PCB freshness checks for website entry points."""
import importlib.util
from pathlib import Path


def ensure_pcb_assets():
    script=Path(__file__).resolve().parents[2]/"design/pi3-shield/assets.py"
    spec=importlib.util.spec_from_file_location("alfa_pcb_assets",script)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ensure()
