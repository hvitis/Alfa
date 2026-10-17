import math
import statistics
import time

from .media import atomic_json

STATES = ("idle", "left", "right", "up", "down", "center")


def calibration_from_samples(samples):
    if set(samples) != set(STATES):
        raise ValueError("Calibration needs idle and all five buttons.")
    centers = {}
    for name, values in samples.items():
        if len(values) < 8 or any(not math.isfinite(v) or not -0.05 <= v <= 2.7 for v in values):
            raise ValueError(f"Invalid readings for {name}. Check the divider and ADC model.")
        centers[name] = statistics.median(values)
    result = {}
    for name, center in centers.items():
        gap = min(abs(center - value) for other, value in centers.items() if other != name)
        if gap < 0.03:
            raise ValueError(f"{name} overlaps another button. Repeat calibration and hold only the requested button.")
        ordered = sorted(samples[name])
        spread = ordered[int(len(ordered) * 0.9)] - ordered[int(len(ordered) * 0.1)]
        tolerance = min(0.15, gap * 0.4)
        if spread > tolerance:
            raise ValueError(f"{name} readings are unstable. Check the wires and repeat calibration.")
        result[name] = {"voltage": center, "tolerance": tolerance}
    return result


def classify(voltage, states):
    if not math.isfinite(voltage):
        return None
    nearest = min(states, key=lambda name: abs(states[name]["voltage"] - voltage))
    state = states[nearest]
    return nearest if abs(state["voltage"] - voltage) <= state["tolerance"] else None


class Debouncer:
    """One press per stable key, followed by a stable idle before rearming."""
    def __init__(self, seconds=0.08):
        self.seconds = seconds
        self.candidate = None
        self.candidate_since = 0.0
        self.state = None
        self.armed = False

    def update(self, state, now):
        if state != self.candidate:
            self.candidate, self.candidate_since = state, now
        if state is None or now - self.candidate_since < self.seconds:
            return None
        if state == "idle":
            previous = self.state
            self.state, self.armed = "idle", True
            return ("release", previous) if previous not in (None, "idle") else None
        if self.armed:
            self.state, self.armed = state, False
            return ("press", state)
        return None


class PressGuard:
    """Ignore presses that arrive too soon after the last accepted one, so mashing counts once."""
    def __init__(self, seconds=0.4):
        self.seconds = seconds
        self.last = None

    def accept(self, now):
        if self.last is not None and now - self.last < self.seconds:
            return False
        self.last = now
        return True


def adc_identity(settings):
    return {"model": settings.data["adc"]["model"], "bus": settings.data["adc"]["bus"], "address": settings.address}


def calibrate(adc, settings):
    samples = {}
    actions = {"idle": "release all buttons", "left": "hold the button for LEFT (previous letter)",
               "right": "hold the button for RIGHT (next letter)",
               "up": "hold the button for TOP (Little My asks)",
               "down": "hold the button for BOTTOM (clapping and praise)",
               "center": "hold the button for CENTER (draw the letter)"}
    print("Face the front of the assembled case. The board can be horizontal, vertical, or reversed.")
    print("Assign buttons by their position or intended action in the case, not by the board labels.")
    print("Hold each requested button until the reading is complete. Release it before the next step.")
    for state in STATES:
        input(f"Please {actions[state]}, then press Enter here: ")
        time.sleep(0.2)
        values = []
        deadline = time.monotonic() + 1.2
        while time.monotonic() < deadline:
            values.append(adc.read_voltage())
            time.sleep(0.01)
        samples[state] = values
        print(f"  {state}: {statistics.median(values):.3f} V. Release the button.")
    states = calibration_from_samples(samples)
    path = settings.state / "buttons.json"
    atomic_json(path, {"version": 1, "adc": adc_identity(settings), "states": states})
    print(f"Button mapping saved: {path}. Repeat make mapping after moving the controls in the case.")
    return states


def load_calibration(settings):
    import json
    path = settings.state / "buttons.json"
    if not path.exists():
        raise ValueError("Buttons are not calibrated. Run: python -m app calibrate-buttons")
    data = json.loads(path.read_text())
    if data.get("version") != 1 or data.get("adc") != adc_identity(settings):
        raise ValueError("The ADC configuration changed. Run calibrate-buttons again.")
    states = data["states"]
    if set(states) != set(STATES):
        raise ValueError("Button calibration is incomplete. Run calibrate-buttons again.")
    for name, state in states.items():
        center, tolerance = state["voltage"], state["tolerance"]
        if not math.isfinite(center) or not math.isfinite(tolerance) or not -0.05 <= center <= 2.7 or not 0 < tolerance <= 0.15:
            raise ValueError(f"Invalid calibration for {name}. Run calibrate-buttons again.")
        if any(abs(center - other["voltage"]) <= tolerance + other["tolerance"] for key, other in states.items() if key != name):
            raise ValueError("Button calibration ranges overlap. Run calibrate-buttons again.")
    return states
