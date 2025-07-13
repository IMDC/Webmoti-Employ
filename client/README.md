# Web-Employ React Client

## Setup

### Set environment variables

First rename `.env.example` to `.env`.

Then add environment variables:

1. Add `VITE_CLERK_PUBLISHABLE_KEY` from Clerk dashboard in `Configure` > `API keys` and add it to `.env` ([more info](../server/README.md#authentication))

## Deploying

The client is deployed on Vercel. It integrates with GitHub so when you push a commit, the deployment is automatically updated.

Steps:

1. Make vercel account with GitHub sign in
2. Click Install GitHub application under Import Git Repository
3. Click import for the GitHub repo and make new project
4. Change project name
5. Set root to `client`
6. Add environment variables from `.env`
7. Click Deploy
