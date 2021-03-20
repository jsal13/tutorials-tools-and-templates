.PHONY: init test

init:
	pip install pre-commit -q
	pip install -r requirements.txt -q
	pre-commit install
	@echo "++ Init done!\n"

test:
	python -m pytest