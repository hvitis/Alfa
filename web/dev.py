"""Prepare generated inputs and run the live website on port 8000."""
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from web.project import metadata

generated = ROOT / "web/.generated"
generated.mkdir(parents=True, exist_ok=True)
(generated / "manifest.json").write_text(json.dumps(metadata(), indent=2) + "\n")
subprocess.run(["node", "--input-type=module", "-e", """
import MarkdownIt from 'markdown-it';
import {readFile,writeFile} from 'node:fs/promises';
import {renderTeaching,teachingMarkdown} from './web/export-teaching.mjs';
await writeFile('web/.generated/adr.html', new MarkdownIt({html:false}).render(await readFile('web/content/adr.md','utf8')));
await writeFile('web/.generated/teaching-adr.html', renderTeaching(await teachingMarkdown()));
"""], cwd=ROOT, check=True)
if not (ROOT / "design/cloud-radio/generated/cloud/manifest.json").exists():
    subprocess.run(["bash", "design/cloud-radio/run-cad.sh"], cwd=ROOT, check=True)
os.chdir(ROOT)
os.execvp("node", ["node", "node_modules/vite/bin/vite.js", "--config", "web/vite.config.js"])
