# @webmoti-employ/electron

This bundles the built React client so it can be run locally as an Electron app.

## Setup

### uv

Install the `uv` python package manager:

```powershell
# Windows install
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

```bash
# macOS and Linux install
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Ruff

Install this for linting and formatting Python code.

```bash
uv tool install ruff@latest
```

### Dependencies

## Creating distributable file

- On Windows, you need to run as admin before running `pnpm run dist:win` the first time you run this command.
