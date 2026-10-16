"""Prepare an Alfa source copy with one new commit and no inherited Git history."""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.publication import check_public_source, source_files


def export_public(destination, source=ROOT):
    source, destination = Path(source).resolve(), Path(destination).resolve()
    # Use a new directory; never replace an existing checkout or source folder.
    if destination.exists() or destination == source or destination in source.parents:
        raise ValueError("Public copy requires a new, empty destination path.")
    count = check_public_source(source)
    files = list(source_files(source))
    if any(destination == path or destination in path.parents for _, path in files):
        raise ValueError("Public copy cannot contain source files.")
    destination.mkdir(parents=True)
    for name, path in files:
        target = destination / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
    subprocess.run(['git', 'init', '-b', 'main', str(destination)], check=True, stdout=subprocess.DEVNULL)
    # Include existing tracked assets even when their directory now has an ignore rule.
    subprocess.run(['git', 'add', '--force', '--pathspec-from-file=-', '--pathspec-file-nul'],
                   cwd=destination, input='\0'.join(name for name, _ in files).encode() + b'\0', check=True)
    subprocess.run(['git', '-c', 'user.name=Alfa contributors',
                    '-c', 'user.email=contributors@users.noreply.github.com', '-c', 'commit.gpgsign=false',
                    'commit', '-m', 'Initial public Alfa source'], cwd=destination, check=True, stdout=subprocess.DEVNULL)
    print(f"Prepared {count} files with fresh Git history: {destination}")
    return destination


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', nargs='?', type=Path, default=ROOT / 'output/Alfa-public')
    args = parser.parse_args()
    export_public(args.destination)
