import { jwtVerify } from 'jose'
import { describe, expect, it } from 'vitest'
import { generateZoomApiJwt, generateZoomVideoJwt } from '../../src/routes/sessions/jwt'

describe('jwt generation', () => {
  describe('generateZoomApiJwt', () => {
    it('should generate a valid Zoom API JWT', async () => {
      const apiKey = 'test-api-key'
      const apiSecret = 'test-api-secret'

      const jwt = await generateZoomApiJwt(apiKey, apiSecret)

      expect(jwt).toBeTruthy()
      expect(typeof jwt).toBe('string')

      // Verify the JWT structure and claims
      const encodedSecret = new TextEncoder().encode(apiSecret)
      const { payload } = await jwtVerify(jwt, encodedSecret)

      expect(payload.iss).toBe(apiKey)
      expect(payload.iat).toBeDefined()
      expect(payload.exp).toBeDefined()
      expect(payload.exp).toBeGreaterThan(payload.iat as number)

      // Verify expiration is 5 minutes (300 seconds)
      const expDiff = (payload.exp as number) - (payload.iat as number)
      expect(expDiff).toBe(300)
    })

    it('should generate different tokens for different API keys', async () => {
      const jwt1 = await generateZoomApiJwt('key1', 'secret1')
      const jwt2 = await generateZoomApiJwt('key2', 'secret2')

      expect(jwt1).not.toBe(jwt2)
    })
  })

  describe('generateZoomVideoJwt', () => {
    it('should generate a valid Zoom Video SDK JWT with all required fields', async () => {
      const input = {
        zoomVideoSdkKey: 'test-sdk-key',
        zoomVideoSdkSecret: 'test-sdk-secret',
        role: 1,
        sessionName: 'test-session',
        expirationSeconds: 3600,
        userIdentity: 'test-user',
        sessionKey: 'test-session-key',
        geoRegions: 'US',
        cloudRecordingOption: 1,
        cloudRecordingElection: 1,
        telemetryTrackingId: 'tracking-123',
        videoWebRtcMode: 1,
        audioWebRtcMode: 1,
      }

      const jwt = await generateZoomVideoJwt(input)

      expect(jwt).toBeTruthy()
      expect(typeof jwt).toBe('string')

      // Verify the JWT structure and claims
      const encodedSecret = new TextEncoder().encode(input.zoomVideoSdkSecret)
      const { payload } = await jwtVerify(jwt, encodedSecret)

      expect(payload.app_key).toBe(input.zoomVideoSdkKey)
      expect(payload.role_type).toBe(input.role)
      expect(payload.tpc).toBe(input.sessionName)
      expect(payload.version).toBe(1)
      expect(payload.user_identity).toBe(input.userIdentity)
      expect(payload.session_key).toBe(input.sessionKey)
      expect(payload.geo_regions).toBe(input.geoRegions)
      expect(payload.cloud_recording_option).toBe(input.cloudRecordingOption)
      expect(payload.cloud_recording_election).toBe(input.cloudRecordingElection)
      expect(payload.telemetry_tracking_id).toBe(input.telemetryTrackingId)
      expect(payload.video_webrtc_mode).toBe(input.videoWebRtcMode)
      expect(payload.audio_webrtc_mode).toBe(input.audioWebRtcMode)
    })

    it('should use default expiration of 2 hours when not specified', async () => {
      const input = {
        zoomVideoSdkKey: 'test-sdk-key',
        zoomVideoSdkSecret: 'test-sdk-secret',
        role: 1,
        sessionName: 'test-session',
        userIdentity: 'test-user',
      }

      const jwt = await generateZoomVideoJwt(input as any)

      const encodedSecret = new TextEncoder().encode(input.zoomVideoSdkSecret)
      const { payload } = await jwtVerify(jwt, encodedSecret)

      const expDiff = (payload.exp as number) - (payload.iat as number)
      // 2 hours = 7200 seconds
      expect(expDiff).toBe(7200)
    })

    it('should use custom expiration when specified', async () => {
      const customExpiration = 1800 // 30 minutes
      const input = {
        zoomVideoSdkKey: 'test-sdk-key',
        zoomVideoSdkSecret: 'test-sdk-secret',
        role: 1,
        sessionName: 'test-session',
        expirationSeconds: customExpiration,
        userIdentity: 'test-user',
      }

      const jwt = await generateZoomVideoJwt(input as any)

      const encodedSecret = new TextEncoder().encode(input.zoomVideoSdkSecret)
      const { payload } = await jwtVerify(jwt, encodedSecret)

      const expDiff = (payload.exp as number) - (payload.iat as number)
      expect(expDiff).toBe(customExpiration)
    })
  })
})
