# Build guide

The project contains a Python hardware app, a static showcase, and separate CAD research tools.
The default distribution builds the app and showcase. CAD generation is a separate task.

## Prerequisites

- Python 3.12 or newer. CI uses Python 3.12.
- Node.js 22 and npm.
- Make and Git.
- FFmpeg for recording conversion and audio integration tests.

On Debian or Ubuntu, install FFmpeg with `sudo apt-get install ffmpeg`.
On macOS, use `brew install ffmpeg`.

## Development environment

Run these commands from the repository root:

```bash
make install
make check
make smoke
```

`make install` creates `.venv`, installs Python dependencies, runs `npm ci`, and installs Chromium.
On Linux, install browser OS dependencies with `npx playwright install --with-deps chromium`.
On Windows, use WSL2 for Make and the shell scripts.

To select a Python version, create the environment first with `python3.12 -m venv .venv`.
Then run the installation commands from the Makefile separately.
Use `make check PYTHON=python` when an activated environment supplies Python.

## Static showcase

```bash
make site
make serve
```

Open `http://127.0.0.1:8000`. HTTP serves the JSON manifest. Opening `index.html` through `file://` cannot load that manifest reliably.
The exporter reads the default configuration and letter paths. It copies no private photos, recordings, or character artwork.
All website sources and generation tools live in `web/`. Vite bundles Three.js, Mermaid, and the CAD viewer meshes into `_site/`.
The export uses relative URLs and includes library license text. It has no backend or runtime CDN dependencies.

## Runtime distribution

```bash
make build
.venv/bin/python -c "from scripts.package import validate_release_kit; validate_release_kit('output')"
```

The build runs repository checks, Python tests, viewer data tests, browser checks, and the packaged simulator.
The archive uses sorted entries, fixed timestamps, and explicit permissions.
Identical staged bytes produce an identical archive. Toolchain changes can change generated PNG bytes.
The manifest records the actual Python, Node.js, and Pillow versions, commit, and dirty state.

`make clean` deletes only publication outputs. It preserves existing wiring illustrations and unrelated files in `output/`.

## Hardware and CAD

Read [HARDWARE-GUIDE.md](HARDWARE-GUIDE.md) for Pi installation, calibration, media, and physical checks.
Read [the viewer guide](../web/hardware-visualisation/README.md) for the existing FastAPI and Three.js development viewer.
That viewer requires its own dependencies and generated design assets.

Read the build instructions for the [plywood case](../design/wooden-case/README.md),
[radio concepts](../design/wooden-radio/README.md), and [house radio](../design/house-radio/README.md).
Those scripts use the pinned CAD toolchain through their `run-cad.sh` wrappers.
Their geometric checks and fabrication outputs do not run in the software release pipeline.
