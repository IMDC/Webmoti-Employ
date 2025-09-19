import { notifications } from '@mantine/notifications'
import { useCallback, useEffect, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { logger } from '@/utils/logger'
import { useIsAudioOn } from '../zoom/useZoomSessionStore'

export function useTranscription() {
  const isAudioEnabled = useIsAudioOn()
  const {
    resetTranscript,
    browserSupportsSpeechRecognition,
    transcript,
    finalTranscript,
    listening,
  }
    = useSpeechRecognition()

  const [hasNotifiedUser, setHasNotifiedUser] = useState(false)

  const startTranscribing = useCallback(async () => {
    if (!browserSupportsSpeechRecognition) {
      if (!hasNotifiedUser) {
        notifications.show({
          title: 'Unsupported browser',
          message: 'Your browser does not support the Web Speech API',
        })
        setHasNotifiedUser(true)
      }
      return
    }

    await SpeechRecognition.startListening({
      continuous: true,
      language: 'en-US',
      interimResults: true,
    })
  }, [browserSupportsSpeechRecognition, hasNotifiedUser])

  const stopTranscribing = useCallback(async () => {
    if (listening) {
      await SpeechRecognition.abortListening()
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
      stopTranscribing()
    }
  }, [isAudioEnabled, startTranscribing, stopTranscribing])

  useEffect(() => {
    if (transcript) {
      logger.log('in progress:', transcript)
    }
  }, [transcript])

  useEffect(() => {
    if (finalTranscript) {
      logger.log('final transcript:', finalTranscript)
      resetTranscript()
    }
  }, [finalTranscript, resetTranscript])
}
