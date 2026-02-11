import type { StartRecordingOptions } from '@speechmatics/browser-audio-input-react'
import type { RealtimeServerMessage } from '@speechmatics/real-time-client-react'
import { usePCMAudioListener, usePCMAudioRecorderContext } from '@speechmatics/browser-audio-input-react'
import { useRealtimeEventListener, useRealtimeTranscription } from '@speechmatics/real-time-client-react'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { logger } from '@/utils/logger'
import { notifyError } from '@/utils/utils'

interface Word {
  text: string
  startTime: number
  endTime: number
  punctuation: boolean
}

interface State {
  words: readonly Word[]
  finalWords: readonly Word[] // Cumulative finalized utterances
  pendingUtteranceWords: readonly Word[] // Finals for current utterance
  transcript: string
  finalTranscript: string
}

type Action = RealtimeServerMessage | { type: 'reset' }

const initialState: State = {
  words: [],
  finalWords: [],
  pendingUtteranceWords: [],
  transcript: '',
  finalTranscript: '',
}

function transcriptReducer(state: State, action: Action): State {
  if ('type' in action && action.type === 'reset') {
    return initialState
  }
  let newWords: readonly Word[] = state.words
  let newFinalWords: readonly Word[] = state.finalWords
  let newPendingUtteranceWords: readonly Word[] = state.pendingUtteranceWords
  let newFinalTranscript = state.finalTranscript
  switch (action.message) {
    case 'AddTranscript':
      newPendingUtteranceWords = [
        ...state.pendingUtteranceWords,
        ...action.results.map(result => ({
          text: result.alternatives?.[0].content ?? '',
          startTime: result.start_time ?? 0,
          endTime: result.end_time ?? 0,
          punctuation: result.type === 'punctuation',
        })),
      ]
      newWords = [
        ...state.finalWords,
        ...newPendingUtteranceWords,
      ]
      break
    case 'EndOfUtterance':
      // Append pending to finals and update finalTranscript
      newFinalWords = [...state.finalWords, ...state.pendingUtteranceWords]
      newFinalTranscript = buildTextFromWords(newFinalWords)
      newPendingUtteranceWords = []
      newWords = [...newFinalWords]
      break
    case 'Warning':
      logger.warn(`[SpeechRecognition] Warning: ${action.type} - ${action.reason}`)
      return state
    case 'Error':
      logger.error(`[SpeechRecognition] Error: ${action.type} - ${action.reason}`)
      notifyError('Speechmatics error', action.reason || 'Unknown error while transcribing')
      return state
    case 'EndOfTranscript':
      // Finalize any remaining pending at session end
      newFinalWords = [...state.finalWords, ...state.pendingUtteranceWords]
      newFinalTranscript = buildTextFromWords(newFinalWords)
      newPendingUtteranceWords = []
      newWords = [...newFinalWords]
      break
    default:
      return state
  }
  const transcript = buildTextFromWords(newWords)
  // Skip if finalTranscript is just punctuation (e.g., '.')
  if (newFinalTranscript && /^[\p{P}\p{S}\s]*$/u.test(newFinalTranscript)) {
    return { ...state, words: newWords, finalWords: newFinalWords, pendingUtteranceWords: newPendingUtteranceWords, transcript } // Update transcript but not final
  }
  return { words: newWords, finalWords: newFinalWords, pendingUtteranceWords: newPendingUtteranceWords, transcript, finalTranscript: newFinalTranscript }
}

export function useSpeechRecognition() {
  const { startRecording, stopRecording, audioContext } = usePCMAudioRecorderContext()
  const { sendAudio } = useRealtimeTranscription()
  const [state, dispatch] = useReducer(transcriptReducer, initialState)
  const [listening, setListening] = useState(false)
  const [hasNotifiedUser, setHasNotifiedUser] = useState(false)
  const isRecordingRef = useRef(false)

  useRealtimeEventListener('receiveMessage', (e) => {
    dispatch(e.data)
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
        if (!hasNotifiedUser) {
          notifyError('Error starting transcription', 'Audio context is closed')
          setHasNotifiedUser(true)
        }
        return
      }
      if (audioContext.state !== 'running') {
        await audioContext.resume()
      }
      const options: StartRecordingOptions = { audioContext }
      await startRecording(options)
      isRecordingRef.current = true
      setListening(true)
    }
    catch (err: any) {
      if (!hasNotifiedUser) {
        notifyError('Unknown recording error', err?.message || 'Unknown error when starting recording')
        setHasNotifiedUser(true)
      }
    }
  }, [audioContext, startRecording, hasNotifiedUser])

  const abortListening = useCallback(() => {
    // here we only stop recording audio, but keep transcription active.
    // this is because it would add seconds of delay to have to reconnect to the socket each time.
    if (isRecordingRef.current) {
      stopRecording()
      isRecordingRef.current = false
    }
    setListening(false)
  }, [stopRecording])

  const resetTranscript = useCallback(() => {
    dispatch({ type: 'reset' })
  }, [])

  // on unmount, stop recording. transcription will be stopped when leaving the /interview route.
  useEffect(() => {
    return () => {
      abortListening()
    }
  }, [abortListening])

  return {
    transcript: state.transcript,
    finalTranscript: state.finalTranscript,
    listening,
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
