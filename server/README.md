# Web-Employ Server <!-- omit from toc -->

- [Setup](#setup)
  - [Set secrets](#set-secrets)
- [Running server locally](#running-server-locally)
- [Deploying](#deploying)
- [Services](#services)
  - [Database](#database)
    - [Neon](#neon)
    - [Cloudflare Hyperdrive](#cloudflare-hyperdrive)

## Setup

### Set secrets

Then rename `.dev.vars.example` to `.dev.vars`, edit the file contents to include your [Zoom Video SDK key and secret](https://developers.zoom.us/docs/video-sdk/get-credentials/), save the file contents, and close the file.

Whenever you change any env variables in `.dev.vars`, run `pnpm run cf-typegen` ([more info here](https://developers.cloudflare.com/workers/wrangler/commands/#types))

## Running server locally

```bash
# start just this server:
cd server
pnpm run dev

# start both react app and this server:
cd client
pnpm start
```

## Deploying

```bash
npm run deploy
```

## Services

We use services for hosting, the database, and authentication.

### Database

The database is postgres deployed with the Neon service. We also use Cloudflare hyperdrive to connect to the database.

#### Neon

1. Choose the closest region (Azure East US 2 (Virginia))
2. Create the tables in the public schema:

   ![Interview table](docs/interview_table.png)
   ![Interview invite table](docs/interview_invite_table.png)

3. Create a non owner role to use (replace `<password>` with the actual password) ([More info](https://neon.com/docs/manage/database-access#create-a-read-write-role)) The password should have at least 12 characters with a mix of lowercase, uppercase, number, and symbol characters.

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

4. Get the connection string. Make sure the role is readwrite_imdc. Put this connection string in `.dev.vars` as the `DATABASE_URL` field.
5. Run `pnpm run db-typegen` to generate types for the database. Do this whenever you change the Neon database.

#### Cloudflare Hyperdrive

<https://developers.cloudflare.com/hyperdrive/get-started/>

1. Login to cloudflare: `npx wrangler login`
2. `npx wrangler hyperdrive create <YOUR_CONFIG_NAME> --connection-string="<MY_CONNECTION_STRING>"` (You get this connection string from the Neon dashboard. Make sure you turn off Connection pooling before copying it: <https://neon.com/blog/hyperdrive-neon-faq#so-should-i-use-hyperdrive-together-with-neons-pooling>) (If you already initialized it, you can update it like this: `npx wrangler hyperdrive update <MY_HYPERDRIVE_ID> --connection-string "<MY_CONNECTION_STRING_WITHOUT_POOLING>"`)

Disable caching to prevent stale reads:
<https://developers.cloudflare.com/hyperdrive/configuration/query-caching/>

```bash
npx wrangler hyperdrive update my-hyperdrive-id --origin-password my-db-password --caching-disabled true
```
