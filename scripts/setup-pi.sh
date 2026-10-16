#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "$(uname -s)" != Linux ]] || ! [[ -f /proc/device-tree/model ]] || ! tr -d '\0' < /proc/device-tree/model | grep -q 'Raspberry Pi'; then
    echo "Run this script on the Raspberry Pi, from an SSH shell." >&2
    exit 1
fi

sudo apt-get update
sudo apt-get install -y python3-venv python3-pip python3-dev python3-lgpio build-essential libjpeg-dev libwebp-dev zlib1g-dev ffmpeg alsa-utils i2c-tools fonts-dejavu-core
cd -- "$project_dir"
python3 -m venv --system-site-packages .venv
.venv/bin/python -m pip install -r requirements-pi.txt
sudo usermod -aG gpio,i2c,spi,audio "$(id -un)"

cat <<'MESSAGE'
Python dependencies are installed.
Enable SPI and I2C in sudo raspi-config.
Set dtoverlay=max98357a,no-sdmode in the boot configuration.
Reboot, then reconnect over SSH so the group changes take effect.
Read README.md for the exact configuration and test commands.
MESSAGE
