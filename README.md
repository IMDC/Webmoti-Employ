# Web-Employ <!-- omit from toc -->

- [Stack](#stack)
- [Setup](#setup)
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

## VSCode Auto Formatting Code

<https://github.com/antfu/eslint-config?tab=readme-ov-file#ide-support-auto-fix-on-save>

1. Install [VS Code ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

2. Add the following settings to your `.vscode/settings.json`:

```json
{
  // Disable the default formatter, use eslint instead
  "prettier.enable": false,
  "editor.formatOnSave": false,

  // Auto fix
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },

  // Silent the stylistic rules in you IDE, but still auto fix them
  "eslint.rules.customizations": [
    { "rule": "style/*", "severity": "off", "fixable": true },
    { "rule": "format/*", "severity": "off", "fixable": true },
    { "rule": "*-indent", "severity": "off", "fixable": true },
    { "rule": "*-spacing", "severity": "off", "fixable": true },
    { "rule": "*-spaces", "severity": "off", "fixable": true },
    { "rule": "*-order", "severity": "off", "fixable": true },
    { "rule": "*-dangle", "severity": "off", "fixable": true },
    { "rule": "*-newline", "severity": "off", "fixable": true },
    { "rule": "*quotes", "severity": "off", "fixable": true },
    { "rule": "*semi", "severity": "off", "fixable": true }
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
