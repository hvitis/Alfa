"""Local systemd notifications and a portable service-unit renderer."""
import argparse
import os
from pathlib import Path
import re
import socket
import time


class ServiceWatchdog:
    def __init__(self):
        self.address = os.environ.get("NOTIFY_SOCKET")
        usec = int(os.environ.get("WATCHDOG_USEC", "0"))
        pid = int(os.environ.get("WATCHDOG_PID", str(os.getpid())))
        self.interval = min(5, usec / 2_000_000) if usec > 0 and pid == os.getpid() else 0
        self.next = 0

    def notify(self, message):
        if self.address:
            address = "\0" + self.address[1:] if self.address.startswith("@") else self.address
            with socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM) as connection:
                connection.settimeout(.25)
                connection.sendto(message.encode(), address)

    def ready(self):
        self.notify("READY=1\nWATCHDOG=1")
        self.next = time.monotonic() + self.interval

    def tick(self):
        if self.address and self.interval and time.monotonic() >= self.next:
            self.notify("WATCHDOG=1")
            self.next = time.monotonic() + self.interval


def render_unit(project, user, python, no_audio=False, splash=False):
    if not re.fullmatch(r"[a-z_][a-z0-9_-]*\$?", user) or user == "root":
        raise ValueError("Choose a non-root Linux user, such as pi.")
    project = str(project)
    if not Path(project).is_absolute() or any(character in project for character in ("\n", "\r", "\0")) or project != project.strip():
        raise ValueError("Choose an absolute project path without surrounding whitespace or control characters.")
    # WorkingDirectory parses one complete path, not an ExecStart argument list.
    # Literal surrounding quotes make that path non-absolute in systemd.
    working_directory = project.replace("%", "%%")
    def quote(value):
        value = str(value)
        if "\n" in value or "\r" in value:
            raise ValueError("Service paths cannot contain newlines.")
        return '"' + value.replace("\\", "\\\\").replace('"', '\\"').replace("%", "%%") + '"'
    if splash:
        return f"""[Unit]
Description=Moomin early boot splash
DefaultDependencies=no
After=systemd-udevd.service
Before=moomin.service shutdown.target
Conflicts=shutdown.target
RequiresMountsFor=/usr {quote(project)} {quote(python)}
ConditionPathExists={working_directory}/.state/boot-splash.bin

[Service]
Type=notify
NotifyAccess=main
User={user}
WorkingDirectory={working_directory}
ExecStart={quote(python)} -u -m app.splash --config config.standalone.json
RuntimeDirectory=moomin-splash
RuntimeDirectoryMode=0750
Environment=PYTHONDONTWRITEBYTECODE=1
TimeoutStartSec=15
TimeoutStopSec=2
Restart=no
NoNewPrivileges=true
RestrictAddressFamilies=AF_UNIX
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=sysinit.target
"""
    command = f"{quote(python)} -u -m app --config config.standalone.json player --fullscreen --standalone --prepared-only --autoplay"
    if no_audio:
        command += " --no-audio"
    return f"""[Unit]
Description=Moomin offline alphabet player
After=local-fs.target sound.target moomin-splash.service
StartLimitIntervalSec=0

[Service]
Type=notify
NotifyAccess=main
User={user}
WorkingDirectory={working_directory}
ExecStart={command}
Restart=always
RestartSec=5
WatchdogSec=30
WatchdogSignal=SIGTERM
TimeoutStartSec=30
TimeoutStopSec=10
KillMode=control-group
RuntimeDirectory=moomin
RuntimeDirectoryMode=0750
Environment=MOOMIN_RUNTIME_DIR=/run/moomin
Environment=PYTHONDONTWRITEBYTECODE=1
StandardInput=null
StandardOutput=journal
StandardError=journal
LogRateLimitIntervalSec=60
LogRateLimitBurst=20
Nice=5
CPUAccounting=true
MemoryAccounting=true
NoNewPrivileges=true
PrivateTmp=true
RestrictAddressFamilies=AF_UNIX

[Install]
WantedBy=multi-user.target
"""


def main():
    parser = argparse.ArgumentParser(description="Render the offline Raspberry Pi service.")
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--user", required=True)
    parser.add_argument("--python", type=Path, required=True)
    parser.add_argument("--no-audio", action="store_true")
    parser.add_argument("--splash", action="store_true", help="Render the early boot splash service.")
    args = parser.parse_args()
    print(render_unit(args.project.resolve(), args.user, args.python.absolute(), args.no_audio, args.splash), end="")


if __name__ == "__main__":
    main()
