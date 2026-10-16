#!/usr/bin/env bash
set -euo pipefail
cloud_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$cloud_root/../wooden-case/run-cad.sh" python "$cloud_root/build.py" "$@"
