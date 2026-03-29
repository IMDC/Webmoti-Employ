<p align="center">
  <img src="client/public/favicon.svg" alt="Icon" height="150"/>
</p>

<h1 align="center">WebMoti-Employ</h1>

<p align="center">
  <strong>Interviews built for neurodivergent job seekers</strong>
</p>

WebMoti-Employ is an app that uses eyetracking to deliver real-time feedback during virtual interviews, helping neurodivergent candidates stay focused.

[![Build](https://github.com/DanielBoxer/web-employ/actions/workflows/build.yml/badge.svg)](https://github.com/DanielBoxer/web-employ/actions/workflows/build.yml)

- [Stack](#stack)
- [Real-time feedback pipeline](#real-time-feedback-pipeline)
  - [Eyetracking](#eyetracking)
  - [AI speech analysis](#ai-speech-analysis)
- [Setup](#setup)
- [CI/CD](#cicd)
- [Renovate](#renovate)
- [Desktop App](#desktop-app)
- [Deploying](#deploying)
- [VSCode Auto Formatting Code](#vscode-auto-formatting-code)
- [Possible errors and solutions](#possible-errors-and-solutions)
  - [Firefox Dev WebRTC error](#firefox-dev-webrtc-error)
  - [Problem with pnpm lockfile](#problem-with-pnpm-lockfile)

![Dashboard](img/dashboard.png)

![Interview room](img/room.png)

[See more app screenshots here](img/screenshots.md)

## Stack

- PNPM - Package manager
- TypeScript
- Zod - Validation
- ESLint - Formatting and linting (@antfu/eslint-config)
- Vitest - Unit testing

Client:

- React
- Vite
- Mantine - UI components
- Tanstack Router - Routing
- Tanstack Query - Server state
- Zustand - Client state
- Better-Auth - Authentication
- Zoom Video
- Speechmatics - Transcription
- Mediapipe - Face detection
- Playwright - E2E testing

Server:

- Hono
- Kysely - SQL query builder
- Groq - AI analysis
- Cloudflare Durable Objects - Stateful websockets
- Cloudflare Hyperdrive

Desktop App:

- Electron
- Electron-Builder
- Python
- Socket.IO
- Tobii Pro SDK - Eye tracking

Hosting:

- Neon - Postgres database
- Cloudflare Workers - Serverless backend
- Vercel - Client hosting

## Real-time feedback pipeline

Real-time feedback is done using eye tracking and AI analysis.

### Eyetracking

1. Electron spawns a Python server that runs eyetracking continuously using the Tobii SDK
2. Mediapipe face detection runs in the browser to determine the dynamic area of interest (AOI)
3. The AOI bounding box is sent through IPC to Electron
4. Electron sends the AOI to the Python server through Socket.IO
5. The Python server checks if the user is looking at the AOI using the Tobii eyetracking data
6. The Python server sends this eyetracking feedback to Electron
7. Electron sends this to the browser
8. Repeat from step 2

### AI speech analysis

1. User starts talking
2. Browser sends speech to Speechmatics over websocket
3. Speechmatics sends back transcribed words
4. Words are buffered in two cases to avoid spamming the AI with single words:
   - 5 or more words are accumulated in the buffer before sending
   - The user stops talking (all words in buffer are sent)
5. Transcript words are sent through a websocket to a Cloudflare Durable Object that allows multiple persistent connections
6. The durable object sends transcripts to Groq for AI analysis
7. Groq sends back a JSON with feedback
8. The durable object broadcasts this feedback to all connected clients
9. Repeat from step 1

## Setup

1. [Setup the server](server/README.md#setup)

2. [Setup the client](client/README.md#setup)

3. [Setup the desktop app](electron/README.md#setup)

4. Install pnpm

    ```bash
    npm install -g pnpm
    ```

5. (optional) Update pnpm

    ```bash
    # run this when you want to update pnpm to the latest version
    pnpm self-update
    ```

6. Install dependencies

    ```bash
    pnpm install
    ```

7. Setup ESLint

    This project uses ESLint to have better code quality and prevent bugs. This should be configured depending on your IDE so you can see issues as you write code. If you use VSCode, follow [these steps](#vscode-auto-formatting-code) to set it up.

8. Run the project locally

    ```bash
    # this will run both the client and server in parallel
    pnpm run dev
    ```

## CI/CD

We use Github actions for CI/CD automation. There are five main workflows:

1. `Build and Deploy`
    - Lints code
    - Checks for Typescript errors
    - Builds code
    - Runs tests
    - Activates the deploy workflows
2. `Vercel Deploy`
    - Checks for changes in `client/`
    - If changed, deploys client to Vercel
    - Creates a Github deployment
3. `Cloudflare Deploy`
    - Checks for changes in `server/`
    - If changed, deploys server to Cloudflare
4. `Electron Package`
   - Checks for changes in `electron/package.json` `version` field
   - If changed, packages the electron app for Windows, Linux, and MacOS
   - Creates a Github release and uploads the packaged files
5. `Python CI`
   - Runs when files in `electron/python/` change
   - Lints Python code with Ruff
   - Runs Python tests with pytest

## Renovate

Renovate checks for new dependencies for all `package.json` files in the project. It also handles Python dependencies in `electron/python/pyproject.toml`.

npm updates are grouped into PRs by type:

- `minor updates`: all non-eslint minor bumps grouped together
- `patch updates`: all non-eslint patch bumps grouped together
- `eslint`: eslint-related minor and patch bumps grouped together
- Major updates are separate PRs since they might break the code

Steps to update dependencies:

1. Go to `Pull requests`
2. Click one
3. Check that all checks passed
4. Use the dropdown to switch to `Squash and merge`
5. Click `Squash and merge`

## Desktop App

The desktop app is a cross platform Electron app that loads the hosted React client and runs a Python server in the background. This allows us to connect to the eyetracker using the Tobii Pro Python SDK.

[More info about desktop app here](electron/README.md)

## Deploying

The client and server are deployed separately.

1. [Deploy the client](client/README.md#deploying)
2. [Deploy the server](server/README.md#deploying)

## VSCode Auto Formatting Code

> [!NOTE]
> After the eslint extension server runs for a while, it gets slower when formatting code. To fix this, run `ctrl + shift + p` > `ESLint: Restart ESLint Server`

<https://github.com/antfu/eslint-config?tab=readme-ov-file#ide-support-auto-fix-on-save>

1. Install [VS Code ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

2. Add the following settings to your `.vscode/settings.json`:

```jsonc
{
  // Disable the default formatter, use eslint instead
  "prettier.enable": false,
  "editor.formatOnSave": false,

  // Auto fix
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },

  // Only warn for stylistic rules
  "eslint.rules.customizations": [
    { "rule": "style/*", "severity": "warn" },
    { "rule": "format/*", "severity": "warn" },
    { "rule": "*-indent", "severity": "warn" },
    { "rule": "*-spacing", "severity": "warn" },
    { "rule": "*-spaces", "severity": "warn" },
    { "rule": "*-order", "severity": "warn" },
    { "rule": "*-dangle", "severity": "warn" },
    { "rule": "*-newline", "severity": "warn" },
    { "rule": "*quotes", "severity": "warn" },
    { "rule": "*semi", "severity": "warn" }
  ],

  // Enable eslint for all supported languages
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue",
    "html",
    "markdown",
    "json",
    "jsonc",
    "yaml",
    "toml",
    "xml",
    "gql",
    "graphql",
    "astro",
    "svelte",
    "css",
    "less",
    "scss",
    "pcss",
    "postcss"
  ]
}
```

## Possible errors and solutions

### Firefox Dev WebRTC error
When you run the Vite dev server in Firefox and you join an interview, it will fail with this error in the console:

```text
WebRTC: ICE failed, add a STUN server and see about:webrtc for more details
```

Solution: Use Chrome instead for developing.

### Problem with pnpm lockfile

This problem could manifest in many different ways, for example zoom video not working or a strange error in the console. This could happen after the dependencies were changed, maybe with Renovate or manually.

Solution: Delete `pnpm-lock.yaml`, run `pnpm clean-modules`, and run `pnpm i` to regenerate the lockfile.
