"""Exercise Make targets with stub commands; never use real Git, sudo, or systemd."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

from app.config import ROOT


@unittest.skipUnless(shutil.which("make"), "Make is required for the maintenance commands")
class UpdateAppTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "app with spaces"
        self.root.mkdir()
        self.bin = self.root / "stub-bin"
        self.bin.mkdir()
        self.calls = self.root / "calls"
        self.state = self.root / "service-state"
        self.state.write_text("active")
        (self.root / "scripts").mkdir()
        (self.root / ".venv/bin").mkdir(parents=True)
        (self.root / ".state").mkdir()
        (self.root / ".state/buttons.json").write_text("keep calibration")
        (self.root / "local-notes.txt").write_text("keep local edits")
        for source in ("Makefile", "scripts/update-app.sh", "scripts/run-app.sh"):
            shutil.copyfile(ROOT / source, self.root / source)
        self.executable(self.bin / "uname", '#!/bin/sh\nprintf "Linux\\n"\n')
        self.executable(self.bin / "sudo", '#!/bin/sh\nexec "$@"\n')
        self.executable(self.bin / "systemctl", '''#!/bin/sh
printf 'systemctl %s\n' "$*" >> "$STUB_CALLS"
case "$1" in
  is-active) test "$(cat "$STUB_STATE")" = active ;;
  stop) printf inactive > "$STUB_STATE" ;;
  start|restart) printf active > "$STUB_STATE" ;;
  *) exit 0 ;;
esac
''')
        self.executable(self.bin / "git", '''#!/bin/sh
printf 'git %s\n' "$*" >> "$STUB_CALLS"
case "$1" in
  pull) exit "${STUB_FAIL_PULL:-0}" ;;
  rev-parse) printf 'abc1234\n' ;;
  *) exit 9 ;;
esac
''')
        self.executable(self.root / ".venv/bin/python", '''#!/bin/sh
printf 'python %s\n' "$*" >> "$STUB_CALLS"
if test "$2" = app; then exit "${STUB_FAIL_RUN:-0}"; fi
exit 0
''')
        self.executable(self.root / "scripts/install-service.sh", '''#!/bin/sh
printf 'install %s\n' "$*" >> "$STUB_CALLS"
if test "${STUB_FAIL_INSTALL:-0}" != 0; then exit "$STUB_FAIL_INSTALL"; fi
sudo systemctl daemon-reload
sudo systemctl enable alfa.service
sudo systemctl restart alfa.service
sudo systemctl --no-pager status alfa.service
''')
        self.env = dict(os.environ, PATH=f"{self.bin}:{os.environ['PATH']}",
                        STUB_CALLS=str(self.calls), STUB_STATE=str(self.state))

    def executable(self, path, source):
        path.write_text(source)
        path.chmod(0o755)

    def run_make(self, *args, **environment):
        result = subprocess.run(["make", *args], cwd=self.root,
                                env={**self.env, **environment}, text=True, capture_output=True)
        events = self.calls.read_text().splitlines() if self.calls.exists() else []
        self.assertEqual((self.root / ".state/buttons.json").read_text(), "keep calibration")
        self.assertEqual((self.root / "local-notes.txt").read_text(), "keep local edits")
        return result, events

    def test_update_stops_pulls_installs_reloads_resets_and_restarts_in_order(self):
        result, events = self.run_make("update", "INSTALL_ARGS=--no-audio")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(events, ["systemctl is-active --quiet alfa.service",
            "systemctl stop alfa.service", "git pull --ff-only",
            "python -m pip install -r requirements-pi.txt",
            "systemctl reset-failed alfa.service", "install --no-audio",
            "systemctl daemon-reload", "systemctl enable alfa.service",
            "systemctl restart alfa.service", "systemctl --no-pager status alfa.service",
            "systemctl is-active --quiet alfa.service", "git rev-parse --short HEAD"])
        self.assertEqual(self.state.read_text(), "active")

    def test_failed_pull_restores_previously_running_service_and_reports_failure(self):
        result, events = self.run_make("update", STUB_FAIL_PULL="7")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Restoring the app service", result.stderr)
        self.assertEqual(events[-2:], ["systemctl reset-failed alfa.service", "systemctl start alfa.service"])
        self.assertFalse(any(event.startswith(("install", "python")) for event in events))
        self.assertEqual(self.state.read_text(), "active")

    def test_failed_install_restores_service(self):
        result, events = self.run_make("update", STUB_FAIL_INSTALL="7")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("install ", events)
        self.assertEqual(events[-1], "systemctl start alfa.service")
        self.assertEqual(self.state.read_text(), "active")

    def test_failed_update_keeps_an_initially_stopped_service_stopped(self):
        self.state.write_text("inactive")
        result, events = self.run_make("update", STUB_FAIL_PULL="7")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("systemctl start alfa.service", events)
        self.assertEqual(self.state.read_text(), "inactive")

    def test_restart_reinstalls_current_checkout_without_network_commands(self):
        result, events = self.run_make("restart")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("git pull --ff-only", events)
        self.assertFalse(any(event.startswith("python -m pip") for event in events))
        self.assertIn("systemctl daemon-reload", events)
        self.assertEqual(self.state.read_text(), "active")

    def test_reset_performs_a_complete_update(self):
        result, events = self.run_make("reset")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("git pull --ff-only", events)
        self.assertIn("systemctl restart alfa.service", events)

    def test_manual_run_releases_service_gpio_and_restores_service_after_failure(self):
        result, events = self.run_make("run", STUB_FAIL_RUN="7")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(events, ["systemctl is-active --quiet alfa.service",
            "systemctl stop alfa.service",
            "python -m app --config config.alphabet.json gallery --fullscreen",
            "systemctl reset-failed alfa.service", "systemctl start alfa.service"])
        self.assertEqual(self.state.read_text(), "active")

    def test_manual_run_does_not_start_a_service_that_was_stopped(self):
        self.state.write_text("inactive")
        result, events = self.run_make("run")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("systemctl start alfa.service", events)
        self.assertEqual(self.state.read_text(), "inactive")


if __name__ == "__main__":
    unittest.main()
