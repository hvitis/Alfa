# Asset and dependency notices

The MIT license covers original code and technical documentation in this project.
It does not grant rights to third-party characters, trademarks, artwork, photographs, or recordings.
The project name does not imply endorsement by any character owner or hardware manufacturer.

## Existing media: review required before public visibility

| Paths | Status |
| --- | --- |
| `assets/alphabet/*.png`, `assets/animations/`, `assets/splash/` | Character artwork and references. AI generation does not establish permission to distribute character depictions. |
| `media/alphabet/`, `media/animations/`, `media/images/` | Prepared versions of artwork or photographs. The same source rights apply. |
| `sounds/`, `media/sounds/`, optional `media/letter-sounds/*.wav` | Recording ownership and redistribution permission need confirmation. |
| `docs/*contact-sheet.png`, `docs/alphabet-revisions.png`, `assets/letter-drawing/preview.gif` | Composite previews can contain character artwork. |
| `output/`, `web/hardware-visualisation/viewer.html`, design previews and PDFs | Existing generated files can contain embedded artwork or reference photos. Review their contents. |
| `photos/`, `imgs/` | Private source inputs, ignored by Git. Review history for earlier copies. |

No redistribution license is assigned to these media files by this notice.
Record the source, owner, license, and evidence of permission for each retained asset before making the repository public.
Remove or replace files whose permission remains unresolved. Review Git history as well as the current tree.

The `_site/` atlas uses project CSS, SVG, routing data, and CAD viewer meshes. Its export does not copy character artwork, reference photos, or recordings.
The README and social cards use original renders of the verified cloud CAD model.
The illustrated ADR PDF contains the project architecture text and the same original CAD render.
The release kit uses an original geometric demo card. Existing character media and the legacy viewer are excluded. The website includes the verified cloud print downloads. The static atlas includes the committed geometric viewer meshes.

## Dependencies

| Dependency | License | Distribution |
| --- | --- | --- |
| Pillow | MIT-CMU (current release) | Installed with pip, not bundled in the kit. |
| gpiozero | BSD-3-Clause | Installed on the Pi, not bundled. |
| smbus2 | MIT | Installed on the Pi, not bundled. |
| spidev | MIT | Installed on the Pi, not bundled. |
| PyYAML | MIT | Development dependency, not bundled. |
| Playwright | Apache-2.0 | Development dependency, not bundled. |
| Three.js | MIT | Bundled with the static atlas and included in its license notices. |
| Mermaid | MIT | Bundled with the static atlas and included in its license notices. |
| markdown-it | MIT | Used during website generation, not required at runtime. |
| Vite | MIT | Build dependency, not required at runtime. |

Dependency distributions retain their own license files. Consult those files for the full terms.


## Generated Polish fallback speech

`media/letter-sounds/manifest.json` identifies each personal recording and generated fallback.
The fallback voice is Piper `pl_PL-gosia-medium` from
[the Piper voice repository](https://huggingface.co/rhasspy/piper-voices/tree/main/pl/pl_PL/gosia/medium).
Its [model card](https://huggingface.co/rhasspy/piper-voices/blob/main/pl/pl_PL/gosia/medium/MODEL_CARD)
lists the voice dataset as CC0. The model and Piper executable are not bundled.
Piper runs only during laptop preparation. The Pi plays prepared WAV files.
Personal A–K sources retain the recording rights status described above.
