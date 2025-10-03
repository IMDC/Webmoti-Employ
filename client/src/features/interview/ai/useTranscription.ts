import { useCallback, useEffect, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { logger } from '@/utils/logger'
import { errorNotification } from '@/utils/utils'
import { useIsAudioOn } from '../zoom/useZoomSessionStore'
import { useAiWebsocket } from './useAiWebsocket'

export function useTranscription() {
  const isAudioEnabled = useIsAudioOn()
  const {
    resetTranscript,
    browserSupportsSpeechRecognition,
    // transcript,
    finalTranscript,
    listening,
    isMicrophoneAvailable,
  }
    = useSpeechRecognition()

  const [hasNotifiedUser, setHasNotifiedUser] = useState(false)

  const { sendTranscript } = useAiWebsocket()

  const startTranscribing = useCallback(async () => {
    if (!browserSupportsSpeechRecognition) {
      if (!hasNotifiedUser) {
        errorNotification(
          'Transcription is not supported',
          'Your browser does not support the Web Speech API',
        )
        setHasNotifiedUser(true)
      }
      return
    }

    if (!isMicrophoneAvailable) {
      logger.warn('Microphone is not available for transcription')
      return
    }

    try {
      await SpeechRecognition.startListening({
        continuous: true,
        language: 'en-US',
        interimResults: true,
      })
    }
    catch (error) {
      errorNotification('Transcription error', error)
    }
  }, [browserSupportsSpeechRecognition, hasNotifiedUser, isMicrophoneAvailable])

  const stopTranscribing = useCallback(async () => {
    if (listening) {
      try {
        await SpeechRecognition.abortListening()
      }
      catch (error) {
        // it's better to not notify user here and just log in console
        logger.error('Failed to stop transcription:', error)
      }
    }
  }, [listening])

  useEffect(() => {
    if (isAudioEnabled) {
      startTranscribing()
    }
    else {
      stopTranscribing()
    }

    return () => {
      void stopTranscribing()
    }
  }, [isAudioEnabled, startTranscribing, stopTranscribing])

  // useEffect(() => {
  //   if (transcript) {
  //     logger.log('in progress:', transcript)
  //   }
  // }, [transcript])

  useEffect(() => {
    if (finalTranscript) {
      logger.log('final transcript:', finalTranscript)
      sendTranscript(finalTranscript)
      resetTranscript()
    }
  }, [finalTranscript, resetTranscript, sendTranscript])
}
