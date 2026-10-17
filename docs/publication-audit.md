# Alfa publication audit

Date: 2026-10-16.

## Source and naming

The project name, repository links, service units, runtime environment variable, documentation, and package metadata use Alfa.
The application entry point is `python3 -m app`.
The obsolete compatibility package and brand-specific generation instructions are removed.
Image filenames use neutral descriptions. Their contents remain unchanged.

The public source check examines filenames and file bytes, including binary metadata, for retired names and common credential patterns.
CI also runs Gitleaks before Pages deployment.

## Secrets

Gitleaks 8.30.1 detected no secrets in the 35 commits available in the original local repository.
Gitleaks also detected no secrets in the prepared public source files or their new initial commit.
The scanner uses its default rules and redacts credential values.
These results describe the available files and commits; they do not prove that every possible secret format is absent.

The public copy excludes ignored private inputs, local state, dependencies, and credentials.
The exporter rejects sensitive filenames and symlinks.
It includes current versions of tracked files and non-ignored new files, and excludes working-tree deletions.

## Images and history

All 108 repository images present at the start of this audit retain their original SHA-256 checksums.
Ten image files have neutral filenames. The public copy preserves the same bytes.
Existing image pixels, embedded lettering, character depictions, and media rights remain unchanged.
[THIRD_PARTY_NOTICES.md](third-party-notices.md) describes the retained media.

The public copy has one new initial commit on `main`.
It contains no inherited branches, tags, commits, remotes, or reflogs from the original checkout.
The original checkout retains its history and origin.
No repository visibility setting, remote repository, or published release changes during preparation.

## Validation

- `make check`: passed. Python ran 115 tests, with one Linux-only systemd check skipped on macOS.
- JavaScript syntax: passed for 40 modules.
- Viewer data tests: 30 passed.
- Chromium smoke checks: passed at desktop and mobile widths, at the root and a repository subpath.
- Full release build: passed, including the packaged simulator and archive checksum checks.
- Shell syntax and `git diff --check`: passed.

The release archive is `output/Alfa-Build-Kit.zip`.
The fresh source repository is `output/Alfa-public/`.
[Publishing instructions](publishing.md) describe the separate remote publication step.
