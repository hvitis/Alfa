#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd -- "$project_dir"
python_bin="$project_dir/.venv/bin/python"
if [[ ! -x "$python_bin" ]]; then
    echo "The Pi virtual environment is missing. Run bash scripts/setup-pi.sh first." >&2
    exit 1
fi
was_running=false
if systemctl is-active --quiet moomin.service; then
    was_running=true
fi
restore_service() {
    result=$?
    if "$was_running"; then
        sudo systemctl reset-failed moomin.service || true
        sudo systemctl start moomin.service || true
    fi
    exit "$result"
}
trap restore_service EXIT
sudo systemctl stop moomin.service
"$python_bin" -m app --config config.alphabet.json gallery --fullscreen
