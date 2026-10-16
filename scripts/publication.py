"""Select and check files for a public source snapshot."""
import re
import subprocess
from pathlib import Path

# Keep retired names out of public files, including binary metadata and paths.
RETIRED_NAME = re.compile(rb"moo" rb"min|mum" rb"ink", re.I)
PRIVATE_PARTS = {".git", ".aws", ".ssh", ".gcloud", ".state", ".venv", "node_modules", ".pnpm-store"}
PRIVATE_NAMES = {"credentials.json", "config.local.json", ".netrc", ".npmrc", ".pypirc", "id_rsa", "id_ed25519"}
PRIVATE_SUFFIXES = {".pem", ".key", ".p12", ".pfx", ".keystore", ".jks", ".kdbx", ".sqlite", ".sqlite3", ".db"}
CREDENTIALS = [
    re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----"),
    re.compile(rb"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b"),
    re.compile(rb"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
]


def source_files(root):
    root = Path(root).resolve()
    names = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=root
    ).decode().split("\0")
    for name in sorted(set(names) - {""}):
        path = root / name
        if path.is_symlink():
            raise ValueError(f"Public source cannot be a symlink: {name}")
        if not path.is_file():  # Exclude working-tree deletions.
            continue
        yield name, path


def check_public_file(name, content):
    path = Path(name)
    if path.is_absolute() or ".." in path.parts or PRIVATE_PARTS.intersection(path.parts):
        raise ValueError(f"Private or unsafe path: {name}")
    if (path.name in PRIVATE_NAMES or path.suffix.lower() in PRIVATE_SUFFIXES
            or (path.name.startswith('.env') and path.name != '.env.example')
            or '.local.' in path.name or path.name.endswith('.local')
            or '.tfstate' in path.name):
        raise ValueError(f"Private configuration or credential file: {name}")
    if RETIRED_NAME.search(name.encode()) or RETIRED_NAME.search(content):
        raise ValueError(f"Retired project or character name in: {name}")
    if any(pattern.search(content) for pattern in CREDENTIALS):
        raise ValueError(f"Potential credential in: {name}. Review without sharing its value.")


def check_public_source(root):
    count = 0
    for name, path in source_files(root):
        check_public_file(name, path.read_bytes())
        count += 1
    return count
