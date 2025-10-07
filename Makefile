.PHONY: install dev build start lint format type-check test help

install:
	npm install

default: dev

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

format:
	npm run format

type-check:
	npm run type-check

test:
	npm run test

help:
	@echo "Available targets:"
	@echo "  make install     # Install npm dependencies"
	@echo "  make dev         # Run Next.js in development mode"
	@echo "  make build       # Build the production bundle"
	@echo "  make start       # Start the production server"
	@echo "  make lint        # Run ESLint checks"
	@echo "  make format      # Format files with Prettier"
	@echo "  make type-check  # Run TypeScript type checker"
	@echo "  make test        # Execute test suite"
