import { describe, expect, it } from 'vitest'
import { jwtVerify } from 'jose'
import { generateZoomApiJwt, generateZoomVideoJwt } from '../../src/routes/sessions/jwt'

describe('JWT Generation', () => {
  describe('generateZoomApiJwt', () => {
    it('should generate a valid JWT with correct structure', async () => {
      const apiKey = 'test_api_key'
      const apiSecret = 'test_api_secret'

      const jwt = await generateZoomApiJwt(apiKey, apiSecret)

      expect(jwt).toBeTruthy()
      expect(typeof jwt).toBe('string')
      expect(jwt.split('.')).toHaveLength(3) // JWT should have 3 parts
    })

    it('should include correct payload fields', async () => {
      const apiKey = 'test_api_key'
      const apiSecret = 'test_api_secret'

      const jwt = await generateZoomApiJwt(apiKey, apiSecret)

      // Verify and decode the JWT
      const secret = new TextEncoder().encode(apiSecret)
      const { payload } = await jwtVerify(jwt, secret)

      expect(payload.iss).toBe(apiKey)
      expect(payload.iat).toBeTruthy()
      expect(payload.exp).toBeTruthy()
      expect(typeof payload.iat).toBe('number')
      expect(typeof payload.exp).toBe('number')
    })

    it('should set expiration to 5 minutes from issued time', async () => {
      const apiKey = 'test_api_key'
      const apiSecret = 'test_api_secret'

      const jwt = await generateZoomApiJwt(apiKey, apiSecret)

      const secret = new TextEncoder().encode(apiSecret)
      const { payload } = await jwtVerify(jwt, secret)

      const expectedExpiration = 300 // 5 minutes in seconds
      const actualDifference = (payload.exp as number) - (payload.iat as number)

      expect(actualDifference).toBe(expectedExpiration)
    })
  })

  describe('generateZoomVideoJwt', () => {
    it('should generate a valid JWT with correct structure', async () => {
      const input = {
        zoomVideoSdkKey: 'test_sdk_key',
        zoomVideoSdkSecret: 'test_sdk_secret',
        sessionName: 'test-session',
        role: 1 as const,
        expirationSeconds: 3600,
        userIdentity: 'test-user',
        sessionKey: 'test-key',
        geoRegions: 'US',
        cloudRecordingOption: 0 as const,
        cloudRecordingElection: 0 as const,
        telemetryTrackingId: 'test-telemetry',
        videoWebRtcMode: 1 as const,
        audioWebRtcMode: 1 as const,
      }

      const jwt = await generateZoomVideoJwt(input)

      expect(jwt).toBeTruthy()
      expect(typeof jwt).toBe('string')
      expect(jwt.split('.')).toHaveLength(3)
    })

    it('should include all required payload fields', async () => {
      const input = {
        zoomVideoSdkKey: 'test_sdk_key',
        zoomVideoSdkSecret: 'test_sdk_secret',
        sessionName: 'test-session',
        role: 1 as const,
        expirationSeconds: 3600,
        userIdentity: 'test-user',
        sessionKey: 'test-key',
        geoRegions: 'US',
        cloudRecordingOption: 0 as const,
        cloudRecordingElection: 0 as const,
        telemetryTrackingId: 'test-telemetry',
        videoWebRtcMode: 1 as const,
        audioWebRtcMode: 1 as const,
      }

      const jwt = await generateZoomVideoJwt(input)

      const secret = new TextEncoder().encode(input.zoomVideoSdkSecret)
      const { payload } = await jwtVerify(jwt, secret)

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

    it('should use custom expiration when provided', async () => {
      const input = {
        zoomVideoSdkKey: 'test_sdk_key',
        zoomVideoSdkSecret: 'test_sdk_secret',
        sessionName: 'test-session',
        role: 0 as const,
        expirationSeconds: 1800,
      }

      const jwt = await generateZoomVideoJwt(input)

      const secret = new TextEncoder().encode(input.zoomVideoSdkSecret)
      const { payload } = await jwtVerify(jwt, secret)

      const actualDifference = (payload.exp as number) - (payload.iat as number)
      expect(actualDifference).toBe(1800)
    })

    it('should default to 2 hours expiration when not provided', async () => {
      const input = {
        zoomVideoSdkKey: 'test_sdk_key',
        zoomVideoSdkSecret: 'test_sdk_secret',
        sessionName: 'test-session',
        role: 0 as const,
      }

      const jwt = await generateZoomVideoJwt(input)

      const secret = new TextEncoder().encode(input.zoomVideoSdkSecret)
      const { payload } = await jwtVerify(jwt, secret)

      const expectedExpiration = 60 * 60 * 2 // 2 hours in seconds
      const actualDifference = (payload.exp as number) - (payload.iat as number)
      expect(actualDifference).toBe(expectedExpiration)
    })
  })
})
