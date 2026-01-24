import type { StartRecordingOptions } from '@speechmatics/browser-audio-input-react'
import type { RealtimeServerMessage, RealtimeTranscriptionConfig } from '@speechmatics/real-time-client-react'
import { usePCMAudioListener, usePCMAudioRecorderContext } from '@speechmatics/browser-audio-input-react'
import { useRealtimeEventListener, useRealtimeTranscription } from '@speechmatics/real-time-client-react'
import { SpeechmaticsResponse } from '@webmoti-employ/shared'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { z } from 'zod'
import { HttpError } from '@/utils/HttpError'
import { logger } from '@/utils/logger'
import { errorNotification, getLocalBearerToken, handleAppErrorWithNotification } from '@/utils/utils'

interface Word {
  text: string
  startTime: number
  endTime: number
  punctuation: boolean
  partial?: boolean
}
interface State {
  words: readonly Word[]
  transcript: string
  finalTranscript: string
}
type Action = RealtimeServerMessage | { type: 'reset' }
const initialState: State = {
  words: [],
  transcript: '',
  finalTranscript: '',
}
function transcriptReducer(state: State, action: Action): State {
  if ('type' in action && action.type === 'reset') {
    return initialState
  }
  let newWords: readonly Word[] = state.words
  switch (action.message) {
    case 'AddTranscript':
      newWords = [
        ...state.words.filter(w => !w.partial),
        ...action.results.map(result => ({
          text: result.alternatives?.[0].content ?? '',
          startTime: result.start_time ?? 0,
          endTime: result.end_time ?? 0,
          punctuation: result.type === 'punctuation',
        })),
      ]
      break
    case 'AddPartialTranscript':
      newWords = [
        ...state.words.filter(w => !w.partial),
        ...action.results.map(result => ({
          text: result.alternatives?.[0].content ?? '',
          startTime: result.start_time ?? 0,
          endTime: result.end_time ?? 0,
          punctuation: result.type === 'punctuation',
          partial: true,
        })),
      ]
      break
    case 'Warning':
      logger.warn(`[SpeechRecognition] Warning: ${action.type} - ${action.reason}`)
      return state
    case 'Error':
      logger.error(`[SpeechRecognition] Error: ${action.type} - ${action.reason}`)
      errorNotification('Speechmatics error', action.reason || 'Unknown error')
      // Optionally stop transcription here if needed
      return state
    case 'EndOfTranscript':
      logger.info('[SpeechRecognition] End of transcript')
      return state
    // Add other cases if needed, e.g., 'RecognitionStarted', 'Info', etc.
    default:
      return state
  }
  const transcript = buildTextFromWords(newWords)
  const finalWords = newWords.filter(w => !w.partial)
  const finalTranscript = buildTextFromWords(finalWords)
  // Skip if finalTranscript is just punctuation (e.g., '.')
  if (finalTranscript && /^[\p{P}\p{S}\s]*$/u.test(finalTranscript)) {
    logger.info('[SpeechRecognition] Skipping punctuation-only final transcript:', finalTranscript)
    return { ...state, words: newWords, transcript } // Update transcript but not final
  }
  logger.info('[SpeechRecognition] Transcript update:', { transcript, finalTranscript })
  return { words: newWords, transcript, finalTranscript }
}
async function getSpeechmaticsJWT(): Promise<string | null> {
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
    handleAppErrorWithNotification(new HttpError('Failed to get Speechmatics JWT', response.status, json))
    return null
  }
  const result = SpeechmaticsResponse.safeParse(json)
  if (!result.success) {
    handleAppErrorWithNotification(new HttpError('Invalid response schema', 500, z.flattenError(result.error)))
    return null
  }
  return result.data.key
}
export function useSpeechRecognition() {
  const { startRecording, stopRecording, audioContext } = usePCMAudioRecorderContext()
  const { startTranscription, stopTranscription, sendAudio, socketState } = useRealtimeTranscription()
  const [state, dispatch] = useReducer(transcriptReducer, initialState)
  const [listening, setListening] = useState(false)
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState(true)
  const [hasNotifiedUser, setHasNotifiedUser] = useState(false)
  const [transcriptionStarted, setTranscriptionStarted] = useState(false)
  const isTranscribingRef = useRef(false)
  const isRecordingRef = useRef(false)

  useRealtimeEventListener('receiveMessage', e => dispatch(e.data))
  usePCMAudioListener(sendAudio)

  const startListening = useCallback(async () => {
    try {
      if (!audioContext) {
        throw new Error('AudioContext not available yet')
      }
      if (audioContext.state === 'closed') {
        logger.error('[SpeechRecognition] AudioContext is closed, cannot resume')
        setIsMicrophoneAvailable(false)
        if (!hasNotifiedUser) {
          errorNotification('Transcription error', 'Audio context is closed')
          setHasNotifiedUser(true)
        }
        return
      }
      if (audioContext.state !== 'running') {
        await audioContext.resume()
      }
      const jwt = await getSpeechmaticsJWT()
      if (!jwt) {
        return
      }
      await startTranscription(jwt, {
        audio_format: {
          type: 'raw',
          encoding: 'pcm_f32le',
          sample_rate: audioContext.sampleRate,
        },
        transcription_config: {
          language: 'en',
          operating_point: 'enhanced',
          max_delay: 1,
          transcript_filtering_config: { remove_disfluencies: false },
          enable_partials: true,
        },
      } as RealtimeTranscriptionConfig)
      isTranscribingRef.current = true
      setTranscriptionStarted(true)
    }
    catch (err: any) {
      if (err.message?.includes('Still in CONNECTING state')) {
        logger.warn('[SpeechRecognition] Ignored transient WebSocket connecting error:', err.message)
        // Proceed assuming connection will establish; do not notify or disable
        isTranscribingRef.current = true
        setTranscriptionStarted(true)
      }
      else {
        logger.error('[SpeechRecognition] Error starting:', err.message)
        setIsMicrophoneAvailable(false)
        if (!hasNotifiedUser) {
          errorNotification('Transcription error', err?.message || 'Unknown error')
          setHasNotifiedUser(true)
        }
      }
    }
  }, [audioContext, startTranscription, hasNotifiedUser])

  useEffect(() => {
    if (transcriptionStarted && socketState === 'open' && !listening) {
      const startRec = async () => {
        try {
          if (!audioContext || audioContext.state === 'closed') {
            logger.error('[SpeechRecognition] AudioContext is closed, cannot start recording')
            return
          }
          const options: StartRecordingOptions = { audioContext }
          await startRecording(options)
          isRecordingRef.current = true
          setListening(true)
        }
        catch (err: any) {
          logger.error('[SpeechRecognition] Error recording:', err.message)
          setIsMicrophoneAvailable(false)
          if (!hasNotifiedUser) {
            errorNotification('Transcription error', err?.message || 'Unknown error')
            setHasNotifiedUser(true)
          }
        }
      }
      startRec()
    }
  }, [transcriptionStarted, socketState, listening, startRecording, audioContext, hasNotifiedUser])

  const abortListening = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording()
      isRecordingRef.current = false
    }
    if (isTranscribingRef.current) {
      stopTranscription()
      isTranscribingRef.current = false
    }
    setListening(false)
    setTranscriptionStarted(false)
  }, [stopRecording, stopTranscription])

  const resetTranscript = useCallback(() => {
    dispatch({ type: 'reset' })
  }, [])

  useEffect(() => {
    return () => {
      abortListening()
    }
  }, [abortListening])

  return {
    transcript: state.transcript,
    finalTranscript: state.finalTranscript,
    listening,
    isMicrophoneAvailable,
    startListening,
    abortListening,
    resetTranscript,
  }
}
function buildTextFromWords(words: readonly Word[]): string {
  return words
    .map(({ text, punctuation }) => (!punctuation ? ` ${text}` : text))
    .join('')
    .trim()
}
