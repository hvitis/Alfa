#!/usr/bin/env python3
"""Laptop-only: prepare recordings and synthesize edited manifest text with offline Piper."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
# Phonetic approximations for speech synthesis. Personal recordings remain preferable.
WORDS = dict(zip(list("AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ"), [
    "a, jak arbuz", "ą, jak w słowie wąż", "b, jak balon", "c, jak cebula",
    "ć, jak ćma", "d, jak dom", "e, jak ekran", "ę, jak w słowie gęś",
    "fff, jak foka", "g, jak gitara", "ch, jak hamak", "i, jak igła",
    "j, jak jajko", "k, jak kot", "lll, jak lalka", "ł, jak łódka",
    "mmm, jak mama", "nnn, jak nos", "ń, jak w słowie koń", "o, jak oko",
    "u, ó kreskowane, jak ołówek", "p, jak pies", "rrr, jak ryba",
    "sss, jak słońce", "ś, jak ślimak", "t, jak tata", "u, jak ucho",
    "www, jak woda", "y, jak w słowie buty", "zzz, jak zebra",
    "ź, jak źrebak", "ż, jak żaba",
]))


def convert(source, target):
    # Remove leading/trailing silence, normalize each clip, and soften both edges.
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(source),
        "-af", "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,"
        "areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,"
        "loudnorm=I=-23:TP=-3:LRA=7,afade=t=in:d=0.008,areverse,afade=t=in:d=0.012,areverse",
        "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(target)], check=True)


def prepare(root, model, replace=False):
    voice = None
    catalog = json.loads((root / "assets/letter-drawing/letters.json").read_text())["letters"]
    folder = root / "media/letter-sounds"
    folder.mkdir(parents=True, exist_ok=True)
    manifest_path = folder / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {"version": 1, "recordings": {}}
    items = [(letter, root / item["audio"], WORDS[letter]) for letter, item in catalog.items()]
    shared = {"prompt": "Powiedz jaka to literka.", "praise_1": "Brawo! Pięknie!", "praise_2": "Świetnie! Dobra robota!"}
    items += [(name, folder / f"{name}.wav", text) for name, text in shared.items()]
    for letter, target, text in items:
        entry = manifest["recordings"].get(letter, {})
        # The manifest is the editable source of truth. WORDS only fills new slots.
        synthesized = entry.get("text") is not None
        if synthesized:
            text = entry["text"]
        if not isinstance(text, str) or not text.strip():
            raise ValueError(f"Empty speech text for {letter}")
        text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        personal = next((p for suffix in (".wav", ".mp3") if (p := root / "sounds" / f"literka_{letter}{suffix}").is_file()), None)
        if letter in shared:
            sources = ([root / f"brawo_{letter[-1]}.wav"] if letter.startswith("praise_") else [])
            sources.append(root / f"{letter}.wav")
            personal = next((p for p in sources if p.is_file()), None)
        if synthesized:
            personal = None
        source_hash = hashlib.sha256(personal.read_bytes()).hexdigest() if personal else None
        if target.exists() and not replace:
            audio_hash = hashlib.sha256(target.read_bytes()).hexdigest()
            if audio_hash != entry.get("sha256"):
                continue  # A person replaced this WAV after its last preparation.
            if not synthesized:
                if personal is None:
                    continue
                if (entry.get("source") == str(personal.relative_to(root))
                        and entry.get("source_sha256", source_hash) == source_hash):
                    continue
            elif entry.get("text_sha256") == text_hash:
                continue
        with tempfile.TemporaryDirectory() as directory:
            raw = Path(directory) / "voice.wav"
            if personal:
                source = personal
                provenance = str(personal.relative_to(root))
            else:
                if voice is None:
                    from piper import PiperVoice
                    voice = PiperVoice.load(str(model))
                with wave.open(str(raw), "wb") as output:
                    voice.synthesize_wav(text, output)
                source = raw
                provenance = "Piper pl_PL-gosia-medium (offline)"
            normalized = Path(directory) / "normalized.wav"
            convert(source, normalized)
            target.parent.mkdir(parents=True, exist_ok=True)
            # Write beside the destination so replacement stays atomic across filesystems.
            staged = target.with_suffix(".wav.tmp")
            staged.write_bytes(normalized.read_bytes())
            staged.replace(target)
        manifest["recordings"][letter] = {"file": str(target.relative_to(root)), "source": provenance,
            "text": text if not personal else None, "sha256": hashlib.sha256(target.read_bytes()).hexdigest()}
        if not personal:
            manifest["recordings"][letter]["text_sha256"] = text_hash
        else:
            manifest["recordings"][letter]["source_sha256"] = source_hash
        # Save each completed clip so an interrupted run can resume.
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        print(f"{letter}: {provenance}", flush=True)
    manifest["recordings"].pop("praise", None)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True, help="Downloaded Polish Piper .onnx, with matching .onnx.json")
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--replace", action="store_true", help="Regenerate all slots, including existing replacements")
    args = parser.parse_args()
    prepare(args.root, args.model, args.replace)
