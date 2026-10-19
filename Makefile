.DEFAULT_GOAL := help

PYTHON := $(if $(wildcard .venv/bin/python),.venv/bin/python,python3)
INSTALL_ARGS ?=
FIRMWARE_ARGS ?=
AUDIO_ARGS ?=
SERVE_PORT ?= 0

.PHONY: help install check site serve smoke build clean update reset restart start stop status logs run test preview public mapping firmware-splash firmware-splash-install firmware-splash-remove firmware-splash-status letter-audio pcb pcb-check prepare-commit

help:
	@printf '%s\n' 'make pcb             Regenerate PCB manufacturing files and web previews (Docker)' 'make pcb-check       Check that PCB exports match the source files' 'make prepare-commit  Refresh PCB files and rebuild the website before staging'
	@printf '%s\n' 'make firmware-splash          Prepare the pre-Linux LCD image and program' 'make firmware-splash-install  Back up boot files and enable the firmware splash (Pi 3)' 'make firmware-splash-status   Inspect the prepared bundle and boot configuration' 'make firmware-splash-remove   Remove the firmware splash and keep the Linux splash'
	@printf '%s\n' 'make install  Install development dependencies in .venv and node_modules' 'make check    Validate repository, run unit tests, and check JavaScript' 'make site     Export the static showcase' 'make serve    Export and serve locally on a free port (URL printed at startup)' 'make smoke    Run Chromium checks at root and a repository subpath' 'make build    Run all checks and package the runtime build kit' 'make clean    Remove only generated publication files'
	@printf '%s\n' 'make update   Pull newest code, update dependencies, reinstall and restart on the Pi' 'make reset    Same complete update as make update' 'make restart  Reinstall and restart the current checkout without pulling' 'make start    Start the installed service' 'make stop     Stop the service and release its GPIO pins' 'make status   Show service status' 'make logs     Follow service logs (Ctrl+C exits)' 'make run      Stop the service, run the alphabet manually, then restore the service' 'make mapping  Assign buttons after fitting them horizontally or vertically in the case' 'make test     Run hardware-free tests' 'make preview  Regenerate the drawing GIF and contact sheet' 'make letter-audio  Regenerate synthesized letter sounds for updated manifest text' 'Add INSTALL_ARGS=--no-audio for a silent service update'

update reset:
	bash scripts/update-app.sh $(INSTALL_ARGS)

restart:
	bash scripts/update-app.sh --no-pull $(INSTALL_ARGS)

start:
	-sudo systemctl reset-failed alfa.service 2>/dev/null || true
	sudo systemctl start alfa.service

stop:
	sudo systemctl stop alfa.service

status:
	systemctl --no-pager status alfa.service

logs:
	journalctl -u alfa.service -n 30 -f

run:
	bash scripts/run-app.sh

mapping:
	bash scripts/map-buttons.sh

firmware-splash:
	bash scripts/firmware-splash.sh prepare

firmware-splash-install:
	bash scripts/firmware-splash.sh install $(FIRMWARE_ARGS)

firmware-splash-remove:
	bash scripts/firmware-splash.sh remove $(FIRMWARE_ARGS)

firmware-splash-status:
	bash scripts/firmware-splash.sh status $(FIRMWARE_ARGS)

test:
	$(PYTHON) -m unittest discover -s tests -v

preview:
	$(PYTHON) scripts/preview-letter-drawing.py

install:
	python3 -m venv .venv
	.venv/bin/python -m pip install -r requirements/dev.txt
	npm ci
	npx playwright install chromium

check:
	$(PYTHON) scripts/check_repo.py
	$(MAKE) test
	npm run test:syntax
	npm run test:viewer

site:
	$(PYTHON) web/build.py _site

pcb:
	$(PYTHON) design/pi3-shield/refresh.py

pcb-check:
	$(PYTHON) design/pi3-shield/assets.py

prepare-commit:
	$(MAKE) pcb
	$(MAKE) site
	$(MAKE) pcb-check

serve: site
	$(PYTHON) -u -m http.server $(SERVE_PORT) --bind 127.0.0.1 --directory _site

dev:
	$(PYTHON) web/dev.py

cloud:
	bash design/cloud-radio/run-cad.sh

stress:
	node web/tests/cloud-stress.mjs

smoke: site
	npm run test:smoke

build:
	$(PYTHON) scripts/build.py

clean:
	$(PYTHON) scripts/clean.py

public:
	$(PYTHON) scripts/export_public.py output/Alfa-public

letter-audio:
	@if [ ! -x .venv-piper/bin/python ]; then \
		echo "Missing .venv-piper environment. See media/letter-sounds/README.md for setup instructions."; \
		exit 1; \
	fi
	@if [ ! -f .venv-piper/pl_PL-gosia-medium.onnx ]; then \
		echo "Missing model .venv-piper/pl_PL-gosia-medium.onnx. See media/letter-sounds/README.md."; \
		exit 1; \
	fi
	.venv-piper/bin/python scripts/prepare-letter-audio.py --model .venv-piper/pl_PL-gosia-medium.onnx $(AUDIO_ARGS)
