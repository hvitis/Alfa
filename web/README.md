# Static build atlas

All website source, content, generation, and browser checks live in this folder.
The generated GitHub Pages directory is `_site/` at the repository root. It is ignored by Git.

## Build and preview

From the repository root:

```bash
make install
make site
make serve
```

Open `http://127.0.0.1:8000`. Run `make smoke` for desktop/mobile Chromium checks at `/` and `/repo-preview/`.
The Pages workflow publishes `_site/` after those checks pass on `main`.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html`, `style.css`, `app.js` | The four-tab interface, routing, dropdowns, and document views. |
| `viewer.js` | Shared Three.js canvas, camera, selection, and model lifecycle. |
| `software.js` | Lazy Mermaid renderer. |
| `content/adr.md` | Architecture decision record for the current Python app. |
| `content/architecture.mmd` | Canonical Mermaid diagram source. |
| `project.py` | Specifications generated from application configuration. |
| `build.py`, `build.mjs`, `vite.config.js` | Data generation, Markdown rendering, asset bundling, and static export. |
| `tests/` | JavaScript syntax checks and browser smoke checks. |
| `hardware-visualisation/src/` | Reused CAD meshes, routing data, controller models, and scene components. |
| `hardware-visualisation/case-planner/` | Legacy standalone case planner sources, also relocated from `design/`. |
| `.generated/` | Temporary manifest and rendered ADR, ignored by Git. |

## Views

- **Plywood:** Little House Radio and the original case, with assembly modes, orbit controls, wood visibility, and labels.
- **3DPrint:** PETG cloud enclosure, assembly views, frame IDs, hover names, fit allowances, STL/STEP/ZIP downloads, and geometry checks.
- **Hardware:** Complete Raspberry Pi and Pico wiring atlases, circuit filters, and selectable wire endpoints.
- **Software:** A Design dropdown shows the ADR. Implementation shows the rendered Mermaid architecture.

Hash links (`#plywood`, `#3dprint`, `#hardware`, `#software`) work with a plain static server.
All JavaScript, styles, meshes, and documents use local relative URLs. No backend or CDN is required.
Three.js and Mermaid load only when their views need them. Library license text is included in the export.

The CAD meshes are committed viewer inputs. The static build does not run CAD tools or generate fabrication PDFs.
The cloud assets are generated with `make cloud` and committed under `design/cloud-radio/generated/cloud/`.
Run `make dev` for the website at port 8000 with automatic cloud CAD rebuilds and browser refresh.
Run `make stress` after `make site` for 100 cloud view, tab, and viewport cycles.
Use `CLOUD_BASE_URL=http://127.0.0.1:8000/ make stress` to check the live server and GPU resource counts.
After rebuilding geometry, use the design projects' sync scripts to update the meshes in `hardware-visualisation/src/data/`.
The older FastAPI viewer remains a separate development tool in `hardware-visualisation/`; GitHub Pages uses the new atlas.
