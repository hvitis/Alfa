# Moomin Radio build kit

The kit contains the Python runtime and a backend-free showcase with original demo graphics.
It includes no existing character artwork, recordings, research viewer, or generated fabrication files.

## Run the simulator

From the extracted kit, run:

```bash
cd runtime
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m app --simulate player --once --no-audio
```

Open `.state/preview/current.png` to see the neutral demo card in the player.
Add your own images in `imgs/` and recordings in `sounds/`.
Install FFmpeg before audio preparation. Then run `python -m app prepare`.
The alphabet character animations are optional repository features and are absent from this kit.

For Pi hardware installation, run `bash scripts/setup-pi.sh` on the Pi.
Read `runtime/docs/wiring.md` before connecting hardware.
The complete instructions remain in the source repository's `docs/HARDWARE-GUIDE.md`.
Service installation requires prepared user media and its configuration. Follow the source repository's standalone guide.

## View the showcase

From the extracted kit root, run:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory site
```

Open `http://127.0.0.1:8000`.
The showcase uses only local runtime assets. Repository links require internet access.

## Archive layout

| Path | Contents |
| --- | --- |
| `runtime/app/` | Python app and drivers. |
| `runtime/config.json` | Default wiring and volume configuration. |
| `runtime/media/images/` | One original geometric demo card and its manifest. |
| `runtime/scripts/` | Pi dependency installation script. |
| `runtime/docs/wiring.md` | Wiring reference. |
| `site/` | Static showcase, SVG illustration, and generated specifications. |
| `LICENSE`, `THIRD_PARTY_NOTICES.md` | Code license and asset exclusions. |
| `checksums.json` | SHA-256 of every other ZIP entry. |

The release attachments include build provenance, validation results, and the core electronics BOM.
The source repository contains tests and build tools. This archive is a runtime distribution.
