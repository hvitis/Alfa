"""Generate machine-specific links using the CAD viewer's actual URL."""
from pathlib import Path
import argparse
import json
import subprocess
import sys
from urllib.parse import quote, urlsplit

ROOT = Path(__file__).resolve().parent
FILES = [
    f"{format_name}/{name}.{extension}"
    for format_name, extension in (("STEP", "step"), ("GLB", "glb"))
    for name in ("enclosure", "exploded", "internals")
] + [f"DXF/{name}_cutting.dxf" for name in ("front", "rear", "walls", "accessories")]


def write_links(url):
    parsed = urlsplit(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc or parsed.query or parsed.fragment:
        raise ValueError("Use the base URL returned by cadgen viewer, without a query or fragment.")
    lines = [
        "# Local CAD viewer links", "",
        "These links use this machine's running CAD Viewer. STEP supports exact selection and measurements; "
        "GLB supports visual review. The portable offline planner is [viewer.html](viewer.html).", "",
    ]
    for filename in FILES:
        lines.append(f"- [{filename}]({url.rstrip('/')}/?file={quote(str(ROOT / filename), safe='')})")
    lines += ["", "Regenerate with `bash design/wooden-case/run-cad.sh python viewer_links.py` "
              "from the repository root. It starts or reuses the viewer and reads its actual URL. "
              "These absolute file links apply to this checkout only.", ""]
    (ROOT / "cad-viewer-links.md").write_text("\n".join(lines))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", help="Optional existing viewer URL, as returned by cadgen viewer.")
    args = parser.parse_args()
    url = args.url
    if url is None:
        cli = Path(sys.executable).parent / "cadgen"
        output = subprocess.check_output(
            [str(cli), "viewer", "--host", "127.0.0.1", "--json", "--detach"], text=True,
        )
        for line in output.splitlines():
            try:
                result = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(result, dict) and result.get("url"):
                url = result["url"]
        if url is None:
            raise RuntimeError("CAD Viewer did not return a URL.")
    write_links(url)
    print(f"Wrote cad-viewer-links.md for {url}")
