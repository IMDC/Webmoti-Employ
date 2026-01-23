/**
 * Speechmatics Real-Time Transcription Hook
 *
 * IMPLEMENTATION:
 * - Uses @speechmatics/auth for JWT token generation
 * - Connects directly to Speechmatics WebSocket API
 * - Sends raw PCM audio data and receives JSON transcript messages
 *
 * FEATURES:
 * - Real-time audio transcription using Speechmatics API
 * - Automatic filler word detection (um, uh, hmm, etc.)
 * - Speaker role tagging (interviewer vs candidate)
 * - Final transcripts only (no partial/interim results)
 * - Enhanced accuracy with operating_point: 'enhanced'
 */

import type { TranscriptMessage } from '@webmoti-employ/shared'
import { SpeechmaticsResponse } from '@webmoti-employ/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import z from 'zod'
import { HttpError } from '@/utils/HttpError'
import { logger } from '@/utils/logger'
import { errorNotification, getLocalBearerToken, handleAppErrorWithNotification } from '@/utils/utils'
import { useIsAudioOn, useLocalUserId, useZoomParticipants } from '../zoom/useZoomSessionStore'

// Speechmatics message types
interface StartRecognitionMessage {
  message: 'StartRecognition'
  audio_format: {
    type: 'raw'
    encoding: 'pcm_s16le'
    sample_rate: number
  }
  transcription_config: {
    language: string
    operating_point: string
    max_delay: number
    transcript_filtering_config: {
      remove_disfluencies: boolean
    }
  }
}

interface AddTranscriptMessage {
  message: 'AddTranscript'
  results: Array<{
    type?: string
    alternatives?: Array<{
      content: string
      tags?: string[]
    }>
    is_eos?: boolean
  }>
}

interface EndOfTranscriptMessage {
  message: 'EndOfTranscript'
}

interface ErrorMessage {
  message: 'Error'
  type: string
  reason: string
}

type SpeechmaticsMessage
  = | AddTranscriptMessage
    | EndOfTranscriptMessage
    | ErrorMessage
    | { message: 'RecognitionStarted' }
    | { message: 'AudioAdded' }
    | { message: 'Info', type: string }

const SPEECHMATICS_URL = 'wss://eu2.rt.speechmatics.com/v2'
// Speechmatics expects raw PCM audio and works best/reliably with 16kHz mono.
// IMPORTANT: Most devices (and Electron) capture mic audio at 48kHz.
// If we send 48kHz while telling Speechmatics it's 48kHz, you *may* still get no transcripts
// depending on plan/region/model/settings. The safest approach is:
// - Tell Speechmatics we're sending 16kHz
// - Downsample our captured audio to 16kHz before sending
const SAMPLE_RATE = 16000
const RECONNECT_DELAY = 5000 // Increased to 5 seconds
const MAX_RECONNECT_ATTEMPTS = 1 // Reduced to 1 to avoid quota issues

export function useSpeechmaticsTranscription(
  maxWordsBuffer: number,
  sendTranscript: (transcript: TranscriptMessage) => void,
) {
  const isAudioEnabled = useIsAudioOn()
  const localUserId = useLocalUserId()
  const participants = useZoomParticipants()

  const [hasNotifiedUser, setHasNotifiedUser] = useState(false)

  // Refs to persist across renders
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isConnectingRef = useRef(false)
  const currentTranscriptRef = useRef('')
  const isStreamingRef = useRef(false)
  // Used to cancel an in-flight start when React StrictMode (dev) mounts/unmounts effects twice.
  const startTokenRef = useRef(0)

  // Determine if local user is the host (interviewer) or candidate
  const getSpeakerRole = useCallback((): 'interviewer' | 'candidate' => {
    if (!localUserId) {
      return 'candidate' // default
    }
    const localParticipant = participants.get(localUserId)
    return localParticipant?.isHost ? 'interviewer' : 'candidate'
  }, [localUserId, participants])

  const getSpeechmaticsJWT = useCallback(async () => {
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
      handleAppErrorWithNotification(
        new HttpError(
          'Failed to get Speechmatics JWT',
          response.status,
          json,
        ),
      )
    }

    const result = SpeechmaticsResponse.safeParse(json)
    if (!result.success) {
      handleAppErrorWithNotification(
        new HttpError('Invalid response schema', 500, z.flattenError(result.error)),
      )
    }

    return result.data?.key
  }, [])

  // Connect to Speechmatics WebSocket
  // Create the WebSocket connection and send the StartRecognition "handshake".
  // We keep this separate from audio capture so reconnect logic is straightforward.
  const connectWebSocket = useCallback(async () => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    isConnectingRef.current = true

    try {
      const jwt = await getSpeechmaticsJWT()
      const ws = new WebSocket(`${SPEECHMATICS_URL}?jwt=${jwt}`)

      ws.onopen = () => {
        logger.log('Speechmatics WebSocket connected')
        reconnectAttemptsRef.current = 0
        isConnectingRef.current = false

        // Always use 16kHz for Speechmatics.
        // NOTE: this must match the audio we *actually* send over the socket.
        // We downsample the microphone audio to 16kHz in `onaudioprocess`.
        const startMessage: StartRecognitionMessage = {
          message: 'StartRecognition',
          audio_format: {
            type: 'raw',
            encoding: 'pcm_s16le',
            sample_rate: SAMPLE_RATE,
          },
          transcription_config: {
            language: 'en',
            operating_point: 'enhanced',
            max_delay: 1.0,
            transcript_filtering_config: {
              remove_disfluencies: false,
            },
          },
        }
        ws.send(JSON.stringify(startMessage))
        logger.log(`Sent StartRecognition to Speechmatics with ${SAMPLE_RATE}Hz sample rate`)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SpeechmaticsMessage

          if (data.message === 'AddTranscript') {
            // We only process FINAL transcripts (AddTranscript).
            // Speechmatics can also send partials if enabled, but we intentionally do not use them.
            //
            // The payload comes as a list of "results" (words/punctuation), similar to their docs.
            let transcriptText = ''
            let fillerCount = 0
            let sawEndOfSentence = false

            for (const result of data.results) {
              if (result.type === 'word') {
                transcriptText += ' '

                // Filler words are tagged by Speechmatics with "disfluency"
                // (e.g. "um", "uh", "hmm" in English).
                const tags = result.alternatives?.[0]?.tags
                if (tags && tags.includes('disfluency')) {
                  fillerCount++
                  logger.log('Detected filler word:', result.alternatives?.[0]?.content)
                }
              }
              const content = result.alternatives?.[0]?.content
              if (content) {
                transcriptText += content
              }
              if (result.is_eos) {
                transcriptText += '\n'
                sawEndOfSentence = true
              }
            }

            // Remove leading/trailing whitespace but preserve internal spacing
            const text = transcriptText.trim().replace(/\n/g, ' ')

            if (text) {
              // Accumulate words for final transcripts
              const prev = currentTranscriptRef.current
              const updated = prev ? `${prev} ${text}` : text
              currentTranscriptRef.current = updated

              // Check if we have enough words to send
              const wordCount = getWords(updated).length
              // We flush either:
              // - when we have enough words for the AI buffer, OR
              // - when Speechmatics marks end-of-sentence (so short answers still get sent)
              if (wordCount >= maxWordsBuffer || sawEndOfSentence) {
                const speaker = getSpeakerRole()
                logger.log('Sending final transcript:', updated, 'Filler words detected:', fillerCount)
                sendTranscript({ text: updated, status: 'final', speaker })
                // Reset
                currentTranscriptRef.current = ''
              }
            }
          }
          else if (data.message === 'EndOfTranscript') {
            // Handle end of transcript - send any remaining accumulated text
            if (currentTranscriptRef.current && currentTranscriptRef.current.trim()) {
              const speaker = getSpeakerRole()
              logger.log('Sending remaining transcript on EndOfTranscript:', currentTranscriptRef.current)
              sendTranscript({ text: currentTranscriptRef.current, status: 'final', speaker })
              currentTranscriptRef.current = ''
            }
          }
          else if (data.message === 'Error') {
            logger.error('Speechmatics error:', data.type, data.reason)
            errorNotification('Transcription error', data.reason)
          }
          else if (data.message === 'RecognitionStarted') {
            logger.log('Speechmatics recognition started')
          }
        }
        catch (error) {
          logger.error('Error parsing Speechmatics message:', error)
        }
      }

      ws.onerror = (error) => {
        logger.error('Speechmatics WebSocket error:', error)
        isConnectingRef.current = false
      }

      ws.onclose = (event) => {
        logger.log('Speechmatics WebSocket closed:', event.code, event.reason)
        isConnectingRef.current = false
        wsRef.current = null

        // Check for quota errors (code 1008 = policy violation, often quota)
        if (event.code === 1008) {
          logger.error('Speechmatics quota exceeded. Please wait before reconnecting or upgrade your plan.')
          errorNotification(
            'Transcription quota exceeded',
            'Your Speechmatics account has reached its concurrent session limit. Please wait a moment and try again, or upgrade your plan.',
          )
          return // Don't attempt reconnection
        }

        // Only attempt reconnection for network issues (not quota/auth errors)
        // Code 1000 = normal closure, 1008 = policy violation (quota), 1006 = abnormal closure
        if (isAudioEnabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && event.code === 1006) {
          reconnectAttemptsRef.current += 1
          logger.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`)
          setTimeout(() => {
            void connectWebSocket()
          }, RECONNECT_DELAY)
        }
        else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          logger.warn('Max reconnection attempts reached. Please toggle your microphone to try again.')
        }
      }

      wsRef.current = ws
    }
    catch (error) {
      isConnectingRef.current = false
      logger.error('Failed to connect to Speechmatics:', error)
      if (!hasNotifiedUser) {
        errorNotification('Transcription setup failed', String(error))
        setHasNotifiedUser(true)
      }
    }
  }, [getSpeechmaticsJWT, isAudioEnabled, hasNotifiedUser, getSpeakerRole, sendTranscript, maxWordsBuffer])

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      // Send EndOfStream message before closing
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ message: 'EndOfStream' }))
        }
        catch (error) {
          logger.warn('Failed to send EndOfStream:', error)
        }
      }
      wsRef.current.close(1000, 'Normal closure') // Clean close
      wsRef.current = null
    }
    isConnectingRef.current = false
    reconnectAttemptsRef.current = 0
  }, [])

  // Start capturing audio and streaming to Speechmatics
  const startTranscribing = useCallback(async () => {
    try {
      // Guard against duplicate starts (common in React StrictMode and during rapid toggles).
      if (isStreamingRef.current)
        return
      isStreamingRef.current = true
      const myToken = ++startTokenRef.current

      // Get microphone access - using minimal constraints to avoid conflicts with Zoom's video stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true, // Simplified to avoid forcing a new stream
      })
      // If we were stopped while awaiting permissions, abort.
      if (startTokenRef.current !== myToken) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      streamRef.current = stream

      // Create an AudioContext for microphone capture + processing.
      // We do NOT force a sample rate here because Electron/Chromium may ignore it anyway.
      // Instead, we downsample whatever rate we get to 16kHz.
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      // In some environments (including Electron), AudioContext may start "suspended"
      // until resumed by a user gesture. If it stays suspended, `onaudioprocess` may never fire,
      // which means we would send zero audio to Speechmatics (and get zero transcripts).
      await audioContext.resume()
      // If we were stopped while resuming, abort cleanly.
      if (startTokenRef.current !== myToken)
        return

      const inputSampleRate = audioContext.sampleRate
      logger.log(`Audio context created with sample rate: ${inputSampleRate}Hz (sending ${SAMPLE_RATE}Hz to Speechmatics)`)

      // Connect WebSocket first (we always tell Speechmatics we're sending 16kHz).
      await connectWebSocket()
      if (startTokenRef.current !== myToken)
        return

      // Set up audio processing
      const source = audioContext.createMediaStreamSource(stream)

      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          // Grab the latest mono PCM frame from the microphone.
          const inputData = e.inputBuffer.getChannelData(0)
          // Downsample to 16kHz so our binary audio matches StartRecognition.sample_rate.
          const resampled = inputSampleRate === SAMPLE_RATE
            ? inputData
            : downsampleFloat32ToSampleRate(inputData, inputSampleRate, SAMPLE_RATE)

          // Convert Float32Array to Int16Array (PCM 16-bit)
          const pcmData = new Int16Array(resampled.length)
          for (let i = 0; i < resampled.length; i++) {
            const s = Math.max(-1, Math.min(1, resampled[i]))
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
          }

          // Send binary audio data to Speechmatics
          wsRef.current.send(pcmData.buffer)
        }
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      logger.log('Started audio capture and streaming to Speechmatics')
    }
    catch (error) {
      logger.error('Failed to start audio capture:', error)
      isStreamingRef.current = false
      if (!hasNotifiedUser) {
        errorNotification('Microphone access failed', 'Please allow microphone access for transcription')
        setHasNotifiedUser(true)
      }
    }
  }, [connectWebSocket, hasNotifiedUser])

  // Stop capturing audio
  const stopTranscribing = useCallback(() => {
    // Cancel any in-flight `startTranscribing` work.
    startTokenRef.current += 1
    isStreamingRef.current = false

    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    logger.log('Stopped audio capture')
  }, [])

  // Effect to handle audio on/off and WebSocket connection
  useEffect(() => {
    if (isAudioEnabled) {
      void startTranscribing()
    }
    else {
      stopTranscribing()
      disconnectWebSocket()
    }

    return () => {
      stopTranscribing()
      disconnectWebSocket()
    }
  }, [isAudioEnabled, startTranscribing, stopTranscribing, disconnectWebSocket])
}

function getWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

function downsampleFloat32ToSampleRate(
  input: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number,
): Float32Array {
  // Very small, dependency-free resampler.
  // We only downsample (e.g. 48000 -> 16000). If output >= input, we return the input unchanged.
  // Linear interpolation is good enough for speech transcription and keeps CPU low.
  if (outputSampleRate >= inputSampleRate) {
    // No upsampling here; just return input.
    return input
  }

  const ratio = inputSampleRate / outputSampleRate
  const outputLength = Math.round(input.length / ratio)
  const output = new Float32Array(outputLength)

  let pos = 0
  for (let i = 0; i < outputLength; i++) {
    const idx = Math.floor(pos)
    const nextIdx = Math.min(idx + 1, input.length - 1)
    const frac = pos - idx
    output[i] = input[idx] * (1 - frac) + input[nextIdx] * frac
    pos += ratio
  }

  return output
}
