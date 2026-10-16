# AI Project Blueprint: Production-Ready GitHub Repository Architecture

> **Purpose:** Drop this markdown specification into any new repository to instruct an AI assistant (or engineering team) to scaffold, configure, and automate a complete, professional GitHub project structure modeled after best-in-class automated engineering repositories.

---

## Instructions for AI Agents Implementing This Blueprint

When this document is provided as a prompt or repository guideline:
1. **Analyze the Project Domain:** Identify the core language (Python, Node.js, Rust, Go, C++, etc.), domain (CAD, Web, CLI, Library, Robotics, 3D), and target deliverables.
2. **Execute Incrementally:** Follow the 7 implementation phases below in order.
3. **Keep CI/CD Lightweight & Deterministic:** Never run long, heavy builds on every pull request. Split fast validation + static page deployment (CI) from full release packaging (Release).
4. **Enforce Bilingual Documentation:** Always generate primary (`README.md` in English) and localized (`README.<lang>.md`) documentation with synchronized feature tables and language switchers.
5. **Implement Static Showcase & Browser Smoke Tests:** Ensure a standalone `_site/` directory is built and tested with headless browser automation (e.g. Playwright) before deploying to GitHub Pages.
6. **Apply Strict Safety Gates:** Ensure release builds only execute on semver tags that descend strictly from the `main` branch.

---

## Target Repository Structure

```text
├── .github/
│   ├── social-preview.png               # High-contrast repository preview image (1200x630)
│   └── workflows/
│       ├── ci.yml                       # Fast validation, static site build & GitHub Pages deployment
│       └── release.yml                  # Tag-triggered full build, validation & GitHub Release publishing
├── docs/                                # Long-form technical documentation
│   ├── images/                          # Visual documentation assets (WebP/PNG)
│   ├── BUILD-GUIDE.md                   # Step-by-step reproduction and toolchain setup
│   ├── PIPELINE.md                      # Architecture, validation gates & data flow
│   ├── PUBLISHING.md                    # Release steps, deployment instructions, and local serving
│   └── CONTRIBUTING.md                  # Development setup, PR guidelines, and coding standards
├── _site/                               # Static web export for GitHub Pages (served from main)
│   ├── index.html                       # Responsive static web app / showcase / viewer
│   ├── app.js                           # Frontend logic (ES modules, relative paths)
│   ├── style.css                        # Modern CSS (dark/light mode, mobile responsive)
│   └── data/                            # Static JSON manifests, assets, and metadata
├── output/                              # Generated build artifacts (ignored by git, uploaded to releases)
│   ├── reports/                         # Machine-readable validation reports (JSON & CSV)
│   └── <project>-Build-Kit.zip          # Packaged distribution archive
├── tests/                               # Test suites
│   ├── check-syntax.mjs                 # Fast ES syntax / linter check
│   ├── smoke-tests.mjs                  # Playwright headless browser smoke tests
│   └── test_*.py (or equivalent)        # Unit & integration tests for domain logic
├── README.md                            # English primary documentation
├── README.pl.md (or localized)          # Synchronized secondary language documentation
├── Makefile                             # Unified task runner (make check, make site, make build)
├── package.json                         # Dev dependencies for browser checks (e.g., Playwright)
├── requirements.txt / pyproject.toml    # Core runtime dependencies
├── requirements-dev.txt                 # Development / testing dependencies
└── .gitignore                           # Strict ignore rules for virtual environments & build artifacts
```

---

## Phase 1: Repository Foundation & Standards

### 1. `.gitignore` Standard
Ensure build outputs, virtual environments, node modules, and credentials are never tracked:
```gitignore
# Virtual environments & dependencies
.venv/
node_modules/
__pycache__/
*.pyc

# Build outputs & caches
output/
_site/data/
dist/
build/
.cache/
FreeCAD-squashfs/

# Local configuration & secrets
.env
*.local
.DS_Store
```

### 2. Unified Task Runner (`Makefile`)
Provide single-command developer workflows across all platforms:
```makefile
.PHONY: help install check test site build clean

help:
	@echo "Available commands:"
	@echo "  make install  - Install development and runtime dependencies"
	@echo "  make check    - Run linting, config checks, and fast tests"
	@echo "  make site     - Generate static web showcase in _site/"
	@echo "  make serve    - Serve _site/ locally at http://127.0.0.1:8000"
	@echo "  make build    - Execute full reproducible build pipeline"
	@echo "  make clean    - Remove build artifacts and temporary files"

install:
	python3 -m pip install -r requirements-dev.txt
	npm install

check:
	python -m pytest tests/
	node tests/check-syntax.mjs

site:
	python scripts/export_site.py _site

serve: site
	python -m http.server 8000 --directory _site

build:
	python scripts/build.py

clean:
	rm -rf output/ _site/data/ dist/
```

---

## Phase 2: Dual-Language Documentation System

Every repository must provide a first-class English version (`README.md`) and a mirror in the project's secondary language (e.g., `README.pl.md` for Polish, `README.de.md`, etc.).

### Dual README Rules
1. **Top Language Switcher:**
   In `README.md`:
   ```markdown
   **English** · [Polski](README.pl.md)
   ```
   In `README.pl.md`:
   ```markdown
   [English](README.md) · **Polski**
   ```
2. **Synchronized Layout:**
   - **Hero Section:** Cover image, badges, one-sentence project mission.
   - **Live Links:** Prominent links to GitHub Pages showcase and latest GitHub Release download.
   - **Visual Gallery:** Responsive table displaying multi-angle renders, screenshots, or diagrams.
   - **Machine-Parsable Specification Block:**
     Enclose canonical dimensions, versions, or hardware specs between comments:
     ```markdown
     <!-- specifications:start -->
     | Specification | Value |
     | --- | --- |
     | License | MIT |
     | Target Blank / Format | A3 (297 x 420 mm) |
     | Minimum Joint Tolerance | 0.2 mm |
     <!-- specifications:end -->
     ```
   - **Key Features:** Bullet points highlighting code generation, automated verification, and physical/runtime usability.
   - **Getting Started & Quick Run:** Copy-pasteable instructions for running the build or viewing the site locally.
   - **Automated Validation Summary:** Explicit statement that all constraints are checked automatically in CI.

---

## Phase 3: Static Pages & Web Showcase (`_site`)

GitHub Pages hosts an interactive showcase or documentation app that requires **zero backend runtime**.

### Architectural Requirements:
1. **Relative Paths Only:** All CSS, JS, image, and data URLs must be relative (e.g., `./app.js`, `data/manifest.json`). This ensures the site works both at root (`https://user.github.io/`) and repository subpaths (`https://user.github.io/repo-name/`).
2. **Self-Contained Vendoring:** External heavy libraries (e.g., Three.js, icons, fonts) should be vendored under `_site/vendor/` with their licenses preserved, avoiding runtime CDN failures or network sandboxing issues.
3. **Data Decoupling:** Keep data in clean JSON manifests (`_site/data/manifest.json`), generated by the build script so the static frontend stays decoupled from the backend logic.

### Headless Browser Smoke Testing (Playwright)
To ensure the static showcase never breaks in production, configure headless smoke tests in `package.json`:

```json
{
  "name": "project-viewer-checks",
  "private": true,
  "scripts": {
    "test:syntax": "node tests/check-syntax.mjs",
    "test:smoke": "node tests/smoke-tests.mjs"
  },
  "devDependencies": {
    "playwright": "^1.40.0"
  }
}
```

Sample headless smoke test script (`tests/smoke-tests.mjs`):
```javascript
import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const PORT = 8765;
const SITE_DIR = path.resolve('_site');

// Minimal zero-dependency local static server
const server = http.createServer((req, res) => {
  const filePath = path.join(SITE_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  const mimeMap = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
  res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Checking site at http://localhost:${PORT}...`);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected:\n${consoleErrors.join('\n')}`);
    }
    console.log('✓ Smoke tests passed without console errors.');
    await browser.close();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('✗ Smoke test failed:', err);
    await browser.close();
    server.close();
    process.exit(1);
  }
});
```

---

## Phase 4: CI Pipeline (`.github/workflows/ci.yml`)

The CI workflow runs on every push and PR to `main`. It builds the static showcase, caches heavy computation, and deploys to GitHub Pages on `main`.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate-and-export:
    name: Validate and Build Static Site
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
          cache-dependency-path: requirements*.txt

      - name: Install Python dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then python -m pip install -r requirements.txt; fi

      - name: Cache generated data
        id: site-cache
        uses: actions/cache@v4
        with:
          path: _site/data
          key: site-data-v1-${{ runner.os }}-py312-${{ hashFiles('scripts/**', 'source/**', 'requirements.txt') }}

      - name: Export static site
        env:
          REUSE_DATA: ${{ steps.site-cache.outputs.cache-hit }}
        run: |
          if [ "$REUSE_DATA" = 'true' ]; then
            python scripts/export_site.py _site --reuse-data
          else
            python scripts/export_site.py _site
          fi

      - name: Upload Pages artifact
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy-pages:
    name: Deploy to GitHub Pages
    needs: validate-and-export
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    concurrency:
      group: pages
      cancel-in-progress: false
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Configure GitHub Pages
        uses: actions/configure-pages@v5

      - name: Deploy static site
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## Phase 5: Release Automation (`.github/workflows/release.yml`)

Releases are triggered when a tag matching `v*` is pushed. This workflow:
1. **Verifies the Tag on Main:** Enforces that release tags can only be cut from commits on the `main` branch.
2. **Executes Full Build & Packaging:** Runs all deep validation checks and generates output bundles.
3. **Validates Kit Contents:** Asserts checksums, report outputs, and required assets before release.
4. **Captures Failure Logs:** Uploads diagnostic reports if any step fails.
5. **Creates GitHub Release:** Compiles release notes from machine-generated build reports and attaches deliverables.

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      tag_name:
        description: 'Tag name to release (e.g. v1.0.0)'
        required: false
        type: string

permissions:
  contents: write

concurrency:
  group: release-${{ inputs.tag_name || github.ref_name }}
  cancel-in-progress: false

jobs:
  release:
    name: Build deliverables and publish release
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository with full history
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Verify tag is on main branch
        run: |
          TAG_NAME="${{ inputs.tag_name || github.ref_name }}"
          echo "Verifying that tag '$TAG_NAME' (commit $GITHUB_SHA) is on main branch..."
          git fetch origin main
          if ! git merge-base --is-ancestor HEAD origin/main; then
            echo "::error::Tag '$TAG_NAME' is not on the main branch! Releases must only be cut from main."
            exit 1
          fi
          echo "Tag verified on main branch."

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
          cache-dependency-path: requirements*.txt

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then python -m pip install -r requirements.txt; fi

      - name: Execute full reproducible build
        run: python scripts/build.py --production

      - name: Verify release deliverables
        run: python -c "from scripts.package import validate_release_kit; validate_release_kit('output')"

      - name: Upload diagnostic reports on build failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: build-failure-reports-${{ inputs.tag_name || github.ref_name }}
          path: |
            output/reports/
            *.log
          if-no-files-found: ignore

      - name: Publish GitHub Release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          TAG_NAME="${{ inputs.tag_name || github.ref_name }}"
          echo "Publishing GitHub Release for tag: $TAG_NAME"
          
          # Generate release notes dynamically from build reports or changelog
          python scripts/generate_release_notes.py "$TAG_NAME" > release-notes.md

          # Collect assets matching output deliverables
          shopt -s nullglob
          ASSETS=(output/*.zip output/*.tar.gz output/reports/*.csv output/*.pdf)
          
          if gh release view "$TAG_NAME" > /dev/null 2>&1; then
            echo "Release $TAG_NAME already exists: updating assets."
            gh release upload "$TAG_NAME" "${ASSETS[@]}" --clobber
            gh release edit "$TAG_NAME" --notes-file release-notes.md
          else
            gh release create "$TAG_NAME" "${ASSETS[@]}" \
              --title "${{ github.event.repository.name }} $TAG_NAME" \
              --verify-tag \
              --notes-file release-notes.md
          fi
```

---

## Phase 6: Automated Verification & Report Schema

Implement a "stop-the-line" philosophy: any violation of physics, geometric clearances, tolerances, or schema validation immediately exits with non-zero status.

### Report Structure
Generate machine-parsable reports under `output/reports/`:
- `build-manifest.json`: Commit SHA, build timestamp, versions, artifact checksums.
- `validation.json`: List of automated assertions, tolerances tested, and pass/fail statuses.
- `parts.csv` / `hardware.csv`: Bill of materials (BOM), costs, stock consumption.

Example `validation.json`:
```json
{
  "timestamp": "2026-10-16T01:00:00Z",
  "git_commit": "c4d7b2e",
  "status": "PASS",
  "checks": [
    { "name": "clearance_sweep", "tolerance_mm": 0.5, "passed": true },
    { "name": "material_thickness_bounds", "min_mm": 2.8, "max_mm": 3.2, "passed": true },
    { "name": "part_count_integrity", "expected": 142, "actual": 142, "passed": true }
  ]
}
```

---

## Phase 7: AI Execution Checklist

When tasked with generating a repository according to this blueprint, the AI assistant must verify each item before completing:

- [ ] **Directory Hierarchy:** All folders (`.github/workflows`, `docs/`, `_site/`, `output/`, `tests/`) exist.
- [ ] **Bilingual READMEs:** Both `README.md` and `README.<lang>.md` contain matching headers, language toggle links, specification tables, and feature sections.
- [ ] **Static Site Ready:** `_site/index.html` renders cleanly with relative asset paths.
- [ ] **Smoke Tests Configured:** `package.json` contains Playwright test scripts and headless verification runs cleanly.
- [ ] **CI Workflow Active:** `.github/workflows/ci.yml` validates code and builds/deploys the static site to GitHub Pages on `main`.
- [ ] **Release Workflow Active:** `.github/workflows/release.yml` triggers on `v*` tags, checks branch ancestry against `main`, and uploads deliverables to GitHub Releases.
- [ ] **Task Runner Present:** `Makefile` contains `check`, `site`, `build`, and `serve` targets.
- [ ] **Git Configuration:** `.gitignore` excludes build outputs, caches, secrets, and vendor binaries.

---

## Example Prompt to Give AI in a New Repository

```text
Please read `PROJECT-BLUEPRINT.md` and scaffold this repository accordingly.
1. Create the project structure with directories for docs, static site (_site), tests, and CI/CD.
2. Implement dual-language README.md (English) and README.pl.md (Polish) with specifications table and language switcher.
3. Set up the GitHub Actions CI workflow (caching, site export, GitHub Pages deployment from main).
4. Set up the GitHub Actions Release workflow (v* tag trigger, ancestor-of-main verification, release notes generation, asset uploads).
5. Create the static showcase in _site/ with relative paths and a Playwright smoke test.
6. Provide a Makefile with install, check, site, serve, and build targets.
```
