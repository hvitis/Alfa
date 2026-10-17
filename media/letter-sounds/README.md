# Letter recordings

Every filename below now contains a recording.
The app loads selected clips at startup and reports missing or invalid files.
Use stereo, 48 kHz, 16-bit PCM WAV recordings.
CENTER starts the letter recording when a new trace begins.
Release CENTER to pause the pencil. Speech continues independently.
After the last stroke, fireworks continue without a held button.
UP slides the existing speaking character in from above, then plays `prompt.wav` with the animation.
The question is “Powiedz jaka to literka.”
DOWN randomly selects a paired animation and recording, then slides its first frame in from below.
Animation and speech start after the slide finishes.
The clapping character always uses `praise_2.wav`, imported from `brawo_2.wav`.
Hemulen inspecting a flower always uses `praise_1.wav`, imported from `brawo_1.wav`.
Both pairs have an equal chance. A new action can select the same pair again.
LEFT, RIGHT, or CENTER cancels a pending animation and its speech.

| Letter | Filename | Letter | Filename |
|---|---|---|---|
| A | `00-A.wav` | M | `16-M.wav` |
| Ą | `01-Ą.wav` | N | `17-N.wav` |
| B | `02-B.wav` | Ń | `18-Ń.wav` |
| C | `03-C.wav` | O | `19-O.wav` |
| Ć | `04-Ć.wav` | Ó | `20-Ó.wav` |
| D | `05-D.wav` | P | `21-P.wav` |
| E | `06-E.wav` | R | `22-R.wav` |
| Ę | `07-Ę.wav` | S | `23-S.wav` |
| F | `08-F.wav` | Ś | `24-Ś.wav` |
| G | `09-G.wav` | T | `25-T.wav` |
| H | `10-H.wav` | U | `26-U.wav` |
| I | `11-I.wav` | W | `27-W.wav` |
| J | `12-J.wav` | Y | `28-Y.wav` |
| K | `13-K.wav` | Z | `29-Z.wav` |
| L | `14-L.wav` | Ź | `30-Ź.wav` |
| Ł | `15-Ł.wav` | Ż | `31-Ż.wav` |

[Read the drawing lesson guide](../../assets/letter-drawing/README.md) for conversion commands, controls, and component details.

## Generate recordings on a laptop

The existing A–K recordings fill 11 slots, including the MP3 source for H.
The remaining 21 clips use the Polish Piper voice `pl_PL-gosia-medium`.
The shared prompt contains “Powiedz jaka to literka.”
The praise clips were converted from the original root recordings `brawo_1.wav` and `brawo_2.wav`.
Those originals were removed after conversion. The prepared copies remain in `media/letter-sounds/`.
The voice model card lists the source dataset as CC0:
[Polish Gosia model card](https://huggingface.co/rhasspy/piper-voices/blob/main/pl/pl_PL/gosia/medium/MODEL_CARD).

### 1. One-time environment & model setup

Install `ffmpeg` if not already installed (e.g. `brew install ffmpeg`). Then install Piper in a dedicated virtual environment (Python 3.11 or 3.12 recommended; `.venv-piper/` is gitignored):

```bash
uv venv .venv-piper --python python3.12
uv pip install piper-tts --python .venv-piper
```
*(or via standard venv: `python3 -m venv .venv-piper && .venv-piper/bin/pip install piper-tts`)*

Download the `.onnx` model and its `.onnx.json` config directly into `.venv-piper/`:

```bash
curl -L -o .venv-piper/pl_PL-gosia-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/gosia/medium/pl_PL-gosia-medium.onnx
curl -L -o .venv-piper/pl_PL-gosia-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/pl/pl_PL/gosia/medium/pl_PL-gosia-medium.onnx.json
```

### 2. Edit phrases in manifest.json

Edit the `"text"` field for any letter or prompt in [`manifest.json`](manifest.json) (for example, `"text": "p, jak Paszczak"`). Do not worry about modifying the hashes manually—the script handles them.

### 3. Run the generator

Run the offline preparation script:

```bash
.venv-piper/bin/python scripts/prepare-letter-audio.py --model .venv-piper/pl_PL-gosia-medium.onnx
```

Or using the Makefile target:

```bash
make letter-audio
```

### How regeneration works

- **Selective synthesis:** The script computes SHA-256 of the new text and compares it to `text_sha256` in `manifest.json`. Only clips with modified text are synthesized; unchanged clips and personal voice recordings are skipped.
- **Normalization:** Each generated clip is trimmed of silence, normalized to -23 LUFS loudness, shaped with soft edge fades, and saved as 48 kHz 16-bit stereo PCM WAV (`pcm_s16le`).
- **Manifest tracking:** After synthesis, the script updates both `sha256` (audio checksum) and `text_sha256` in `manifest.json`.
- **Full regeneration (`--replace`):** To force re-synthesizing all slots from manifest text regardless of cached hashes:
  ```bash
  .venv-piper/bin/python scripts/prepare-letter-audio.py --model .venv-piper/pl_PL-gosia-medium.onnx --replace
  ```
  *(or `make letter-audio AUDIO_ARGS=--replace`)*

## Replace one clip with your voice

Convert the recording to its existing slot path, for example:

```bash
ffmpeg -i my-letter-M.wav -ar 48000 -ac 2 -c:a pcm_s16le media/letter-sounds/16-M.wav
```

Record the sound first, followed by a familiar word. Keep the output volume consistent with the other clips.
Update the manifest source and hash to record the replacement.
Restart the service to reload the cached recording:

```bash
make restart
```

The same replacement process applies to `prompt.wav`, `praise_1.wav`, and `praise_2.wav`.
The generator can import new root recordings named `brawo_1.wav` and `brawo_2.wav` into the existing praise slots.
These filenames take priority over root files named `praise_1.wav` and `praise_2.wav`.
The `source_sha256` field records each imported source. An ordinary run preserves prepared copies after the sources are removed.
