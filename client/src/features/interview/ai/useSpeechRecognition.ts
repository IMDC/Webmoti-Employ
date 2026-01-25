import type { StartRecordingOptions } from '@speechmatics/browser-audio-input-react'
import type { RealtimeServerMessage } from '@speechmatics/real-time-client-react'
import { usePCMAudioListener, usePCMAudioRecorderContext } from '@speechmatics/browser-audio-input-react'
import { useRealtimeEventListener, useRealtimeTranscription } from '@speechmatics/real-time-client-react'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { logger } from '@/utils/logger'
import { errorNotification } from '@/utils/utils'
import { getSpeechmaticsJWT, SPEECHMATICS_CONFIG } from './speechmatics-utils'

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
      return state
    case 'EndOfTranscript':
      return state
    default:
      return state
  }
  const transcript = buildTextFromWords(newWords)
  const finalWords = newWords.filter(w => !w.partial)
  const finalTranscript = buildTextFromWords(finalWords)
  // Skip if finalTranscript is just punctuation (e.g., '.')
  if (finalTranscript && /^[\p{P}\p{S}\s]*$/u.test(finalTranscript)) {
    return { ...state, words: newWords, transcript } // Update transcript but not final
  }
  return { words: newWords, transcript, finalTranscript }
}
export function useSpeechRecognition() {
  const { startRecording, stopRecording, audioContext } = usePCMAudioRecorderContext()
  const { startTranscription, stopTranscription, sendAudio, socketState } = useRealtimeTranscription()
  const [state, dispatch] = useReducer(transcriptReducer, initialState)
  const [listening, setListening] = useState(false)
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState(true)
  const [hasNotifiedUser, setHasNotifiedUser] = useState(false)
  const [transcriptionStarted, setTranscriptionStarted] = useState(false)
  const [recognitionReady, setRecognitionReady] = useState(false)
  const isTranscribingRef = useRef(false)
  const isRecordingRef = useRef(false)
  useRealtimeEventListener('receiveMessage', (e) => {
    dispatch(e.data)
    if (e.data.message === 'RecognitionStarted') {
      setRecognitionReady(true)
    }
  })
  const onAudio = useCallback((audio: Float32Array) => {
    try {
      sendAudio(audio)
    }
    catch (err: any) {
      if (err.message?.includes('Socket not ready to receive audio')) {
        // Silently drop the chunk since we're just starting up
      }
      else {
        throw err
      }
    }
  }, [sendAudio])
  usePCMAudioListener(onAudio)
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
      await startTranscription(jwt, SPEECHMATICS_CONFIG)
      isTranscribingRef.current = true
      setTranscriptionStarted(true)
    }
    catch (err: any) {
      if (err.message?.includes('Still in CONNECTING state')) {
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
    if (transcriptionStarted && recognitionReady && socketState === 'open' && !listening) {
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
  }, [transcriptionStarted, recognitionReady, socketState, listening, startRecording, audioContext, hasNotifiedUser])
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
    setRecognitionReady(false)
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
