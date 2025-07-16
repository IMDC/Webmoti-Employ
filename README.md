<p align="center">
  <img src="client/src/favicon.svg" alt="Icon" height="150"/>
</p>

<h1 align="center">WebMoti-Employ</h1>

<p align="center">
  <strong>Interviews built for neurodivergent job seekers</strong>
</p>

WebMoti-Employ is an app that uses eyetracking to deliver real-time feedback during virtual interviews, helping neurodivergent candidates stay focused.

[![Build](https://github.com/DanielBoxer/web-employ/actions/workflows/build.yml/badge.svg)](https://github.com/DanielBoxer/web-employ/actions/workflows/build.yml)

- [Stack](#stack)
- [Setup](#setup)
- [Desktop App](#desktop-app)
- [Deploying](#deploying)
- [VSCode Auto Formatting Code](#vscode-auto-formatting-code)
- [Firefox Dev WebRTC error](#firefox-dev-webrtc-error)

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
- Clerk - auth
- Zoom Video

Server:

- Hono
- Kysely - SQL query builder

Desktop App:

- Electron
- Electron-Builder

Hosting:

- Neon - database
- Cloudflare workers - server hosting
- Vercel - client hosting

## Setup

1. [Setup the server](server/README.md#setup)

2. [Setup the client](client/README.md#setup)

3. Install dependencies

```bash
# This project uses pnpm. If not installed, run `npm install -g pnpm`
pnpm install

# run both client and server
pnpm run dev
```

## Desktop App

```bash
# run the app locally
pnpm run dev:electron

# create a distributable app file
# (run the one for your operating system)
pnpm run dist:win
pnpm run dist:linux
pnpm run dist:mac
```

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
