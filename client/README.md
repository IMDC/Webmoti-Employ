# @webmoti-employ/client

This is a React and Vite app that's deployed online and also wrapped in Electron for the desktop app.

## Setup

### Set environment variables

First rename `.env.example` to `.env`.

Then add environment variables:

1. Add `VITE_API_BASE_URL`

## Deploying

The client is deployed on Vercel. Since Vercel doesn't allow collaborators on the hobby plan, we use a Github action instead for automatic deployments.

<https://www.alexchantastic.com/deploying-with-vercel-cli>

1. `pnpm dlx vercel login`
2. Continue with Google
3. `pnpm dlx vercel`
4. Don't link to existing project
5. Set root to `./client`
6. Use default deployment protection settings
7. Linking to repository is not needed
8. Go to your new project in Vercel dashboard
9. Add environment variables from `.env`
10. [Deploy server](../server/README.md#deploying), get deployed url, and set new environment variable (`VITE_API_BASE_URL`) in `Settings` > `Environment Variables`

Steps for automatic deployments:

(These are outdated now since Vercel changed something recently)
<https://vercel.com/guides/how-can-i-use-github-actions-with-vercel>
<https://faisalhusa.in/blog/vercel-free-tier-cicd-fix>

See https://github.com/DaviZCodes/vercel-hobby-collaboration-github-actions for a working workflow

1. In Vercel dashboard > `Account settings` > `Tokens`, make a new API token.
2. Inside the generated `.vercel` folder (from above steps), save the projectId and orgId from the project.json. You can also get this from the Vercel dashboard.
3. Inside GitHub, add VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID as [secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
