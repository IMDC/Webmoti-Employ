import type { PropsWithChildren } from 'react'
import { PCMAudioRecorderProvider } from '@speechmatics/browser-audio-input-react'
import workletScriptURL from '@speechmatics/browser-audio-input/pcm-audio-worklet.min.js?url'
import { useMemo } from 'react'

// Speechmatics recommends using a sample rate of 16_000 Hz for real-time transcription.
// Anything higher will be downsampled by the server. Lower sample rates are also supported.
const RECORDING_SAMPLE_RATE = 16_000

export function AudioProvider({ children }: PropsWithChildren) {
  const audioContext = useMemo(() => new window.AudioContext({ sampleRate: RECORDING_SAMPLE_RATE }), [])

  return (
    <PCMAudioRecorderProvider
      audioContext={audioContext}
      workletScriptURL={workletScriptURL}
    >
      {children}
    </PCMAudioRecorderProvider>
  )
}
