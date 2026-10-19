**English** · [Polski](README.md)

# α Alfa

![Alfa: an offline Raspberry Pi player and Polish alphabet companion](docs/images/readme-banner.png)

[![CI](https://github.com/hvitis/Alfa/actions/workflows/ci.yml/badge.svg)](https://github.com/hvitis/Alfa/actions/workflows/ci.yml)
[![Code license: MIT](https://img.shields.io/badge/code-MIT-green)](LICENSE)

**Little radio. Big imagination.**

A pastel cloud, six arcade buttons, and 32 Polish letters to explore. Alfa plays music and letter lessons offline on a Raspberry Pi.
Print the cloud in your favorite colors, fit the electronics, and make it your own.

[Live showcase](https://hvitis.github.io/Alfa/) · [Latest build kit](https://github.com/hvitis/Alfa/releases/latest) · [Hardware guide](docs/hardware-guide.md) · [Documentation](docs/README.md)

## A little look around

| Rendered hardware connections | Inside look through back case | Roentgen look through all elements |
| --- | --- | --- |
| ![Rendered 3D hardware connections between controller, display, buttons, audio amplifier, and power](docs/images/hardware-connections.png) | ![Inside look through the back case showing internal placement and wiring](docs/images/inside-back-case.png) | ![Translucent roentgen view through all elements of the cloud radio](docs/images/roentgen-look.png) |
| [Interactive wiring atlas](https://hvitis.github.io/Alfa/#hardware) | [Cloud internals and assembly](design/cloud-radio/README.md) | [Cloud assembly & 3D print](design/cloud-radio/README.md) |

**Explore the build atlas:** [3DPrint](https://hvitis.github.io/Alfa/#3dprint) · [Plywood](https://hvitis.github.io/Alfa/#plywood) · [Hardware](https://hvitis.github.io/Alfa/#hardware) · [Software](https://hvitis.github.io/Alfa/#software)

[![Alfa Raspberry Pi 3 shield: integrated ADC, amplifier and connectors](docs/images/pi3-shield.png)](https://hvitis.github.io/Alfa/pcb/)

**[Raspi 3 PCB — open the interactive shield model](https://hvitis.github.io/Alfa/pcb/)** · [Design and assembly guide](design/pi3-shield/README.md).
The 65 × 56 mm prototype fits the ADC, amplifier and divider directly on one board. Hardware tests remain pending.

<details open>
<summary>See the interactive workshop and software map</summary>

![The Alfa workshop in the pastel website style](docs/images/showcase.png)
![The software architecture in the pastel website style](docs/images/software-architecture.png)

</details>

The [CAD folders](design/) contain the enclosure sources. The website includes the illustrated ADR PDF under **Software → Design**.

## Specifications

<!-- specifications:start -->
| Specification | Value |
| --- | --- |
| Code and documentation license | MIT |
| Runtime | Python 3.11+ |
| Validation toolchain | Python 3.12, Node.js 22, Chromium |
| Active controller | Raspberry Pi 3, Raspberry Pi OS Bookworm or newer |
| Display | ST7789, 240 × 320, SPI |
| Audio | MAX98357A, I²S, 48 kHz stereo PCM |
| Button input | Five-button keypad, ADS1115 or ADS1015, I²C |
| Divider | 2 × 10 kΩ |
| Backlight | BCM GPIO24 |
| Polish alphabet | 32 letters |
| Initial volume / cap | 20% / 50% |
| Static showcase | HTML, CSS, JavaScript; no backend |
<!-- specifications:end -->

## Features

- <!-- feature:offline-player --> **Offline player:** Navigate images, play recordings, and adjust volume with five physical buttons.
- <!-- feature:letter-lessons --> **Letter lessons:** Draw 32 Polish letters stroke by stroke. The existing character assets have separate rights notes.
- <!-- feature:hardware-simulation --> **Hardware simulation:** Save display previews on your computer without GPIO, SPI, or I²C devices.
- <!-- feature:static-showcase --> **Static showcase:** Explore Plywood, 3DPrint, Hardware, and Software tabs, with 3D models, controller wiring, an ADR, and rendered Mermaid.
- <!-- feature:verified-distribution --> **Verified distribution:** Build a runtime kit with a neutral demo card, checksums, validation reports, and an electronics BOM.
- <!-- feature:enclosure-research --> **Enclosure research:** Inspect the printable cloud and both plywood projects. The cloud uses two shells that join without screws, with a flat battery at the bottom and a horizontal Pi on the shelf above. It is 86 mm deep and 245 mm tall. Downloads include STL, 3MF, STEP, snap coupons and the assembly guide; the assumed bed is 256 × 256 mm.

## Quick start

Use Python 3.11 or newer. Install FFmpeg for audio conversion.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements/base.txt
python -m app --simulate player --once --no-audio
```

The simulator saves `.state/preview/current.png`. The checkout uses existing prepared media.
The app, Pi service, splash, and browser preview use one [config.json](config.json), including the selected letters in `lesson.letters`.
Read [installation.md](docs/installation.md) for local and Pi setup, and [configuration.md](docs/configuration.md) for settings.
The release kit supplies a neutral demo image instead.
For wiring, button calibration, speaker checks, and service installation, read the [hardware guide](docs/hardware-guide.md).

On the Pi, run `make mapping` after fitting or rotating the buttons in the case.
Follow the prompts for LEFT, RIGHT, TOP, BOTTOM, and CENTER. The command restores a previously running service.

For a loading image before Linux starts on Pi 3, follow the [firmware splash guide](docs/early-boot-splash.md).
It covers compatible firmware, `make firmware-splash-install`, backups, and removal.

For the development tools and local showcase:

```bash
make install
make check
make serve
```

Open `http://127.0.0.1:8000`. Use Node.js 22 for the browser checks.
Read [build-guide.md](docs/build-guide.md) for Linux prerequisites and environment details.

## Automated validation

`make check` runs configuration checks, Python tests, JavaScript syntax checks, viewer data tests, and bilingual documentation checks.
CI exports the static showcase and runs Chromium checks at the domain root and a repository subpath, on desktop and mobile.
Browser checks cover both plywood models, the printable cloud, both wiring atlases, the illustrated ADR PDF, rendered Mermaid, social images, and local assets.
`make build` also runs the packaged simulator and verifies archive contents and SHA-256 checksums.

The cloud is a fit prototype. Its digital geometry checks do not replace physical print, locating-tab, snap, drop, and temperature tests.
Physical wiring, acoustic volume, enclosure fit, and media redistribution rights require separate review.
The software pipeline does not certify those properties.

## Build and publish

```bash
make smoke
make build
```

The kit is `output/Alfa-Build-Kit.zip`. Reports are in `output/reports/`.
The kit includes the Python runtime, wiring guide, neutral demo image, and static atlas with its viewer meshes.
It excludes character media, recordings, and the legacy viewer. The static site includes the cloud print downloads. Website sources and generation live in [web/](web/README.md).
Read [release contents](docs/release-contents.md), [pipeline details](docs/pipeline.md), and [publication steps](docs/publishing.md).

CI validates pull requests. GitHub Pages deploys after successful checks on `main`.
Releases require a SemVer tag whose actual commit is on `main`.

## Contributing and licenses

Read [the contribution guide](docs/contributing.md) for the development workflow.
Use [SECURITY.md](SECURITY.md) for security reports.
The [MIT license](LICENSE) covers original code and technical documentation.
[Asset and dependency notices](docs/third-party-notices.md) records asset exclusions and dependency notices.
Existing character artwork and recordings require a separate rights review before public visibility.
Read the [publication checklist](docs/publishing.md). The README and social cards use original CAD renders.

To recreate these images, run `make serve`, then `npm run render:assets`. Run `make site` to export the illustrated ADR PDF.
The GitHub social card is [.github/social-preview.png](.github/social-preview.png).
