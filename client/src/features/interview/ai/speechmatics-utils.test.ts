import { API_BASE, server } from '@test-utils'
import { http, HttpResponse } from 'msw'
import { getSpeechmaticsJWT, RECORDING_SAMPLE_RATE, SPEECHMATICS_CONFIG } from './speechmatics-utils'

beforeEach(() => {
  // Set a bearer token so the fetch can use it
  localStorage.setItem('bearer_token', 'test-token')
  localStorage.setItem('bearer_token_expiry', new Date(Date.now() + 86400000).toISOString())
})

afterEach(() => {
  localStorage.clear()
})

describe('speechmatics-utils', () => {
  describe('config values', () => {
    it('uses 16000 Hz sample rate', () => {
      expect(RECORDING_SAMPLE_RATE).toBe(16_000)
    })

    it('config has correct audio format', () => {
      expect(SPEECHMATICS_CONFIG.audio_format).toEqual({
        type: 'raw',
        encoding: 'pcm_f32le',
        sample_rate: 16_000,
      })
    })

    it('config keeps filler words (remove_disfluencies false)', () => {
      expect(
        SPEECHMATICS_CONFIG.transcription_config.transcript_filtering_config?.remove_disfluencies,
      ).toBe(false)
    })
  })

  describe('getSpeechmaticsJWT', () => {
    it('returns JWT key on success', async () => {
      server.use(
        http.post(`${API_BASE}/speechmatics/token`, () => {
          return HttpResponse.json({ key: 'test-jwt-token' })
        }),
      )

      const jwt = await getSpeechmaticsJWT()
      expect(jwt).toBe('test-jwt-token')
    })

    it('returns null on server error', async () => {
      server.use(
        http.post(`${API_BASE}/speechmatics/token`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }),
      )

      const jwt = await getSpeechmaticsJWT()
      expect(jwt).toBeNull()
    })

    it('returns null on invalid response schema', async () => {
      server.use(
        http.post(`${API_BASE}/speechmatics/token`, () => {
          // Missing 'key' field
          return HttpResponse.json({ invalid: 'data' })
        }),
      )

      const jwt = await getSpeechmaticsJWT()
      expect(jwt).toBeNull()
    })
  })
})
