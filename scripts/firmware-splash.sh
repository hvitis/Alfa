#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd -- "$project_dir"
python_bin="$project_dir/.venv/bin/python"
if [[ ! -x "$python_bin" ]]; then
    python_bin="$(command -v python3)"
fi
action="${1:-prepare}"
if (($#)); then shift; fi
case "$action" in
    prepare|status) exec "$python_bin" -m app.firmware_splash "$action" "$@" ;;
    install|remove)
        dry_run=false
        for argument in "$@"; do
            if [[ "$argument" == --dry-run ]]; then dry_run=true; fi
        done
        if [[ "$action" == install ]]; then
            "$python_bin" -m app.firmware_splash prepare
        fi
        if "$dry_run"; then
            exec "$python_bin" -m app.firmware_splash "$action" "$@"
        fi
        exec sudo "$python_bin" -m app.firmware_splash "$action" "$@"
        ;;
    *) echo "Usage: bash scripts/firmware-splash.sh [prepare|install|remove|status] [--boot-dir DIR] [--dry-run]" >&2; exit 2 ;;
esac
