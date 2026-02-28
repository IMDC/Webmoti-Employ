import type { ReactNode } from 'react'
import { useRealtimeEventListener, useRealtimeTranscription } from '@speechmatics/real-time-client-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSpeechmaticsJWT, SPEECHMATICS_CONFIG } from './speechmatics-utils'
import { TranscriptionManagerContext } from './TranscriptionManagerContext'

export function TranscriptionManager({ children }: { children: ReactNode }) {
  const { startTranscription, stopTranscription, socketState, sendAudio } = useRealtimeTranscription()
  const socketStateRef = useRef(socketState)
  const isTranscribingRef = useRef(false)
  const startSessionPromiseRef = useRef<Promise<boolean> | null>(null)
  const [isRecognitionReady, setIsRecognitionReady] = useState(false)

  useEffect(() => {
    socketStateRef.current = socketState
  }, [socketState])

  useRealtimeEventListener('receiveMessage', (e) => {
    if (e.data.message === 'RecognitionStarted') {
      setIsRecognitionReady(true)
    }
  })

  const startTranscriptionSession = useCallback(async () => {
    if (isTranscribingRef.current) {
      return true
    }

    if (startSessionPromiseRef.current) {
      return startSessionPromiseRef.current
    }

    startSessionPromiseRef.current = (async () => {
      const jwt = await getSpeechmaticsJWT()
      if (!jwt) {
        return false
      }

      try {
        await startTranscription(jwt, SPEECHMATICS_CONFIG)
        isTranscribingRef.current = true
        return true
      }
      catch (err: any) {
        if (err.message?.includes('Still in CONNECTING state')) {
          isTranscribingRef.current = true
          return true
        }
        throw err
      }
      finally {
        startSessionPromiseRef.current = null
      }
    })()

    return startSessionPromiseRef.current
  }, [startTranscription])

  const stopTranscriptionSession = useCallback(() => {
    if (isTranscribingRef.current) {
      if (socketStateRef.current === 'open') {
        stopTranscription()
      }
      isTranscribingRef.current = false
      setIsRecognitionReady(false)
    }
  }, [stopTranscription])

  useEffect(() => {
    return () => {
      stopTranscriptionSession()
    }
  }, [stopTranscriptionSession])

  const contextValue = useMemo(() => ({
    socketState,
    sendAudio,
    startTranscriptionSession,
    stopTranscriptionSession,
    isRecognitionReady,
  }), [socketState, sendAudio, startTranscriptionSession, stopTranscriptionSession, isRecognitionReady])

  return <TranscriptionManagerContext value={contextValue}>{children}</TranscriptionManagerContext>
}
