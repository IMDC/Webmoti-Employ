import type { RealtimeTranscriptionConfig } from '@speechmatics/real-time-client-react'
import { SpeechmaticsResponse } from '@webmoti-employ/shared'
import z from 'zod'
import { HttpError } from '@/utils/HttpError'
import { getLocalBearerToken, notifyError } from '@/utils/utils'

// Speechmatics recommends using a sample rate of 16_000 Hz for real-time transcription.
// Anything higher will be downsampled by the server. Lower sample rates are also supported.
export const RECORDING_SAMPLE_RATE = 16_000

export const SPEECHMATICS_CONFIG: RealtimeTranscriptionConfig = {
  audio_format: {
    type: 'raw',
    encoding: 'pcm_f32le',
    sample_rate: RECORDING_SAMPLE_RATE,
  },
  transcription_config: {
    language: 'en',
    operating_point: 'standard', // enhanced mode is more accurate but slower than standard
    max_delay: 0.7, // this is the lowest allowed value for delay
    max_delay_mode: 'fixed',
    transcript_filtering_config: {
      // keep filler words in the transcript
      remove_disfluencies: false,
    },
    // we don't need partials since we're buffering anyways (avoid spamming the ai with words)
    enable_partials: false,
    conversation_config: {
      // the amount of silence before we send all words in the buffer
      end_of_utterance_silence_trigger: 0.5,
    },
  },
}

export async function getSpeechmaticsJWT(): Promise<string | null> {
  const endpoint = `${import.meta.env.VITE_API_BASE_URL}/speechmatics/token`
  const authToken = getLocalBearerToken()
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  })
  const json = await response.json()
  if (!response.ok) {
    notifyError(
      'Transcription Error',
      new HttpError('Failed to get Speechmatics JWT', response.status, json),
    )
    return null
  }
  const result = SpeechmaticsResponse.safeParse(json)
  if (!result.success) {
    notifyError(
      'Transcription Error',
      new HttpError('Invalid response schema', 500, z.flattenError(result.error)),
    )
    return null
  }
  return result.data.key
}
