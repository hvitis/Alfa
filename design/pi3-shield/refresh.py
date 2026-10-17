#!/usr/bin/env python3
"""Refresh manufacturing and website assets from the committed routed PCB."""
from pathlib import Path
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

from assets import ROOT, GENERATED, IMAGE, SOURCE_NAMES, source_hashes, record


def refresh_inside():
    # Stage all exports; a failed export preserves the previous complete snapshot.
    before = source_hashes()
    with tempfile.TemporaryDirectory(prefix="alfa-pcb-") as temporary:
        stage = Path(temporary)
        subprocess.run([sys.executable, str(ROOT / "export.py"), "--output", str(stage)], check=True)
        subprocess.run([sys.executable, str(ROOT / "check_design.py"), "--output", str(stage)], check=True)
        from export import archive
        archive(stage)
        if before != source_hashes():
            raise RuntimeError("PCB sources changed during export. Run make pcb again.")
        # Manifest hashes refer to the completed directory rather than temporary paths.
        GENERATED.mkdir(exist_ok=True)
        for item in list(GENERATED.iterdir()):
            if item.is_dir():shutil.rmtree(item)
            else:item.unlink()
        for item in stage.iterdir():
            target=GENERATED/item.name
            if item.is_dir():shutil.copytree(item,target)
            else:shutil.copy2(item,target)
        record()
    print("PCB exports refreshed: design/pi3-shield/generated", flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inside",action="store_true",help="Run with KiCad already available")
    args=parser.parse_args()
    if args.inside:
        refresh_inside()
        return
    if not shutil.which("docker"):
        raise SystemExit("Docker is required for PCB exports. Install Docker, start it, then run make pcb.")
    repository=ROOT.parents[1]
    subprocess.run(["docker","run","--rm","--platform","linux/amd64",
                    "--user",f"{os.getuid()}:{os.getgid()}",
                    "-e","HOME=/tmp","-e","XDG_CACHE_HOME=/tmp/.cache",
                    "-v",f"{repository}:/workspace","-w","/workspace",
                    "--entrypoint","python3",IMAGE,
                    "design/pi3-shield/refresh.py","--inside"],check=True)


if __name__=="__main__":main()
