import { useEffect, useState } from 'react'
import { Corner } from '@/components/Corner'
import { usePreviewStore } from '@/features/interview/prejoin/hooks/usePreviewStore'
import { useAppPermissionState } from '@/useAppStore'
import AudioLevelIndicator from '../../components/AudioLevelIndicator'
import { ParticipantTile } from '../../components/ParticipantTile'
import { VideoRenderer } from '../../session/components/VideoRenderer'
import { useZoomSessionStore } from '../../zoom/useZoomSessionStore'

interface PreviewTileProps {
  height: number
  width: number
  name: string
  profileUrl: string
}

export function PreviewTile({ height, width, name, profileUrl }: PreviewTileProps) {
  const permissionState = useAppPermissionState()

  const startCamera = usePreviewStore(s => s.startCamera)
  const stopCamera = usePreviewStore(s => s.stopCamera)
  const startMicrophone = usePreviewStore(s => s.startMicrophone)
  const localAudioTrack = usePreviewStore(s => s.localAudioTrack)

  const isVideoOn = useZoomSessionStore(s => s.isVideoOn)
  const isAudioOn = useZoomSessionStore(s => s.isAudioOn)

  const [volume, setVolume] = useState(0)

  useEffect(() => {
    async function startMic() {
      if (permissionState === 'granted') {
        await startMicrophone()
      }
    }

    startMic()
  }, [permissionState, startMicrophone])

  // polling to update volume indicator
  useEffect(() => {
    let interval: number
    if (localAudioTrack) {
      interval = window.setInterval(() => {
        const volume = localAudioTrack.getCurrentVolume()
        setVolume(volume)
      }, 200)
    }
    return () => {
      clearInterval(interval)
    }
  }, [localAudioTrack])

  return (
    <ParticipantTile height={height} width={width} name={name} profileUrl={profileUrl} isLoadingProfiles={false}>
      {permissionState === 'granted' && isVideoOn && (
        <VideoRenderer attach={startCamera} detach={stopCamera} />
      )}

      <Corner position="bottom-right" yOffset={6} xOffset={8}>
        <AudioLevelIndicator volume={volume || 0} isTrackEnabled={isAudioOn} />
      </Corner>
    </ParticipantTile>
  )
}
