# @webmoti-employ/electron <!-- omit from toc -->

The Electron app acts as a wrapper around the deployed React client. It runs the Tobii eyetracker using a Python server to send feedback to the client.

- [Setup](#setup)
  - [uv](#uv)
  - [Install Dependencies](#install-dependencies)
  - [Ruff](#ruff)
- [Running the app locally](#running-the-app-locally)
- [Face detection](#face-detection)
- [Packaging the app](#packaging-the-app)
  - [Local packaging](#local-packaging)

## Setup

The electron app uses a Python script to run eyetracking.

### uv

Install the `uv` Python package manager:

```powershell
# Windows install
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

```bash
# macOS and Linux install
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Install Dependencies

```bash
cd electron/python

# install python 3.10
uv python install 3.10

# create .venv and install deps
uv sync
```

### Ruff

Ruff is used for linting and formatting.

If using VSCode, install the Ruff [extension](https://marketplace.visualstudio.com/items?itemName=charliermarsh.ruff).

You can also install Ruff globally with `uv`:

```bash
uv tool install ruff@latest
```

## Running the app locally

```bash
# you can run this in the root or in the electron/ dir.
# this command runs the client vite server, the hono server, and the electron app in parallel.
# the electron app will load localhost:5173 (the vite server), so any changes you make to the client will hot reload.
pnpm run dev:electron
```

You can also run the eyetracking script locally but it might not work:

```bash
cd electron/python

uv run main.py
```

## Face detection

To get the area of interest dynamically for eyetracking analysis we use Mediapipe Face Detector. This uses a machine learning model (BlazeFace) to locate faces so we can tell the eyetracking script where the interviewer is. Face detection runs in the React frontend and sends the bounding box to the Electron backend.

[Download the BlazeFace model here](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector/index#blazeface_short-range) and store it in `electron/models`.

## Packaging the app

Packaging the app is automated using Github actions:

1. Increment the `version` field in `electron/package.json`
2. Commit this change
3. Github actions will detect this and automatically create a new release with the packaged app files (this can take 5-10 minutes)

Also make sure to set the `CLIENT_HOSTED_URL` Github Actions secret which is needed for electron packaging.

### Local packaging

You might want to package it locally for debugging purposes since you can inspect what files get packaged. To do this, open `electron/dist` after packaging the app.

> [!NOTE]
> On Windows, you might need to run as admin before running `pnpm run dist:win` the first time you run this command.

```bash
# create a distributable app file
# (run the one for your operating system)
pnpm run dist:win
pnpm run dist:linux
pnpm run dist:mac
```
