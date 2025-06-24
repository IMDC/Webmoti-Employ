# Web-Employ Express Server

See original readme at [zoom/videosdk-auth-endpoint-sample](https://github.com/zoom/videosdk-auth-endpoint-sample/blob/master/README.md)

## Setup

First install dependencies:

```bash
cd server

pnpm install
```

Then rename `.env.example` to `.env`, edit the file contents to include your [Zoom Video SDK key and secret](https://developers.zoom.us/docs/video-sdk/get-credentials/), save the file contents, and close the file:

Finally, start the server:

```bash
# start both react app and this server:
cd client
pnpm start

# start just this server:
cd server
pnpm start
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

### Example Request

POST `http://localhost:4000/token`

Request Body:

```json
{
  "sessionName": "Cool Cars",
  "role": 1,
  "sessionKey": "session123",
  "userIdentity": "user123"
}
```

If successful, the response body will be a JSON representation of your signature:

```json
{
  "signature": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfa2V5IjoiVklERU9fU0RLX0tFWSIsImlhdCI6MTY0NjI0ODc5NiwiZXhwIjoxNjQ2MjU1OTk2LCJ0cGMiOiJDb29sIENhcnMiLCJ1c2VyX2lkZW50aXR5IjoidXNlcjEyMyIsInNlc3Npb25fa2V5Ijoic2Vzc2lvbjEyMyIsInJvbGVfdHlwZSI6MH0.Y6C65mZUxTZFeGiOI6oW5q2UkIXe3nLTK0MVNkfiJ9c"
}
```

In the [Video SDK](https://developers.zoom.us/docs/video-sdk/auth/#start-and-join-sessions-with-the-video-sdk-jwt), pass in the `signature` to the `join()` function:

```js
// Make http request to your auth endpoint to get the Video SDK JWT

// Video SDK - web - example:

client.join(
   signature: signature,
   topic: sessionName,
   userName: userName,
   password: sessionPasscode
)
```

## Deployment
