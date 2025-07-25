# @webmoti-employ/client

This is a React and Vite app that's deployed online and also wrapped in Electron for the desktop app.

## Setup

### Set environment variables

First rename `.env.example` to `.env`.

Then add environment variables:

1. Add `VITE_CLERK_PUBLISHABLE_KEY` from Clerk dashboard in `Configure` > `API keys` and add it to `.env` ([more info](../server/README.md#authentication))

## Deploying

The client is deployed on Vercel. Since Vercel doesn't allow collaborators on the hobby plan, we use a Github action instead for automatic deployments.

Steps for automatic deployments:

<https://vercel.com/guides/how-can-i-use-github-actions-with-vercel>
<https://faisalhusa.in/blog/vercel-free-tier-cicd-fix>

1. Retrieve your [Vercel Access Token](https://vercel.com/guides/how-do-i-use-a-vercel-api-access-token)
2. (optional) Install the [Vercel CLI](https://vercel.com/cli) and run vercel login
3. (optional) Inside your folder, run vercel link to create a new Vercel project
4. (optional) Inside the generated .vercel folder, save the projectId and orgId from the project.json
5. Inside GitHub, add VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID as [secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
