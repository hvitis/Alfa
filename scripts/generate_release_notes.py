"""Generate release notes only from a validated distribution."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.package import KIT_NAME, validate_release_kit
from scripts.project import ROOT
from scripts.verify_release_ref import SEMVER


if __name__ == "__main__":
    tag = sys.argv[1]
    if not SEMVER.fullmatch(tag):
        raise SystemExit("Expected a SemVer tag.")
    manifest = validate_release_kit(ROOT / "output")
    print(f"Moomin Radio {tag}\n")
    print("Python runtime and offline showcase with an original geometric demo card.\n")
    print("Unzip the build kit and read START-HERE.md. Existing character artwork, recordings, and CAD exports are excluded.\n")
    print(f"Commit: `{manifest['git_commit']}`\n")
    print(f"Archive: `{KIT_NAME}`\n")
    print(f"SHA-256: `{manifest['artifacts'][KIT_NAME]['sha256']}`\n")
    print("Validation reports and the core electronics BOM are attached. Hardware still requires physical verification.")
