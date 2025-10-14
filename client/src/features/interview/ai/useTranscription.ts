import { useCallback, useEffect, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { logger } from '@/utils/logger'
import { errorNotification } from '@/utils/utils'
import { useIsAudioOn } from '../zoom/useZoomSessionStore'
import { useAiWebsocket } from './useAiWebsocket'

export function useTranscription(maxWordsBuffer: 5) {
  const isAudioEnabled = useIsAudioOn()
  const {
    resetTranscript,
    browserSupportsSpeechRecognition,
    transcript,
    finalTranscript,
    listening,
    isMicrophoneAvailable,
  }
    = useSpeechRecognition()

  const [hasNotifiedUser, setHasNotifiedUser] = useState(false)

  // track the amount of words sent (useful when partial sending)
  const [sentWordCount, setSentWordCount] = useState(0)

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
    // this sends the final transcript when the user pauses speech for 2 (?) seconds
    if (finalTranscript) {
      const words = getWords(finalTranscript)
      const newWords = words.slice(sentWordCount).join(' ') // only unsent part
      if (newWords) {
        logger.log('final transcript:', newWords)
        sendTranscript(newWords)
      }
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setSentWordCount(0)
      resetTranscript()
    }
  }, [finalTranscript, sentWordCount, resetTranscript, sendTranscript])

  useEffect(() => {
    // this sends the transcript when the transcript has 5 or more words in it
    const words = getWords(transcript)
    const wordCount = words.length

    if (wordCount - sentWordCount >= maxWordsBuffer) {
      const newWords = words.slice(sentWordCount).join(' ')
      if (newWords) {
        logger.log('partial transcript:', newWords)
        sendTranscript(newWords)
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setSentWordCount(wordCount)
        // don't call reset transcript here since it will interrupt and lose the current word
      }
    }
  }, [transcript, sentWordCount, sendTranscript, maxWordsBuffer])
}

function getWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}
