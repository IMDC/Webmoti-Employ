<p align="center">
  <img src="client/public/favicon.svg" alt="Icon" height="150"/>
</p>

<h1 align="center">WebMoti-Employ</h1>

<p align="center">
  <strong>Interviews built for neurodivergent job seekers</strong>
</p>

WebMoti-Employ is an app that uses eyetracking to deliver real-time feedback during virtual interviews, helping neurodivergent candidates stay focused. test

[![Build](https://github.com/DanielBoxer/web-employ/actions/workflows/build.yml/badge.svg)](https://github.com/DanielBoxer/web-employ/actions/workflows/build.yml)

- [Stack](#stack)
- [Setup](#setup)
- [CI/CD](#cicd)
- [Dependabot](#dependabot)
- [Desktop App](#desktop-app)
- [Deploying](#deploying)
- [VSCode Auto Formatting Code](#vscode-auto-formatting-code)
- [Firefox Dev WebRTC error](#firefox-dev-webrtc-error)

![Dashboard](img/dashboard.png)

![Interview room](img/room.png)

[See more app screenshots here](img/screenshots.md)

## Stack

- PNPM - package manager
- TypeScript
- Zod - validation
- Eslint – formatting and linting (@antfu/eslint-config)

Client:

- React
- Vite
- Mantine - UI components
- Tanstack router - routing
- Tanstack query - server state
- Zustand - client state
- Better-Auth
- Zoom Video

Server:

- Hono
- Kysely - SQL query builder

Desktop App:

- Electron
- Electron-Builder
- Python
- Socket.IO
- Tobii Pro SDK (Eyetracking)

Hosting:

- Neon - database
- Cloudflare workers - server hosting
- Vercel - client hosting

## Setup

1. [Setup the server](server/README.md#setup)

2. [Setup the client](client/README.md#setup)

3. [Setup the desktop app](electron/README.md#setup)

4. Install pnpm

    ```bash
    npm install -g pnpm
    ```

5. Install dependencies

    ```bash
    pnpm install
    ```

6. Setup ESLint

    This project uses ESLint to have better code quality and prevent bugs. This should be configured depending on your IDE so you can see issues as you write code. If you use VSCode, follow [these steps](#vscode-auto-formatting-code) to set it up.

7. Run the project locally

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
5. `Dependabot Updates` ([More info here](#dependabot))
   - Creates PRs for dependency updates

## Dependabot

Dependabot checks for new dependencies for all `package.json` files in the project. It also does this for python in `electron/python/pyproject.toml`, but this doesn't work and always fails because Dependabot doesn't properly work for the `uv` package manager.

All patch and minor versions are grouped in the `non-breaking` group in new pull requests. You can just merge these. Major updates are not grouped and have separate PRs for each one since they might break the code.

Steps to update dependencies:

1. Go to `Pull requests`
2. Click one
3. (optional) Comment `@dependabot rebase` if you made commits after this PR and there are conflicts, and wait for it to fix it
4. Check that all checks passed
5. Use the dropdown to switch to `Squash and merge`
6. Click `Squash and merge`

## Desktop App

The desktop app is a cross platform Electron app that wraps the React client and runs a Python server in the background. This allows us to connect to the eyetracker using the Tobii Pro Python SDK.

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

## Firefox Dev WebRTC error

When you run the Vite dev server in Firefox and you join an interview, it will fail with this error in the console:

```text
WebRTC: ICE failed, add a STUN server and see about:webrtc for more details
```

Use Chrome instead for developing.
