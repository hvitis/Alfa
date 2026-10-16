"""Speaker-focused diagnostics, with optional LCD status and saved reports."""
import json
import math
import os
import shutil
import subprocess
import sys
import time
import traceback
import wave
from array import array
from contextlib import ExitStack
from datetime import datetime, timezone
from pathlib import Path

from .audio import AudioPlayer, audio_device
from .hardware import PreviewDisplay, ST7789
from .media import atomic_json, prepare_audio
from .ui import speaker_status_frame


class TestReport:
    def __init__(self, settings, verbose=False):
        self.started = time.monotonic()
        self.verbose = verbose
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        directory = settings.state / "diagnostics"
        directory.mkdir(parents=True, exist_ok=True)
        self.path = directory / f"speaker-{stamp}-{os.getpid()}.log"
        self.stream = self.path.open("w")
        self.data = {"started_utc": datetime.now(timezone.utc).isoformat(), "events": [], "hearing_confirmed": False}

    def emit(self, stage, message, detail=False):
        elapsed = round(time.monotonic() - self.started, 3)
        line = f"[{elapsed:7.2f}s] {stage:10s} {message}"
        self.stream.write(line + "\n")
        self.stream.flush()
        self.data["events"].append({"elapsed": elapsed, "stage": stage, "message": message})
        if self.verbose or not detail:
            print(line, flush=True, file=sys.stderr if stage == "ERROR" else sys.stdout)

    def finish(self, outcome):
        self.data["outcome"] = outcome
        self.data["elapsed_seconds"] = round(time.monotonic() - self.started, 3)
        self.emit("REPORT", f"Log: {self.path}")
        self.emit("REPORT", f"JSON: {self.path.with_suffix('.json')}")
        self.stream.close()
        atomic_json(self.path.with_suffix(".json"), self.data)


def inspect_wav(path):
    """Read PCM data so an empty, truncated or silent file cannot look like a speaker success."""
    with wave.open(str(path), "rb") as source:
        channels, rate, bits = source.getnchannels(), source.getframerate(), source.getsampwidth() * 8
        frames = source.getnframes()
        if channels != 2 or bits != 16 or source.getcomptype() != "NONE" or rate != 48000:
            raise ValueError("Prepared sound must be stereo 48 kHz 16-bit PCM WAV. Run prepare --force.")
        if frames <= 0:
            raise ValueError("The prepared sound file contains no samples.")
        peak, squares, count = 0, 0, 0
        while payload := source.readframes(8192):
            samples = array("h", payload)
            if sys.byteorder != "little":
                samples.byteswap()
            for value in samples:
                peak = max(peak, abs(value))
                squares += value * value
            count += len(samples)
        if count != frames * channels:
            raise ValueError("The prepared WAV is truncated. Run prepare --force.")
    rms = math.sqrt(squares / count) / 32768
    return {"path": str(path), "seconds": frames / rate, "frames": frames, "rate": rate,
            "channels": channels, "bits": bits, "peak": peak / 32768,
            "rms_dbfs": round(20 * math.log10(rms), 2) if rms else None}


def make_test_tone(settings, seconds=2):
    """Create a known 440 Hz stereo WAV without touching the user's sounds."""
    path = settings.state / "speaker-test-tone.wav"
    path.parent.mkdir(parents=True, exist_ok=True)
    rate, count = 48000, int(48000 * seconds)
    samples = array("h")
    for index in range(count):
        fade = min(1, index / (rate * .05), (count - 1 - index) / (rate * .05))
        value = round(32767 * .35 * fade * math.sin(2 * math.pi * 440 * index / rate))
        samples.extend((value, value))
    if sys.byteorder != "little":
        samples.byteswap()
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes(samples.tobytes())
    return path


def run_speaker_test(settings, *, simulate=False, volume=None, device=None, track=0,
                     with_screen=False, verbose=False, repeat=1, pause=1, hold=3, tone=False, debug=False):
    volume = settings.data["audio"]["volume"] if volume is None else volume
    if not math.isfinite(volume) or not 0 <= volume <= 1:
        raise ValueError("Volume must be between 0 and 1.")
    if repeat < 1 or track < 0:
        raise ValueError("Repeat must be at least 1; track must be 0 or more.")
    if any(not math.isfinite(value) or value < 0 for value in (pause, hold)):
        raise ValueError("Pause and hold durations must be finite and nonnegative.")
    report = TestReport(settings, verbose)
    report.data.update({"simulation": simulate, "with_screen": with_screen, "volume": volume,
                        "repetitions": repeat, "playbacks": []})
    outcome, exit_code = "error", 1
    display = player = None
    phase = "startup"

    def show(status, lines=(), progress=None, error=False, name="speaker-current"):
        if display:
            display.show(speaker_status_frame(settings.size, status, lines, progress, error), name)

    def wait(seconds):
        deadline = time.monotonic() + seconds
        while time.monotonic() < deadline:
            time.sleep(min(.1, max(0, deadline - time.monotonic())))

    try:
        with ExitStack() as resources:
            try:
                report.emit("START", "Speaker test" + (" with LCD status" if with_screen else ""))
                report.emit("MODE", "SIMULATION: no GPIO, SPI or ALSA output" if simulate else "Raspberry Pi hardware")
                report.emit("VOLUME", f"{volume:.0%} digital volume; {repeat} playback(s)")
                report.emit("WIRING", "max4 header: LRC, BCLK, DIN, GAIN, SD, GND, VIN", detail=True)
                report.emit("WIRING", "LRC -> physical 35 / GPIO19; BCLK -> physical 12 / GPIO18; DIN -> physical 40 / GPIO21", detail=True)
                report.emit("WIRING", "VIN -> physical 2 / 5 V; GND -> physical 9; speaker +/- -> amplifier +/-; GAIN and SD unwired", detail=True)
                if with_screen:
                    phase = "LCD initialization"
                    report.emit("LCD", "Opening SPI0/CE0. BL uses GPIO24 (physical 18); audio BCLK uses GPIO18 (physical 12).")
                    display = PreviewDisplay(settings) if simulate else ST7789(settings)
                    resources.callback(display.close)
                    show("Preparing audio", ["Speaker is the main test.", f"Volume: {volume:.0%}", "See the SSH log."], name="speaker-start")
                phase = "audio preparation"
                for program in ("ffmpeg", "ffprobe", "aplay"):
                    path = shutil.which(program)
                    report.emit("TOOL", f"{program}: {path or 'not installed'}", detail=True)
                if not shutil.which("ffmpeg"):
                    raise RuntimeError("ffmpeg is missing. Install it with sudo apt install ffmpeg.")
                if tone:
                    path = make_test_tone(settings)
                    report.emit("SOUND", "Generated a 2-second 440 Hz diagnostic tone; original sounds are unchanged.")
                else:
                    sounds = prepare_audio(settings)
                    if track >= len(sounds):
                        raise ValueError(f"Track must be between 0 and {len(sounds) - 1}.")
                    path = sounds[track]
                    report.emit("SOUND", f"Track {track}: {path}")
                info = inspect_wav(path)
                report.data["sound"] = info
                report.emit("FORMAT", f"{info['seconds']:.2f} s; {info['rate']} Hz; {info['bits']}-bit PCM; {info['channels']} channels")
                if info["peak"] == 0:
                    raise ValueError("The sound file is silent: all samples are zero. Try --tone or another sound.")
                report.emit("SIGNAL", f"Source peak {info['peak']:.1%}; RMS {info['rms_dbfs']:.2f} dBFS; output peak after volume about {info['peak'] * volume:.1%}", detail=True)
                if info["rms_dbfs"] < -30:
                    report.emit("NOTE", "This file has a low average signal level. Use --tone if the sound is hard to hear.")
                if volume == 0:
                    report.emit("NOTE", "Volume is zero: this run produces no audible sound.")
                phase = "ALSA device selection"
                selected = "simulation" if simulate else audio_device(device or settings.data["audio"]["device"])
                report.data["device"] = selected
                report.emit("DEVICE", selected)
                player = AudioPlayer(settings, simulate, volume, selected, verbose,
                                     report=lambda message: report.emit("PLAYER", message, detail=True))
                resources.callback(player.close)
                for number in range(1, repeat + 1):
                    phase = f"playback {number}/{repeat}"
                    report.emit("PLAY", f"{number}/{repeat}: {path.name}")
                    show(f"Playing {number}/{repeat}", [path.name, f"Volume: {volume:.0%}", f"{info['seconds']:.1f}s / stereo 48kHz", "Listen for the sound."], 0, name=f"speaker-playing-{number}")
                    player.play(path)
                    started, tick = time.monotonic(), -1
                    deadline = started + info["seconds"] + 10
                    while player.playing:
                        elapsed = time.monotonic() - started
                        if time.monotonic() > deadline:
                            raise RuntimeError("Playback timed out. Check the ALSA device or another program that uses the sound card.")
                        if int(elapsed) != tick:
                            tick = int(elapsed)
                            report.emit("PROGRESS", f"Playback {number}/{repeat}; elapsed {elapsed:.1f}s / clip {info['seconds']:.1f}s", detail=True)
                            show(f"Playing {number}/{repeat}", [path.name, f"Volume: {volume:.0%}", f"Elapsed: {elapsed:.1f}s", "Listen for the sound."], elapsed / info["seconds"], name=f"speaker-playing-{number}")
                        time.sleep(.05)
                    elapsed = time.monotonic() - started
                    code = None if simulate else player.last_returncode
                    report.data["playbacks"].append({"number": number, "elapsed": round(elapsed, 3), "aplay_exit": code})
                    report.emit("FINISHED", f"Playback {number}/{repeat}: " + ("simulation finished" if simulate else f"aplay exited with code {code}"))
                    if not simulate and player.log_path.exists():
                        details = player.log_path.read_text(errors="replace")[-6000:].strip()
                        if details:
                            report.emit("ALSA", details, detail=True)
                        report.data["alsa_log"] = str(player.log_path)
                    if number < repeat:
                        report.emit("PAUSE", f"{pause:g} seconds before the next playback", detail=True)
                        show("Pause", [f"Finished {number}/{repeat}", f"Next in {pause:g} seconds"])
                        wait(0 if simulate else pause)
                phase = "result display"
                show("Playback finished", [f"{repeat} playback(s) completed.", "Did you hear the sound?", "Check the SSH log.", "Sound needs your confirmation."], 1, name="speaker-finished")
                report.emit("RESULT", "Simulation finished; no physical speaker test." if simulate else "Audio software finished. Confirm that you heard sound; the program cannot measure the speaker.")
                wait(0 if simulate else hold)
                phase = "resource cleanup"
                outcome, exit_code = ("simulation_finished" if simulate else "playback_finished"), 0
            except (OSError, ValueError, RuntimeError, ImportError, subprocess.TimeoutExpired, wave.Error, EOFError) as error:
                report.data["failed_stage"] = phase
                if player:
                    player.stop()
                report.emit("ERROR", f"During {phase}: {error}")
                if display:
                    try:
                        show("Test failed", [phase, str(error), "See the SSH log."], error=True, name="speaker-error")
                        wait(0 if simulate else min(hold, 3))
                    except Exception as screen_error:
                        report.emit("LCD", f"Cannot display error: {screen_error}")
                raise
    except KeyboardInterrupt:
        outcome, exit_code = "interrupted", 130
        report.emit("STOPPED", "Ctrl+C or stop signal received. Audio and display resources released.")
    except (OSError, ValueError, RuntimeError, ImportError, subprocess.TimeoutExpired, wave.Error, EOFError) as error:
        outcome, exit_code = "error", 1
        report.data.setdefault("failed_stage", phase)
        report.data["error"] = str(error)
        if not any(event["stage"] == "ERROR" for event in report.data["events"]):
            report.emit("ERROR", f"During {phase}: {error}")
        report.emit("NEXT", "Run aplay -l. Check the MAX98357A overlay and wires. Try --tone to isolate the sound file.")
        if debug:
            traceback.print_exc()
    finally:
        report.finish(outcome)
    return exit_code
