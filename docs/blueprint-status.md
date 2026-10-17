# Blueprint implementation

The implementation adapts [project-blueprint.md](project-blueprint.md) to the Python radio application.
CAD projects retain their own toolchains. The software release does not claim to validate fabrication geometry.

| Phase | Implementation |
| --- | --- |
| Foundation | Ignore rules, MIT license, asset notices, development dependencies, and Make targets. Existing Pi maintenance targets remain available. |
| Documentation | English and Polish READMEs, synchronized specification blocks and feature markers, gallery, and social preview. The former README is preserved in `hardware-guide.md`. |
| Static showcase | Sources and generators in `web/`; compiled `_site/` with plywood meshes, controller wiring, ADR, and Mermaid. Bundled libraries, no runtime CDN requests. |
| CI | Python validation, unit tests, JavaScript syntax and viewer tests, static export, Chromium smoke checks, and Pages deployment from `main`. Dependency downloads use caches. |
| Release | SemVer parsing, exact tag checkout, `main` ancestry, software packaging, archive validation, failure logs, release notes, and a separate publishing job. |
| Reports | Commit, timestamp, dirty state, tool versions, SHA-256, check results, and core electronics CSV. |
| Verification | Release tests cover malformed tags, annotated tags, off-main commits, wrong checkouts, modified archives, missing entries, and deterministic packaging. Browser tests cover desktop/mobile, root/subpath hosting, all tabs, both controllers, both plywood designs, and rendered Mermaid. |

## Remaining repository administration

The workflows take effect after the changes are committed and pushed.
Enable GitHub Actions as the Pages source and configure branch and environment protection.
Upload `.github/social-preview.png` in the repository settings.

Before public visibility, complete the asset ownership and Git history review in [publishing.md](publishing.md).
The local checks and excluded-media release kit do not grant redistribution rights to existing repository assets.
