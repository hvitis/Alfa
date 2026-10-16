# Contributing

## Development

Use the prerequisites in [build-guide.md](build-guide.md).

```bash
make install
make check
make smoke
```

Python tests use `unittest` and simulated hardware. Keep Pi libraries out of the development requirements.
Use temporary directories for generated media in tests.
Add tests for changed behavior, especially hardware controls, file boundaries, and release safeguards.
Run `make build` when changing packaging or release contents.

The CAD projects and research viewer have separate dependencies and validation instructions.
State the commands used when a change affects those projects.

## Documentation and assets

Update both READMEs when changing features or specifications.
Keep the specification blocks identical. Keep the feature markers in the same order.
Retain commands and configuration keys exactly in translations.
The complete hardware instructions are in [hardware-guide.md](hardware-guide.md).

For new media, record the owner, source, license, and redistribution evidence in [the asset notices](../THIRD_PARTY_NOTICES.md).
Do not put calibration, credentials, personal recordings, or local device addresses in commits.
Use `config.local.json` for local configuration.

## Pull requests

Describe the concrete problem and resulting behavior.
List the validation commands and results. Separate simulation results from physical hardware observations.
Keep changes focused. Do not include generated CAD caches, local environments, or release archives.
Contributions of original code and documentation use the repository's MIT license.
