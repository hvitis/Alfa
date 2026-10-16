# Publishing

The blueprint implementation prepares local files and GitHub workflows.
It does not change repository visibility, push commits, create tags, or publish a site.

## Before making the repository public

1. Review [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
2. Record permission for retained character artwork, recordings, photos, composite previews, and generated documents.
3. Remove or replace assets whose distribution rights remain unresolved.
4. Review the complete Git history for secrets and restricted assets.
5. Rotate any credential that entered Git history, even if the latest tree no longer contains it.
6. Review `git ls-files output/ media/ assets/ sounds/` and embedded media in HTML or PDFs.
7. Run `make check`, `make smoke`, and `make build` from a clean checkout.
8. Enable private vulnerability reporting in the repository's Security settings.
9. Configure branch protection for `main`, with the CI validation job as a required check.
10. Change repository visibility only after the asset and history review is complete.

## Prepare the public source repository

The Alfa copy uses one new initial commit. This checkout retains its existing history.
The export includes current source files, retained images, and existing tracked assets.
It excludes deleted files, ignored private inputs, credentials, dependencies, and local state.
The exporter refuses symlinks and existing destination directories.

```bash
python3 scripts/export_public.py output/Alfa-public
cd output/Alfa-public
git log --oneline --all
git status --short
```

Run Gitleaks against the copy before publication:

```bash
gitleaks dir --redact --no-banner .
gitleaks git --redact --no-banner --log-opts=--all .
```

Create an empty GitHub repository named `Alfa`. Then publish the reviewed copy:

```bash
git remote add origin https://github.com/hvitis/Alfa.git
git push -u origin main
```

Do not push branches or tags from the private checkout into the public repository.
The new initial commit uses a project author with a public noreply address.
GitHub visibility, repository creation, and remote publication are separate actions.

Retained images remain unchanged. Their existing media notice still applies.
The source rename does not remove lettering embedded in image pixels.

## Enable GitHub Pages

1. Open **Settings → Pages** in GitHub.
2. Select **GitHub Actions** as the build source.
3. Restrict the `github-pages` environment to `main`.
4. Push the reviewed changes to `main`.
5. Wait for the CI validation and Pages deployment jobs.

The expected address is `https://hvitis.github.io/Alfa/`.
Update the repository URLs in both READMEs, `web/index.html`, and `web/project.py` if the owner or repository name changes.
The deployment follows the [GitHub custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Create a release

Run these commands only after the reviewed commit is on `main`:

```bash
git switch main
git pull --ff-only
make build
git tag -a v1.0.0 -m "Alfa v1.0.0"
git push origin v1.0.0
```

Use a new SemVer version for each release. Do not move an existing public tag.
The workflow rejects malformed versions and commits outside `main` before it installs build dependencies.
For a retry, use **Actions → Release → Run workflow** and supply the existing tag name.
The workflow selects that tag's commit, regardless of the branch selected in the dispatch form.

The release contains the runtime ZIP, `SHA256SUMS`, build manifest, validation report, and electronics BOM.
Existing releases can receive replacement assets on a workflow retry.
Read [release-contents.md](release-contents.md) for the archive layout.

## Local preview and checksums

```bash
make serve
```

Open `http://127.0.0.1:8000`.
After downloading a release, run `sha256sum --check SHA256SUMS` on Linux or `shasum -a 256 -c SHA256SUMS` on macOS.

## Repository social image

Upload `.github/social-preview.png` in **Settings → General → Social preview**.
GitHub does not automatically select an image from this path.
Start `make serve`, then run `npm run render:assets` (or `python web/social_preview.py`).
The GitHub card is 1280 × 640. The website card is `web/assets/og-cloud.png`, at 1200 × 630.
Both use the verified pastel-blue CAD model and the current page style.
`make site` copies the website card to `og-cloud.png` and generates `docs/adr.pdf`.
The PDF uses the same cover style and the complete Markdown ADR.
It also exports the fictional teaching ADR as `docs/teaching-material-adr-example-not-a-medical-device.pdf` and `.md`.
Every page of that PDF shows a diagonal "TEACHING MATERIAL" watermark and the footer "Not a medical device · For educational purposes only".
The absolute social URLs in `web/index.html` target `https://hvitis.github.io/Alfa/`. Update them if the deployment URL changes.
