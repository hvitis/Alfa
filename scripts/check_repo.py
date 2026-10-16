"""Fast configuration, documentation, workflow, and credential checks."""
import ast
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.project import ROOT, metadata


def specification_block(path):
    text = path.read_text(encoding="utf-8")
    match = re.search(r"<!-- specifications:start -->(.*?)<!-- specifications:end -->", text, re.S)
    if not match:
        raise ValueError(f"Missing specification block: {path.name}")
    return match.group(1).strip()


def check_repo():
    import yaml

    data = metadata()  # Includes runtime config and letter-path validation.
    if len(data["alphabet"]) != 32 or len(set(data["alphabet"])) != 32:
        raise ValueError("The Polish alphabet must contain 32 unique letters.")
    english = ROOT / "README.md"
    polish = ROOT / "README.pl.md"
    if specification_block(english) != specification_block(polish):
        raise ValueError("README specification tables differ.")
    for path, other in ((english, polish), (polish, english)):
        if f"]({other.name})" not in path.read_text(encoding="utf-8"):
            raise ValueError(f"Missing language switcher in {path.name}")
        for target in re.findall(r"\]\(([^)]+)\)", path.read_text(encoding="utf-8")):
            if target.startswith(("https://", "http://", "#", "mailto:")):
                continue
            if not (path.parent / target.split("#", 1)[0]).exists():
                raise ValueError(f"Missing README link target: {target}")
    # Stable feature IDs keep both translations in sync without comparing prose.
    features = [re.findall(r"<!-- feature:([a-z-]+) -->", p.read_text(encoding="utf-8")) for p in (english, polish)]
    if not features[0] or features[0] != features[1]:
        raise ValueError("README feature lists differ.")
    if len(re.findall(r"^## ", english.read_text(), re.M)) != len(re.findall(r"^## ", polish.read_text(), re.M)):
        raise ValueError("README section counts differ.")
    # Specifications must also match the real configuration, not only each other.
    specifications = specification_block(english)
    size = data["display"]
    volume = data["audio"]
    for expected in (f"{size['width']} × {size['height']}", f"{volume['initial_volume']:.0%} / {volume['max_volume']:.0%}"):
        if expected not in specifications:
            raise ValueError(f"README specifications do not match configuration: {expected}")
    files = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=ROOT
    ).decode().split("\0")
    patterns = [
        re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
        re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b"),
        re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    ]
    for name in sorted(set(files) - {""}):
        path = ROOT / name
        if not path.is_file():
            continue
        if (path.name.startswith(".env") and path.name != ".env.example") or path.name == "config.local.json" or path.suffix in {".pem", ".key"}:
            raise ValueError(f"Local configuration or key file is tracked: {name}")
        if any(part in {".venv", "node_modules", ".cad-cache"} for part in path.parts):
            continue
        if path.suffix == ".py":
            ast.parse(path.read_text(encoding="utf-8"), filename=name)
        if path.suffix == ".json":
            json.loads(path.read_text(encoding="utf-8"))
        # Report only the filename, never a matched credential.
        if path.suffix in {".py", ".js", ".mjs", ".json", ".yml", ".yaml", ".sh", ".md", ".txt", ".html"}:
            content = path.read_text(encoding="utf-8")
            if any(pattern.search(content) for pattern in patterns):
                raise ValueError(f"Potential credential in {name}. Review without sharing its value.")
    for name in ("ci.yml", "release.yml"):
        workflow = yaml.safe_load((ROOT / ".github/workflows" / name).read_text())
        if not isinstance(workflow.get("jobs"), dict):
            raise ValueError(f"Invalid workflow: {name}")
    print("PASS: configurations, Python/JSON syntax, bilingual documentation, workflows, credential patterns")


if __name__ == "__main__":
    check_repo()
