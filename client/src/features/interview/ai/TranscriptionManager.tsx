import type { ReactNode } from 'react'
import { useRealtimeTranscription } from '@speechmatics/real-time-client-react'
import { useEffect, useRef } from 'react'
import { logger } from '@/utils/logger'
import { getSpeechmaticsJWT, SPEECHMATICS_CONFIG } from './speechmatics-utils'

export function TranscriptionManager({ children }: { children: ReactNode }) {
  const { stopTranscription, socketState, startTranscription } = useRealtimeTranscription()
  const socketStateRef = useRef(socketState)
  const startedTranscriptionRef = useRef(false)

  useEffect(() => {
    socketStateRef.current = socketState
  }, [socketState])

  useEffect(() => {
    if (startedTranscriptionRef.current)
      return
    startedTranscriptionRef.current = true

    const connect = async () => {
      const jwt = await getSpeechmaticsJWT()
      if (!jwt) {
        startedTranscriptionRef.current = false
        return
      }
      try {
        logger.log('Connecting to speechmatics')
        await startTranscription(jwt, SPEECHMATICS_CONFIG)
      }
      catch (err) {
        // ignore errors if socket is still connecting
        if (!(socketStateRef.current === 'connecting')) {
          logger.error(err)
        }
      }
    }

    connect()
  }, [startTranscription])

  useEffect(() => {
    return () => {
      if (socketStateRef.current === 'open' || socketStateRef.current === 'connecting') {
        logger.log('Disconnecting from speechmatics')
        stopTranscription()
      }
    }
  }, [stopTranscription])

  return <>{children}</>
}
