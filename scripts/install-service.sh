#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
service_user="${SUDO_USER:-$(id -un)}"
dry_run=false
audio_args=()
while (($#)); do
    case "$1" in
        --dry-run) dry_run=true; shift ;;
        --no-audio) audio_args=(--no-audio); shift ;;
        --user) service_user="${2:?Provide a service user}"; shift 2 ;;
        *) echo "Usage: bash scripts/install-service.sh [--dry-run] [--no-audio] [--user pi]" >&2; exit 2 ;;
    esac
done

python_bin="$project_dir/.venv/bin/python"
if [[ ! -x "$python_bin" ]]; then
    python_bin="$(command -v python3)"
fi
cd -- "$project_dir"
if "$dry_run"; then
    "$python_bin" -m app.service --project "$project_dir" --user "$service_user" --python "$python_bin" ${audio_args[@]+"${audio_args[@]}"}
    "$python_bin" -m app.service --project "$project_dir" --user "$service_user" --python "$python_bin" --splash
    exit 0
fi
if [[ "$(uname -s)" != Linux ]] || [[ ! -f /proc/device-tree/model ]] || ! tr -d '\0' < /proc/device-tree/model | grep -q 'Raspberry Pi'; then
    echo "Run this installer on the Raspberry Pi. Use --dry-run to inspect its unit elsewhere." >&2
    exit 1
fi
if [[ "$service_user" == root ]] || ! id "$service_user" >/dev/null 2>&1; then
    echo "Choose the non-root hardware user with --user pi." >&2
    exit 1
fi
"$python_bin" -c 'import PIL, gpiozero, lgpio, spidev, smbus2'
"$python_bin" -c 'from app.config import Settings; from app.buttons import load_calibration; load_calibration(Settings.load("config.standalone.json"))'
"$python_bin" -m app --config config.standalone.json prepare --wire-only
"$python_bin" -m app.splash --config config.standalone.json --prepare
"$python_bin" -m app --config config.standalone.json --simulate player --fullscreen --prepared-only --once ${audio_args[@]+"${audio_args[@]}"}

unit_dir="$(mktemp -d)"
unit_path="$unit_dir/alfa.service"
splash_unit_path="$unit_dir/alfa-splash.service"
trap 'rm -f -- "$unit_path" "$splash_unit_path"; rmdir -- "$unit_dir"' EXIT
"$python_bin" -m app.service --project "$project_dir" --user "$service_user" --python "$python_bin" ${audio_args[@]+"${audio_args[@]}"} > "$unit_path"
"$python_bin" -m app.service --project "$project_dir" --user "$service_user" --python "$python_bin" --splash > "$splash_unit_path"
systemd-analyze verify "$unit_path" "$splash_unit_path"
sudo install -m 0644 "$unit_path" /etc/systemd/system/alfa.service
sudo install -m 0644 "$splash_unit_path" /etc/systemd/system/alfa-splash.service
sudo systemctl daemon-reload
sudo systemctl enable alfa.service alfa-splash.service
sudo systemctl restart alfa.service
sudo systemctl --no-pager status alfa.service
