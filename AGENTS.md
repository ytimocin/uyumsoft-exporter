# Repository Guidelines

## Project Structure & Module Organization

- Keep raw Uyumsoft invoice exports under `data/raw/` (e.g., `data/raw/Fatura Listesi-2025-10-06.csv`). Processed artifacts belong in `data/processed/`.
- Place reusable ETL code inside `src/exporter/`, using modules such as `client.py` for API access and `transformers/` for CSV shaping. The CLI entry point should live in `src/exporter/cli.py`.
- Store configuration templates in `config/` (YAML or JSON). Document workflows in `docs/` when introducing new automation.

## Build, Test, and Development Commands

- Create a virtual environment with `python -m venv .venv && source .venv/bin/activate`.
- Install dependencies via `pip install -r requirements.txt`; update the file when adding third-party packages.
- Run the exporter locally with `python -m exporter.cli --date 2025-10-06 --target data/raw/` to verify API interactions.
- Use `python -m pytest` to execute unit and integration tests. Add `pytest -k "export"` examples in PRs when introducing new features.

## Coding Style & Naming Conventions

- Follow PEP 8 with 4-space indentation. Apply `ruff check src/` and `black src/ tests/` before committing.
- Name modules with lowercase underscores (e.g., `invoice_writer.py`) and classes in `PascalCase`.
- Use descriptive environment variable names prefixed with `UYUMSOFT_` for runtime configuration.

## Testing Guidelines

- Prefer `pytest` fixtures for API stubs. Place unit tests under `tests/unit/` and high-level flows under `tests/integration/`.
- Mirror source structure inside `tests/` and name test files `test_<module>.py`.
- Maintain coverage above 85%; include regression tests when modifying parsing logic or CSV schemas.

## Commit & Pull Request Guidelines

- Write commit messages using the imperative mood (`feat: add metro export transformer`). Group related changes into a single commit where possible.
- PRs must include a concise summary, linked Jira or GitHub issue, manual verification notes, and relevant screenshots or sample CSV diffs.
- Assign at least one reviewer familiar with the exporter pipeline and respond to feedback within one business day.

## Security & Data Handling

- Treat invoice exports as confidential. Never commit PII-heavy files; sanitize sample data before pushing.
- Store API keys in `.env` or your secrets manager, not in tracked files. Add new secrets to the shared vault with a brief description.
