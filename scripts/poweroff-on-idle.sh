#!/bin/sh
# Installed as a root-owned file. No project code runs with root privileges.
set -eu

if [ "${SERVICE_RESULT:-}" = success ] && [ "${EXIT_CODE:-}" = exited ] && [ "${EXIT_STATUS:-}" = 42 ]; then
    exec /usr/bin/systemctl --no-block poweroff
fi
