# Asset and dependency notices

The MIT license covers original code and technical documentation in this project.
It does not grant rights to third-party characters, trademarks, artwork, photographs, or recordings.
The project name does not imply endorsement by any character owner or hardware manufacturer.

## Existing media: review required before public visibility

| Paths | Status |
| --- | --- |
| `assets/alphabet/*.png`, `assets/animations/` | Character artwork and references. AI generation does not establish permission to distribute character depictions. |
| `media/alphabet/`, `media/animations/`, `media/images/` | Prepared versions of artwork or photographs. The same source rights apply. |
| `sounds/`, `media/sounds/`, optional `media/letter-sounds/*.wav` | Recording ownership and redistribution permission need confirmation. |
| `docs/*contact-sheet.png`, `docs/alphabet-revisions.png`, `assets/letter-drawing/preview.gif` | Composite previews can contain character artwork. |
| `output/`, `hardware-visualisation/viewer.html`, design previews and PDFs | Existing generated files can contain embedded artwork or reference photos. Review their contents. |
| `photos/`, `imgs/` | Private source inputs, ignored by Git. Review history for earlier copies. |

No redistribution license is assigned to these media files by this notice.
Record the source, owner, license, and evidence of permission for each retained asset before making the repository public.
Remove or replace files whose permission remains unresolved. Review Git history as well as the current tree.

The new `_site/` showcase uses original CSS, SVG, and project data. Its export does not copy character artwork or recordings.
The release kit uses an original geometric demo card. Existing media, generated CAD files, and the research viewer are excluded.

## Dependencies

| Dependency | License | Distribution |
| --- | --- | --- |
| Pillow | MIT-CMU (current release) | Installed with pip, not bundled in the kit. |
| gpiozero | BSD-3-Clause | Installed on the Pi, not bundled. |
| smbus2 | MIT | Installed on the Pi, not bundled. |
| spidev | MIT | Installed on the Pi, not bundled. |
| PyYAML | MIT | Development dependency, not bundled. |
| Playwright | Apache-2.0 | Development dependency, not bundled. |
| Three.js | MIT | Used by the separate research viewer, not bundled in the showcase or kit. |

Dependency distributions retain their own license files. Consult those files for the full terms.
