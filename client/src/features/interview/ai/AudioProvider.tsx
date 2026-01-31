import type { PropsWithChildren } from 'react'
import { PCMAudioRecorderProvider } from '@speechmatics/browser-audio-input-react'
import workletScriptURL from '@speechmatics/browser-audio-input/pcm-audio-worklet.min.js?url'
import { useMemo } from 'react'
import { RECORDING_SAMPLE_RATE } from './speechmatics-utils'

export function AudioProvider({ children }: PropsWithChildren) {
  const audioContext = useMemo(() => new window.AudioContext({ sampleRate: RECORDING_SAMPLE_RATE }), [])

  // TODO: cleanup the audioContext here. It shouldn't interfere with speechmatics in react strict mode.

  return (
    <PCMAudioRecorderProvider
      audioContext={audioContext}
      workletScriptURL={workletScriptURL}
    >
      {children}
    </PCMAudioRecorderProvider>
  )
}
