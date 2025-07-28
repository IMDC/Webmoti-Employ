# @webmoti-employ/electron <!-- omit from toc -->

This Electron app bundles the built React client so it can be run locally. It also runs the Tobii eyetracker using Python to send feedback to the client.

- [Setup](#setup)
  - [uv](#uv)
  - [Install Dependencies](#install-dependencies)
  - [Ruff](#ruff)
- [Running the eyetracking script locally](#running-the-eyetracking-script-locally)
- [Face detection](#face-detection)
- [Creating distributable file](#creating-distributable-file)

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

## Running the eyetracking script locally

```bash
cd electron/python

uv run main.py
```

## Face detection

To get the area of interest dynamically for eyetracking analysis we use Mediapipe Face Detector. This uses a machine learning model (BlazeFace) to locate faces so we can tell the eyetracking script where the interviewer is. Face detection runs in the React frontend and sends the bounding box to the Electron backend.

[Download the BlazeFace model here](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector/index#blazeface_short-range) and store it in `electron/models`.

## Creating distributable file

- On Windows, you need to run as admin before running `pnpm run dist:win` the first time you run this command.
