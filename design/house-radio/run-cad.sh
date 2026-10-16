#!/usr/bin/env bash
# Same pinned CAD toolchain as the wooden case and radio concepts; its download cache is shared.
set -euo pipefail
house_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cache="$house_dir/../wooden-case/.cad-cache"
cd -- "$house_dir"
export CADGEN_TELEMETRY=0 CADGEN_UPDATE_CHECK=0 CADGEN_DAEMON=0
export CADGEN_CACHE_DIR="${CADGEN_CACHE_DIR:-$cache/store}"
export CADGEN_STATE_DIR="${CADGEN_STATE_DIR:-$cache/state}"
export MPLCONFIGDIR="${MPLCONFIGDIR:-$cache/matplotlib}"
export UV_CACHE_DIR="${UV_CACHE_DIR:-$cache/uv}"
export UV_TOOL_DIR="${UV_TOOL_DIR:-$cache/tools}"
tool="${1:?Use python or cadgen followed by the script or CAD command}"
shift
case "$tool" in
  python|cadgen) uvx --no-config --python 3.13 --from cadgen==0.7.21 "$tool" "$@" ;;
  *) echo "Use python or cadgen." >&2; exit 2 ;;
esac
