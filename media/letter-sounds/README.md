# Letter recordings

Every filename below now contains a recording.
The app loads selected clips at startup and reports missing or invalid files.
Use stereo, 48 kHz, 16-bit PCM WAV recordings.
UP plays the letter recording. CENTER starts it when a new trace begins.
Release CENTER to pause the pencil. Speech continues independently.
DOWN plays `prompt.wav`, two seconds of silence, then one praise clip.
Successive presses alternate between `praise_1.wav` and `praise_2.wav`.

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
The shared prompt contains “Powiesz ze mną?”.
The praise clips use the `praise_1.wav` and `praise_2.wav` recordings from the repository root.
The voice model card lists the source dataset as CC0:
[Polish Gosia model card](https://huggingface.co/rhasspy/piper-voices/blob/main/pl/pl_PL/gosia/medium/MODEL_CARD).

Install Piper in a separate laptop environment:

```bash
python3 -m venv .venv-piper
.venv-piper/bin/python -m pip install piper-tts
```

Download the `.onnx` model and its matching `.onnx.json` from
[the voice repository](https://huggingface.co/rhasspy/piper-voices/tree/main/pl/pl_PL/gosia/medium).
Then run the offline generator:

```bash
.venv-piper/bin/python scripts/prepare-letter-audio.py --model /path/to/pl_PL-gosia-medium.onnx
```

The generator preserves existing slots. `--replace` regenerates every slot, including personal replacements.
It trims silence, normalizes loudness to -23 LUFS, and adds short fades.
It converts all output to the required PCM format. The Pi needs neither Piper nor the model.
The `manifest.json` file records each source and SHA-256 hash.
The script's `WORDS` table contains the fallback phrases. Synthesis approximates letter sounds and needs an adult listening review.

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
The generator uses root recordings for shared clips when those files exist, including with `--replace`.
