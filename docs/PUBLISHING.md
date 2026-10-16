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

The repository contains character illustrations, prepared media, and a recording whose redistribution evidence is not recorded.
The new release kit and showcase exclude those files. This exclusion does not remove them from the repository or its history.
Ignore rules do not untrack existing files. Historical `output/` files remain tracked to preserve existing work.
Any history rewrite requires a separate, coordinated operation with repository collaborators.

## Enable GitHub Pages

1. Open **Settings → Pages** in GitHub.
2. Select **GitHub Actions** as the build source.
3. Restrict the `github-pages` environment to `main`.
4. Push the reviewed changes to `main`.
5. Wait for the CI validation and Pages deployment jobs.

The expected address is `https://hvitis.github.io/moomin/`.
Update the repository URLs in both READMEs, `_site/index.html`, and `scripts/project.py` if the owner or repository name changes.
The deployment follows the [GitHub custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Create a release

Run these commands only after the reviewed commit is on `main`:

```bash
git switch main
git pull --ff-only
make build
git tag -a v1.0.0 -m "Moomin Radio v1.0.0"
git push origin v1.0.0
```

Use a new SemVer version for each release. Do not move an existing public tag.
The workflow rejects malformed versions and commits outside `main` before it installs build dependencies.
For a retry, use **Actions → Release → Run workflow** and supply the existing tag name.
The workflow selects that tag's commit, regardless of the branch selected in the dispatch form.

The release contains the runtime ZIP, `SHA256SUMS`, build manifest, validation report, and electronics BOM.
Existing releases can receive replacement assets on a workflow retry.
Read [RELEASE-CONTENTS.md](RELEASE-CONTENTS.md) for the archive layout.

## Local preview and checksums

```bash
make serve
```

Open `http://127.0.0.1:8000`.
After downloading a release, run `sha256sum --check SHA256SUMS` on Linux or `shasum -a 256 -c SHA256SUMS` on macOS.

## Repository social image

Upload `.github/social-preview.png` in **Settings → General → Social preview**.
GitHub does not automatically select an image from this path.
Regenerate the image with `python scripts/make_social_preview.py` in the development environment.
