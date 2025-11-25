import type { TranscriptMessage } from '@webmoti-employ/shared'
import { createSpeechmaticsJWT } from '@speechmatics/auth'
import { useCallback, useEffect, useRef, useState } from 'react'
import { logger } from '@/utils/logger'
import { errorNotification } from '@/utils/utils'
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
    enable_partials: boolean
    max_delay: number
  }
}

interface AddPartialTranscriptMessage {
  message: 'AddPartialTranscript'
  results: Array<{
    alternatives: Array<{
      content: string
    }>
  }>
}

interface AddTranscriptMessage {
  message: 'AddTranscript'
  results: Array<{
    alternatives: Array<{
      content: string
    }>
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

type SpeechmaticsMessage = 
  | AddPartialTranscriptMessage 
  | AddTranscriptMessage 
  | EndOfTranscriptMessage 
  | ErrorMessage
  | { message: 'RecognitionStarted' }
  | { message: 'AudioAdded' }
  | { message: 'Info'; type: string }

const SPEECHMATICS_URL = 'wss://eu2.rt.speechmatics.com/v2'
const SAMPLE_RATE = 16000 // Speechmatics prefers 16kHz
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
  const [currentTranscript, setCurrentTranscript] = useState('')

  // Refs to persist across renders
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isConnectingRef = useRef(false)
  const currentTranscriptRef = useRef('')

  // Determine if local user is the host (interviewer) or candidate
  const getSpeakerRole = useCallback((): 'interviewer' | 'candidate' => {
    if (!localUserId) {
      return 'candidate' // default
    }
    const localParticipant = participants.get(localUserId)
    return localParticipant?.isHost ? 'interviewer' : 'candidate'
  }, [localUserId, participants])

  // Get Speechmatics API key and generate JWT token
  const generateJWT = useCallback(async () => {
    const apiKey = import.meta.env.VITE_SPEECHMATICS_API_KEY
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error(
        'Speechmatics API key not configured.\n\n' +
        'Please set your API key in client/.env.local:\n' +
        'VITE_SPEECHMATICS_API_KEY=your_api_key_here\n\n' +
        'Get your API key from: https://portal.speechmatics.com/manage-access/'
      )
    }

    try {
      // Generate a temporary JWT token (valid for 1 hour)
      const jwt = await createSpeechmaticsJWT({
        type: 'rt',
        apiKey,
        ttl: 3600, // 1 hour
      })
      return jwt
    }
    catch (error) {
      logger.error('Failed to generate Speechmatics JWT:', error)
      throw new Error('Failed to generate Speechmatics JWT token. Please check your API key.')
    }
  }, [])

  // Connect to Speechmatics WebSocket
  const connectWebSocket = useCallback(async (sampleRate: number) => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    isConnectingRef.current = true

    try {
      const jwt = await generateJWT()
      const ws = new WebSocket(`${SPEECHMATICS_URL}?jwt=${jwt}`)

      ws.onopen = () => {
        logger.log('Speechmatics WebSocket connected')
        reconnectAttemptsRef.current = 0
        isConnectingRef.current = false

        // Send StartRecognition message with actual sample rate
        const startMessage: StartRecognitionMessage = {
          message: 'StartRecognition',
          audio_format: {
            type: 'raw',
            encoding: 'pcm_s16le',
            sample_rate: sampleRate,
          },
          transcription_config: {
            language: 'en',
            enable_partials: true,
            max_delay: 2, // seconds
          },
        }
        ws.send(JSON.stringify(startMessage))
        logger.log(`Sent StartRecognition to Speechmatics with ${sampleRate}Hz sample rate`)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SpeechmaticsMessage

          if (data.message === 'AddPartialTranscript') {
            // Handle partial transcripts
            const text = data.results
              .map(r => r.alternatives[0]?.content)
              .filter(Boolean)
              .join(' ')
            
            if (text) {
              setCurrentTranscript(prev => {
                const updated = prev + ' ' + text
                currentTranscriptRef.current = updated
                return updated
              })
              
              // Send partial transcripts in chunks based on word buffer
              const words = getWords(text)
              if (words.length >= maxWordsBuffer) {
                const speaker = getSpeakerRole()
                logger.log('Partial transcript:', text)
                sendTranscript({ text, status: 'partial', speaker })
              }
            }
          }
          else if (data.message === 'AddTranscript') {
            // Handle final transcripts - Speechmatics sends phrases, so just accumulate and send when we have enough words
            const text = data.results
              .map(r => r.alternatives[0]?.content)
              .filter(Boolean)
              .join(' ')
            
            if (text) {
              // Accumulate words
              setCurrentTranscript(prev => {
                const updated = prev ? prev + ' ' + text : text
                currentTranscriptRef.current = updated
                
                // Check if we have enough words to send
                const wordCount = getWords(updated).length
                if (wordCount >= maxWordsBuffer) {
                  const speaker = getSpeakerRole()
                  logger.log('Sending final transcript:', updated)
                  sendTranscript({ text: updated, status: 'final', speaker })
                  // Reset
                  currentTranscriptRef.current = ''
                  return ''
                }
                
                return updated
              })
            }
          }
          else if (data.message === 'EndOfTranscript') {
            // Handle end of transcript - send any remaining accumulated text
            if (currentTranscriptRef.current && currentTranscriptRef.current.trim()) {
              const speaker = getSpeakerRole()
              logger.log('Sending remaining transcript on EndOfTranscript:', currentTranscriptRef.current)
              sendTranscript({ text: currentTranscriptRef.current, status: 'final', speaker })
              setCurrentTranscript('')
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
            'Your Speechmatics account has reached its concurrent session limit. Please wait a moment and try again, or upgrade your plan.'
          )
          return // Don't attempt reconnection
        }

        // Only attempt reconnection for network issues (not quota/auth errors)
        // Code 1000 = normal closure, 1008 = policy violation (quota), 1006 = abnormal closure
        if (isAudioEnabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && event.code === 1006) {
          reconnectAttemptsRef.current += 1
          logger.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`)
          setTimeout(() => {
            // Use the current audio context's sample rate for reconnection
            const sampleRate = audioContextRef.current?.sampleRate || SAMPLE_RATE
            void connectWebSocket(sampleRate)
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
  }, [generateJWT, isAudioEnabled, hasNotifiedUser, getSpeakerRole, sendTranscript, maxWordsBuffer])

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
      // Get microphone access - using minimal constraints to avoid conflicts with Zoom's video stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true, // Simplified to avoid forcing a new stream
      })
      streamRef.current = stream

      // Create audio context with default sample rate to avoid conflicts
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      
      const actualSampleRate = audioContext.sampleRate
      logger.log(`Audio context created with sample rate: ${actualSampleRate}Hz`)

      // Connect WebSocket with the actual sample rate
      await connectWebSocket(actualSampleRate)

      // Set up audio processing
      const source = audioContext.createMediaStreamSource(stream)
      
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0)
          
          // Convert Float32Array to Int16Array (PCM 16-bit)
          const pcmData = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]))
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
      if (!hasNotifiedUser) {
        errorNotification('Microphone access failed', 'Please allow microphone access for transcription')
        setHasNotifiedUser(true)
      }
    }
  }, [connectWebSocket, hasNotifiedUser])

  // Stop capturing audio
  const stopTranscribing = useCallback(() => {
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

