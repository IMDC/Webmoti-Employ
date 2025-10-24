import type { TranscriptMessage } from '@webmoti-employ/shared'
import { useCallback, useEffect, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { logger } from '@/utils/logger'
import { errorNotification } from '@/utils/utils'
import { useIsAudioOn } from '../zoom/useZoomSessionStore'

export function useTranscription(
  maxWordsBuffer: 5,
  sendTranscript: (transcript: TranscriptMessage) => void,
) {
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
    // handle final transcript when the user stops speaking for 2 seconds
    if (!finalTranscript) {
      return
    }

    const words = getWords(finalTranscript)
    const unsentWords = words.slice(sentWordCount)
    const textToSend = unsentWords.join(' ')

    if (textToSend) {
      logger.log('final transcript:', textToSend)
      sendTranscript({ text: textToSend, status: 'final' })
    }

    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setSentWordCount(0)
    resetTranscript()
  }, [finalTranscript, sentWordCount, resetTranscript, sendTranscript])

  useEffect(() => {
    // handle partial transcript sending
    // this sends the transcript when the transcript has maxWordsBuffer + 1 words
    // this is due to how google speech to text works with isFinal.
    // since if you're in the process of saying the last word, it will update transcript, but it might not be final
    const words = getWords(transcript)
    const unsentWordCount = words.length - sentWordCount

    if (unsentWordCount >= maxWordsBuffer + 1) {
      // send exactly maxWordsBuffer words at a time
      const nextIndex = sentWordCount + maxWordsBuffer
      const wordsToSend = words.slice(sentWordCount, nextIndex).join(' ')

      if (wordsToSend) {
        logger.log('partial transcript:', wordsToSend)
        sendTranscript({ text: wordsToSend, status: 'partial' })
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setSentWordCount(nextIndex)
        // don't call reset transcript here since it will interrupt and lose the current word
      }
    }
  }, [transcript, sentWordCount, sendTranscript, maxWordsBuffer])
}

function getWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}
