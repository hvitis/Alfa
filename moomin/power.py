"""Inactivity timing and safe Raspberry Pi OS power-off requests."""
import os
from pathlib import Path
import subprocess
import sys


# The installed systemd service handles this exit after resource cleanup.
IDLE_POWEROFF_STATUS = 42


class IdleTimer:
    def __init__(self, seconds, now):
        self.seconds = seconds
        self.last_active = now
        self.was_busy = False

    def expired(self, now, activity=False, busy=False):
        # Start a full idle interval when playback ends, including after a stall.
        if activity or busy or self.was_busy:
            self.last_active = now
        self.was_busy = busy
        return bool(self.seconds and now - self.last_active >= self.seconds)


def request_poweroff(simulate=False):
    if simulate:
        print("Simulation: inactivity timeout reached; system power-off skipped.")
        return 0
    model = Path("/proc/device-tree/model")
    if sys.platform != "linux" or not model.exists() or b"Raspberry Pi" not in model.read_bytes():
        raise RuntimeError("Automatic power-off requires a Raspberry Pi. Use --simulate for a preview.")
    if os.environ.get("MOOMIN_IDLE_POWEROFF") == "1":
        return IDLE_POWEROFF_STATUS
    # Interactive hardware runs use the OS policy; never ask for a password.
    result = subprocess.run(
        ["/usr/bin/systemctl", "--no-ask-password", "--no-block", "poweroff"],
        capture_output=True, text=True, timeout=10)
    if result.returncode:
        detail = result.stderr.strip() or f"systemctl exit {result.returncode}"
        raise RuntimeError(f"System shutdown failed: {detail}. Install the updated moomin.service with scripts/install-service.sh.")
    return 0
