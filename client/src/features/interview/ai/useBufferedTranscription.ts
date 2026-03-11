import type { TranscriptMessage } from '@webmoti-employ/shared'
import { useCallback, useEffect } from 'react'
import { logger } from '@/utils/logger'
import { notifyError } from '@/utils/utils'
import { useIsAudioOn } from '../zoom/useZoomSessionStore'
import { useSpeechRecognition } from './useSpeechRecognition'

// const maxWordsBuffer = 5

export function useBufferedTranscription(
  sendTranscript: (transcript: TranscriptMessage) => void,
) {
  const isAudioEnabled = useIsAudioOn()
  const {
    resetTranscript,
    // transcript,
    finalTranscript,
    listening,
    startListening,
    abortListening,
  } = useSpeechRecognition()
  // track the amount of words sent (useful for incremental sending)
  // const [sentWordCount, setSentWordCount] = useState(0)

  const startTranscribing = useCallback(async () => {
    try {
      await startListening()
    }
    catch (error) {
      notifyError('Error starting transcription', error)
    }
  }, [startListening])

  const stopTranscribing = useCallback(async () => {
    if (listening) {
      try {
        abortListening()
      }
      catch (error) {
        // it's better to not notify user here and just log in console
        logger.error('Failed to stop transcription:', error)
      }
    }
  }, [listening, abortListening])

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

  useEffect(() => {
    if (!finalTranscript) {
      return
    }
    logger.info('final transcript:', finalTranscript)
    sendTranscript({ text: finalTranscript, status: 'final' })
    resetTranscript()
  }, [finalTranscript, resetTranscript, sendTranscript])

  // Partial buffering: send every maxWordsBuffer words incrementally
  // useEffect(() => {
  //   // handle incremental sending from transcript (finalized words)
  //   // Skip if finalTranscript is present — the final effect handles that case
  //   if (finalTranscript)
  //     return
  //   const words = getWords(transcript)
  //   const unsentWordCount = words.length - sentWordCount
  //   if (unsentWordCount >= maxWordsBuffer) {
  //     // send exactly maxWordsBuffer words at a time
  //     const nextIndex = sentWordCount + maxWordsBuffer
  //     const wordsToSend = words.slice(sentWordCount, nextIndex).join(' ')
  //     if (wordsToSend) {
  //       logger.info('partial transcript:', wordsToSend)
  //       sendTranscript({ text: wordsToSend, status: 'partial' })
  //       setSentWordCount(nextIndex)
  //       // don't reset transcript here to avoid interrupting ongoing accumulation
  //     }
  //   }
  // }, [transcript, sentWordCount, sendTranscript, finalTranscript])
}

// function getWords(text: string): string[] {
//   return text.trim().split(/\s+/).filter(Boolean)
// }
