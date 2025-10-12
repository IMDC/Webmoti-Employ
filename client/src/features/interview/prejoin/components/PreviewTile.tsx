import { useEffect } from 'react'
import { Corner } from '@/components/Corner'
import { useLocalAudioTrack, usePreviewActions } from '@/features/interview/prejoin/hooks/usePreviewStore'
import { useAppPermissionState } from '@/useAppStore'
import AudioLevelIndicator from '../../components/AudioLevelIndicator'
import { ParticipantTile } from '../../components/ParticipantTile'
import { VideoRenderer } from '../../session/components/VideoRenderer'
import { useIsAudioOn, useIsVideoOn } from '../../zoom/useZoomSessionStore'
import { useVolumeLevel } from '../hooks/useVolumeLevel'

interface PreviewTileProps {
  height: number
  width: number
  name: string
  profileUrl: string
}

export function PreviewTile({ height, width, name, profileUrl }: PreviewTileProps) {
  const permissionState = useAppPermissionState()
  const { startCamera, stopCamera, startMicrophone } = usePreviewActions()
  const localAudioTrack = useLocalAudioTrack()
  const isVideoOn = useIsVideoOn()
  const isAudioOn = useIsAudioOn()

  useEffect(() => {
    async function startMic() {
      if (permissionState === 'granted') {
        await startMicrophone()
      }
    }

    startMic()
  }, [permissionState, startMicrophone])

  const volume = useVolumeLevel(localAudioTrack?.getCurrentVolume)

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
