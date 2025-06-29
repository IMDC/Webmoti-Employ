# Web-Employ Server

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

## Setup

### Install dependencies

```bash
cd new-server

pnpm install
```

### Set secrets

Then rename `.dev.vars.example` to `.dev.vars`, edit the file contents to include your [Zoom Video SDK key and secret](https://developers.zoom.us/docs/video-sdk/get-credentials/), save the file contents, and close the file.

## Running server locally

```bash
# start just this server:
cd new-server
pnpm run dev

# start both react app and this server:
cd client
pnpm start
```

## Deploying

```txt
npm run deploy
```

## Usage

Make a POST request to `http://localhost:4000` (or your deployed url) with the following request body:

| Property                 | Type     | Required? | Validation Rule(s)                                                                                           |
| ------------------------ | -------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `sessionName`            | `string` | **Yes**   | - Required <br> - Value length be fewer than 200 characters                                                  |
| `role`                   | `number` | **Yes**   | - Required <br> - Must equal `0` or `1`                                                                      |
| `expirationSeconds`      | `number` | No        | - Must be between `1800` (30 minutes) and `172800` (48 hours) seconds                                        |
| `userIdentity`           | `string` | No        | - Must be fewer than 35 characters                                                                           |
| `sessionKey`             | `string` | No        | - Must be fewer than 36 characters                                                                           |
| `geoRegions`             | `string` | No        | - Must be a comma-separated string with valid Zoom geo regions                                               |
| `cloudRecordingOption`   | `number` | No        | - Must equal `0` or `1`                                                                                      |
| `cloudRecordingElection` | `number` | No        | - Must equal `0` or `1`                                                                                      |
| `telemetryTrackingId`    | `string` | No        | N/A                                                                                                          |
| `videoWebRtcMode`        | `number` | No        | - Must equal `0` or `1`                                                                                      |
| `audioWebRtcMode`        | `number` | No        | - Must equal `0` or `1` <br> - Replaces `audioCompatibleMode` |
