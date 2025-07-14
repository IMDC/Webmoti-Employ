# Web-Employ <!-- omit from toc -->

- [Stack](#stack)
- [Setup](#setup)
- [Deploying](#deploying)
- [VSCode Auto Formatting Code](#vscode-auto-formatting-code)
- [Dependabot](#dependabot)

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

## Deploying

The client and server are deployed separately.

1. [Deploy the client](client/README.md#deploying)
2. [Deploy the server](server/README.md#deploying)

## VSCode Auto Formatting Code

> **_NOTE:_**  After the eslint extension server runs for a while, it gets slower when formatting code. To fix this, run `ctrl + shift + p` > `ESLint: Restart ESLint Server`

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

## Dependabot

<https://docs.github.com/en/code-security/getting-started/dependabot-quickstart-guide#enabling-dependabot-for-your-repository>
