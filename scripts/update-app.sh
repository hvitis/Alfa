#!/usr/bin/env bash
# Stop the app before updating files, then reload the installed service.
set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
pull_changes=true
installer_args=()
while (($#)); do
    case "$1" in
        --no-pull) pull_changes=false; shift ;;
        --no-audio) installer_args+=(--no-audio); shift ;;
        --user) installer_args+=(--user "${2:?Provide a service user}"); shift 2 ;;
        *) echo "Usage: bash scripts/update-app.sh [--no-pull] [--no-audio] [--user pi]" >&2; exit 2 ;;
    esac
done

if [[ "$(uname -s)" != Linux ]] || ! command -v systemctl >/dev/null; then
    echo "Run make update on the Raspberry Pi, from its project directory." >&2
    exit 1
fi
cd -- "$project_dir"
python_bin="$project_dir/.venv/bin/python"
if [[ ! -x "$python_bin" ]]; then
    echo "The Pi virtual environment is missing. Run bash scripts/setup-pi.sh first." >&2
    exit 1
fi

# If the pull or installation fails, do not leave a previously running app stopped.
was_running=false
if systemctl is-active --quiet alfa.service; then
    was_running=true
fi
restore_on_failure() {
    result=$?
    if ((result != 0)) && "$was_running"; then
        echo "Update failed. Restoring the app service." >&2
        sudo systemctl reset-failed alfa.service || true
        sudo systemctl start alfa.service || true
    fi
    exit "$result"
}
trap restore_on_failure EXIT

sudo systemctl stop alfa.service
if "$pull_changes"; then
    # Never discard local calibration, configuration, recordings, or code edits.
    git pull --ff-only
    "$python_bin" -m pip install -r requirements-pi.txt
fi
sudo systemctl reset-failed alfa.service
bash scripts/install-service.sh ${installer_args[@]+"${installer_args[@]}"}
systemctl is-active --quiet alfa.service
if revision="$(git rev-parse --short HEAD 2>/dev/null)"; then
    echo "Newest local revision: $revision"
fi
echo "App updated and running. Press CENTER to draw the selected letter."
