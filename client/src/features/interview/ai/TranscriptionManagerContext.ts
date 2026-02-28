import { createContext, use } from 'react'

export interface TranscriptionManagerContextValue {
  socketState: string | undefined
  sendAudio: (audioData: Float32Array) => void
  startTranscriptionSession: () => Promise<boolean>
  stopTranscriptionSession: () => void
  isRecognitionReady: boolean
}

export const TranscriptionManagerContext = createContext<TranscriptionManagerContextValue | null>(null)

export function useTranscriptionManager() {
  const context = use(TranscriptionManagerContext)
  if (!context) {
    throw new Error('useTranscriptionManager must be used within TranscriptionManager')
  }
  return context
}
