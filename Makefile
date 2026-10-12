.DEFAULT_GOAL := help

PYTHON := $(if $(wildcard .venv/bin/python),.venv/bin/python,python3)
INSTALL_ARGS ?=

.PHONY: help update reset restart start stop status logs run test preview

help:
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
