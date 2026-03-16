# @webmoti-employ/server <!-- omit from toc -->

The server uses the Hono framework so it can run on serverless environments. This server is deployed to Cloudflare workers and responds to the web client and desktop app.

- [Setup](#setup)
  - [Set secrets](#set-secrets)
    - [.dev.vars](#devvars)
    - [.env](#env)
  - [Local database](#local-database)
- [Deploying](#deploying)
- [Services](#services)
  - [Video Calling](#video-calling)
  - [Database](#database)
    - [Neon](#neon)
    - [Migrations](#migrations)
      - [Local migrations](#local-migrations)
      - [Remote migrations](#remote-migrations)
    - [Cloudflare Hyperdrive](#cloudflare-hyperdrive)
  - [Authentication](#authentication)
    - [Better Auth Setup](#better-auth-setup)
    - [Google OAuth Setup](#google-oauth-setup)

## Setup

### Set secrets

#### .dev.vars

First rename `.dev.vars.example` to `.dev.vars`.

Then add secrets:

1. Add `ZOOM_VIDEO_SDK_KEY` and `ZOOM_VIDEO_SDK_SECRET` ([more info](#video-calling))
2. Add `ZOOM_API_KEY` and `ZOOM_API_SECRET` ([more info](#video-calling))
3. Add `DATABASE_URL` (This is for kysely-codegen only (to generate types for the Neon database). Set this to the [Neon database connection string](#neon))
4. Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` ([more info](#authentication))
5. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` ([more info](#google-oauth-setup))
6. Add `CORS_ORIGIN`. This is the url of the client.
7. Add `LOCAL_DATABASE_URL`. This is the same as the `WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` below.
8. Add `GROQ_API_KEY`. Get this from the [Groq console](https://console.groq.com/keys).
9. Add `SPEECHMATICS_API_KEY`. Get this from the [Speechmatics dashboard](https://portal.speechmatics.com/api-keys).
10. Add `ALLOWED_EMAILS`. Comma-separated list of emails that are allowed to sign in. This is used to allow non TMU Google Accounts to sign in.
11. `IS_DEV` is already set to `true` in `.dev.vars.example`. Remove this variable for production.

Whenever you change any env variables in `.dev.vars`, run `pnpm run cf-typegen` ([more info here](https://developers.cloudflare.com/workers/wrangler/commands/#types)). For first time setup you don't need to do this since there is a postinstall script which will run this automatically.

#### .env

Rename `.env.example` to `.env`. This hyperdrive variable doesn't get detected in `.dev.vars`, so we need to make a `.env` just for this. The `.env` is only used for local development to make some variables available to dev tools.

1. Add `WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` ([see below for details](#local-database))
2. Add `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`. Note that the database url is the Neon database url, not the local postgres url used above.
3. `POSTINSTALL_CF_TYPEGEN` is already set to `true` in `.env.example`. This controls whether `cf-typegen` runs automatically on `pnpm install`.

### Local database

For running the server locally, you need a local PostgreSQL database.

Setup video: <https://www.youtube.com/watch?v=tu7zuv6aMug> (up to 3:45)

1. Setup PostgreSQL
    1. [Download](https://www.postgresql.org/download/) PostgreSQL (version 17)
    2. Create a password for the superuser (it can be anything)
    3. Open pgAdmin and unlock with your superuser password
2. Create database
    1. Right click `Databases` > `Create` > `Database...`
    2. Under `General`, Enter anything for the `Database` name (ex. `webmoti-employ`)
    3. Press `Save`
3. Get the connection string (postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME)
    - USERNAME: your superuser username (probably `postgres` if unchanged)
    - PASSWORD: your superuser password
    - DATABASE_NAME: your database name
    - localhost:5432: this part is the same if you selected the default port
4. Put this connection string in `server/.env` as `WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`
5. [Run local database migration](#migrations) to create the tables

## Deploying

The server is deployed using Cloudflare workers.

Steps:

1. `pnpm dlx wrangler login`
2. (optional) Setup hyperdrive if you haven't already
3. Create project: `cd server` `pnpm run deploy`
4. Go to cloudflare dashboard and then to your worker
5. In `Settings` > `Variables and Secrets`, add everything in `.dev.vars` except `DATABASE_URL` and `LOCAL_DATABASE_URL`. You can copy the whole env and paste it into the `Variable name` field which speeds up the process (make sure you exclude the two database ones).
6. For `BETTER_AUTH_URL`, set this to the url of the server (the deployed cloudflare worker). Set `CORS_ORIGIN` to the deployed client vercel url.
7. Set the type of all the secrets to `Secret` instead of `Text` (Except for ALLOWED_EMAILS, set that to `Text` since you may edit this sometimes)
8. Press `Deploy`
9. Get the deployed server url and set it in Vercel for client as `VITE_API_BASE_URL`
10. [Deploy client](../client/README.md#deploying), get the url, and set `CORS_ORIGIN` secret in Cloudflare

Steps for automatic deployments:

<https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/>

1. Create API token
   - Log in to the Cloudflare dashboard
   - Select `Manage Account` > `Account API Tokens`.
   - Select `Create Token` > find `Edit Cloudflare Workers` > select `Use Template`.
   - Customize your token name.
   - Scope your token.
2. Add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` to Github as secrets.

## Services

We use services for hosting, the database, authentication, and video calling.

### Video Calling

We use the Zoom Video SDK for video calling.

Get your [Zoom Video SDK key and secret](https://developers.zoom.us/docs/video-sdk/get-credentials/) from the zoom website. You can also access the API key and API secret right under the SDK values. Note that this is different from the SDK key and is only used for the Zoom Video REST API.

### Database

The database is postgres deployed with the Neon service. We also use Cloudflare hyperdrive to connect to the database.

#### Neon

1. Choose the closest region (AWS US East 1 (N. Virginia))
2. Create a non owner role to use (replace `<password>` with the actual password) ([More info](https://neon.com/docs/manage/database-access#create-a-read-write-role)) The password should have at least 12 characters with a mix of lowercase, uppercase, number, and symbol characters.

   ```sql
   -- readwrite role
   CREATE ROLE readwrite PASSWORD '<password>';
   GRANT CONNECT ON DATABASE neondb TO readwrite;
   GRANT USAGE, CREATE ON SCHEMA public TO readwrite;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO readwrite;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO readwrite;
   GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO readwrite;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO readwrite;

   -- User creation
   CREATE USER readwrite_imdc WITH PASSWORD '<password>';

   -- Grant privileges to user
   GRANT readwrite TO readwrite_imdc;
   ```

3. Get the connection string. Make sure the role is readwrite_imdc. Put this connection string in `.dev.vars` as the `DATABASE_URL` field. Also put it in `.env`.
4. [Run remote database migration](#migrations) to generate the tables

#### Migrations

Database migrations sync a database with the project migration files (similar to git commits).
This means that if the database needs to be changed, one person can commit a migration file with those changes, and all team members can run the migrate command to update their local databases.

##### Local migrations

These migrations will update your local postgres database.

```bash
# This command runs both our migration and better-auth. It's meant for setup only.
pnpm migrate:local:all

# Our custom tables:
pnpm migrate:local

# Better-Auth tables:
# (This only needs to be run when setting up, not when you change our table schema)
pnpm migrate:better-auth:local
```

##### Remote migrations

These migrations will update the remote postgres (Neon) database.

```bash
# This command runs both our migration and better-auth. It's meant for setup only.
pnpm migrate:remote:all

# Our custom tables:
pnpm migrate:remote

# Better-Auth tables:
# (This only needs to be run when setting up, not when you change our table schema)
pnpm migrate:better-auth:remote
```

#### Cloudflare Hyperdrive

<https://developers.cloudflare.com/hyperdrive/get-started/>

1. Login to cloudflare: `pnpm dlx wrangler login`
2. `pnpm dlx wrangler hyperdrive create <YOUR_CONFIG_NAME> --connection-string="<MY_CONNECTION_STRING>"` (You get this connection string from the Neon dashboard. Make sure you turn off Connection pooling before copying it: <https://neon.com/blog/hyperdrive-neon-faq#so-should-i-use-hyperdrive-together-with-neons-pooling>) (If you already initialized it, you can update it like this: `pnpm dlx wrangler hyperdrive update <MY_HYPERDRIVE_ID> --connection-string "<MY_CONNECTION_STRING_WITHOUT_POOLING>"`)
3. Set `WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` in `.env` as your local postgres db connection string. You can also set this to the Neon db connection string, but then you need to run the server with `wrangler dev --remote` (note: this env variable ends with `_HYPERDRIVE` since that's what the `hyperdrive` binding is set to in `wrangler.jsonc`)
4. Disable caching to prevent stale reads:
<https://developers.cloudflare.com/hyperdrive/configuration/query-caching/>

    ```bash
    pnpm dlx wrangler hyperdrive update my-hyperdrive-id --origin-password my-db-password --caching-disabled true
    ```

### Authentication

Authentication is done using Better Auth. This is self hosted.

Set environment variables: <https://www.better-auth.com/docs/installation#set-environment-variables>

#### Better Auth Setup

A good resource for this is: <https://hono.dev/examples/better-auth-on-cloudflare>

1. Use the site to generate the `BETTER_AUTH_SECRET` (or `npx @better-auth/cli secret`). Also generate a second one to put in the GitHub repo secrets so it works in the CI.
2. For the `BETTER_AUTH_URL`, you can set this to `http://localhost:8787` for dev (assuming the hono app runs on port `8787`). For production you can set this to the actual url of the Cloudflare deployed hono app.
3. (optional) Create Better Auth Table SQL: `pnpm run db:better-auth-gen`. This will generate `src/db/better-auth-schema.sql` which we don't use, but it's useful to use for creating local tables in the local Postgresql database.
4. [Run better-auth migrations](#migrations)

#### Google OAuth Setup

This is for enabling Google login.

1. Go to Google Cloud Console
2. Create project
3. Go to `Credentials` > `Configure consent screen`
4. Fill out App Information
   - Select `Internal` Audience to only make it available to users in the TMU organization. This also means you don't have to verify the app. Also, it means that you don't have to manually add users to the "test users".
5. Create OAuth client:
   - Application type: `Web application`
   - Name: Anything
   - Add to the `Authorized redirect URLs`: `http://localhost:8787/auth/callback/google` (for local dev), and add the actual url for the deployed Cloudflare server (with `/auth/callback/google` at the end).
6. Copy the secret and id, and put that into `.dev.vars`
