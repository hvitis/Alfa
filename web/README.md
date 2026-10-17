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
| `content/teaching-adr.md` | Fictional MDR-style ADR for teaching. Its disclaimer is mandatory: the build fails if a required phrase is removed. |
| `export-teaching.mjs` | Renders the teaching ADR for the page and exports its PDF with a diagonal "TEACHING MATERIAL" watermark and disclaimer footer on every page. |
| `content/architecture.mmd` | Canonical Mermaid diagram source. |
| `project.py` | Specifications generated from application configuration. |
| `build.py`, `build.mjs`, `vite.config.js` | Data generation, Markdown rendering, asset bundling, and static export. |
| `tests/` | JavaScript syntax checks and browser smoke checks. |
| `hardware-visualisation/src/` | Reused CAD meshes, routing data, controller models, and scene components. |
| `hardware-visualisation/case-planner/` | Legacy standalone case planner sources, also relocated from `design/`. |
| `.generated/` | Temporary manifest and rendered ADRs, ignored by Git. |

## Views

- **Plywood:** Little House Radio and the original case, with assembly modes, orbit controls, wood visibility, and labels.
- **3DPrint:** PETG cloud enclosure, assembly views, frame IDs, hover names, preset color palettes, individual PETG swatch dropdowns and custom color pickers, fit allowances, STL/STEP/ZIP downloads, and geometry checks.
- **Hardware:** Complete Raspberry Pi and Pico wiring atlases, circuit filters, and selectable wire endpoints.
- **Software:** A Design dropdown shows the ADR. Implementation shows the rendered Mermaid architecture. Teaching example (MDR) shows the watermarked, fictional teaching ADR with PDF and Markdown downloads.

Cloud preview colors update without a CAD rebuild and persist in browser storage.
The color controls affect the preview; choose matching filament when printing.
PETG swatch values follow the [official Prusa color reference](https://help.prusa3d.com/article/hueforge-filament-transparency-values-and-hexcodes_762314).
The color panel sits below the print downloads and uses at most half the desktop page width.

Hash links (`#plywood`, `#3dprint`, `#hardware`, `#software`) work with a plain static server.
All JavaScript, styles, meshes, and documents use local relative URLs. No backend or CDN is required.
Three.js and Mermaid load only when their views need them. Library license text is included in the export.

The CAD meshes are committed viewer inputs. The static build does not run CAD tools. It exports an illustrated ADR PDF with Chromium.
The verified CAD assets are generated with `make cloud` and committed under `design/cloud-radio/generated/cloud/`.
Download ZIP files are not committed. `make site` creates the cloud ZIP in `_site/cloud/` from the verified assets.
CI uses this same static build, without CAD software. The development server creates the archive on demand.
Run `make dev` for the website at port 8000 with automatic cloud CAD rebuilds and browser refresh.
The third Hardware controller option, **Raspi 3 PCB**, shows the integrated shield exported from KiCad.
Run `make prepare-commit` before staging to refresh the PCB downloads and rebuild the website.
This command does not stage, commit, or stash files.
`make pcb` regenerates the PCB files with the pinned KiCad Docker image.
The generated directory is ignored by Git. The editable KiCad sources and required package models stay in Git.
Both `make site` and `make dev` reject stale exports and regenerate them when necessary.
GitHub Actions generates the PCB exports before the website and release builds, then transfers them as a workflow artifact.
The website therefore uses exports from the same commit as its source code.
Run `make stress` after `make site` for 100 cloud view, tab, and viewport cycles.
Use `CLOUD_BASE_URL=http://127.0.0.1:8000/ make stress` to check the live server and GPU resource counts.
After rebuilding geometry, use the design projects' sync scripts to update the meshes in `hardware-visualisation/src/data/`.
The older FastAPI viewer remains a separate development tool in `hardware-visualisation/`; GitHub Pages uses the new atlas.

## Rendered images and ADR PDF

The render studio uses the verified CAD assembly and the default pastel Cloud blue colors.
It does not use character artwork. Start the development server, then run:

```sh
npm run render:assets
npm run export:pdf
make site
```

`render:assets` creates four transparent CAD views, the README banner and assembly card,
the 1200 × 630 website card, and the 1280 × 640 GitHub social preview.
The source is `render.js`; the card layout is `brand-art.mjs`.
The render manifest records the model revision, digital check count, and colors.
`social_preview.py` remains a wrapper for the same command.

`make site` exports the complete ADR to `_site/docs/adr.pdf` with an illustrated cover and three content pages.
The PDF uses the canonical `content/adr.md`. The print layout is `adr-document.mjs`.
It needs the Playwright Chromium installed by the CI setup. The PDF is generated, not committed.
The live server serves the same PDF at `/docs/adr.pdf`.

The original raster artwork is limited to the CAD render and social card.
Website social tags use the absolute Pages URL because link crawlers need an absolute image URL.
If hosting changes, update `og:url`, `og:image`, `twitter:image`, and the canonical URL in `index.html`.
GitHub requires a manual upload of `.github/social-preview.png` under repository Settings → General → Social preview.
