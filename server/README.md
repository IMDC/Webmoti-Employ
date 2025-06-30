# Web-Employ Server <!-- omit from toc -->

- [Setup](#setup)
  - [Install dependencies](#install-dependencies)
  - [Set secrets](#set-secrets)
- [Running server locally](#running-server-locally)
- [Deploying](#deploying)
- [Services](#services)
  - [Database](#database)
- [Server Usage](#server-usage)

Todo or remove:

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```bash
npm run cf-typegen
```

## Setup

### Install dependencies

```bash
cd server

pnpm install
```

### Set secrets

Then rename `.dev.vars.example` to `.dev.vars`, edit the file contents to include your [Zoom Video SDK key and secret](https://developers.zoom.us/docs/video-sdk/get-credentials/), save the file contents, and close the file.

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

The database is postgres deployed with the Neon service.

Setup:

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

## Server Usage

Make a POST request to `http://localhost:8787` (or your deployed url) with the following request body:

| Property                 | Type     | Required? | Validation Rule(s)                                                    |
| ------------------------ | -------- | --------- | --------------------------------------------------------------------- |
| `sessionName`            | `string` | **Yes**   | - Required <br> - Value length be fewer than 200 characters           |
| `role`                   | `number` | **Yes**   | - Required <br> - Must equal `0` or `1`                               |
| `expirationSeconds`      | `number` | No        | - Must be between `1800` (30 minutes) and `172800` (48 hours) seconds |
| `userIdentity`           | `string` | No        | - Must be fewer than 35 characters                                    |
| `sessionKey`             | `string` | No        | - Must be fewer than 36 characters                                    |
| `geoRegions`             | `string` | No        | - Must be a comma-separated string with valid Zoom geo regions        |
| `cloudRecordingOption`   | `number` | No        | - Must equal `0` or `1`                                               |
| `cloudRecordingElection` | `number` | No        | - Must equal `0` or `1`                                               |
| `telemetryTrackingId`    | `string` | No        | N/A                                                                   |
| `videoWebRtcMode`        | `number` | No        | - Must equal `0` or `1`                                               |
| `audioWebRtcMode`        | `number` | No        | - Must equal `0` or `1` <br> - Replaces `audioCompatibleMode`         |
