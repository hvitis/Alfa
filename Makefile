.DEFAULT_GOAL := help

PYTHON := $(if $(wildcard .venv/bin/python),.venv/bin/python,python3)
INSTALL_ARGS ?=

.PHONY: help install check site serve smoke build clean update reset restart start stop status logs run test preview

help:
	@printf '%s\n' 'make install  Install development dependencies in .venv and node_modules' 'make check    Validate repository, run unit tests, and check JavaScript' 'make site     Export the static showcase' 'make serve    Export and serve the showcase at http://127.0.0.1:8000' 'make smoke    Run Chromium checks at root and a repository subpath' 'make build    Run all checks and package the runtime build kit' 'make clean    Remove only generated publication files'
	@printf '%s\n' 'make update   Pull newest code, update dependencies, reinstall and restart on the Pi' 'make reset    Same complete update as make update' 'make restart  Reinstall and restart the current checkout without pulling' 'make start    Start the installed service' 'make stop     Stop the service and release its GPIO pins' 'make status   Show service status' 'make logs     Follow service logs (Ctrl+C exits)' 'make run      Stop the service, run the alphabet manually, then restore the service' 'make test     Run hardware-free tests' 'make preview  Regenerate the drawing GIF and contact sheet' 'Add INSTALL_ARGS=--no-audio for a silent service update'

update reset:
	bash scripts/update-app.sh $(INSTALL_ARGS)

restart:
	bash scripts/update-app.sh --no-pull $(INSTALL_ARGS)

start:
	sudo systemctl reset-failed moomin.service
	sudo systemctl start moomin.service

stop:
	sudo systemctl stop moomin.service

status:
	systemctl --no-pager status moomin.service

logs:
	journalctl -u moomin.service -n 30 -f

run:
	bash scripts/run-app.sh

test:
	$(PYTHON) -m unittest discover -s tests -v

preview:
	$(PYTHON) scripts/preview-letter-drawing.py

install:
	python3 -m venv .venv
	.venv/bin/python -m pip install -r requirements-dev.txt
	npm ci
	npx playwright install chromium

check:
	$(PYTHON) scripts/check_repo.py
	$(MAKE) test
	npm run test:syntax
	npm run test:viewer

site:
	$(PYTHON) scripts/export_site.py web

serve: site
	$(PYTHON) -m http.server 8000 --bind 127.0.0.1 --directory web

smoke: site
	npm run test:smoke

build:
	$(PYTHON) scripts/build.py

clean:
	$(PYTHON) scripts/clean.py
