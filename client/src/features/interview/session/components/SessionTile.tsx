import type { Participant, VideoPlayer } from '@zoom/videosdk'
import { useCallback } from 'react'
import { useZoomSessionStore } from '@/features/interview/zoom/useZoomSessionStore'
import { Corner } from '../../../../components/Corner'
import AudioLevelIndicator from '../../components/AudioLevelIndicator'
import { ParticipantTile } from '../../components/ParticipantTile'
import { VideoRenderer } from './VideoRenderer'

interface SessionTileProps {
  height: number
  width: number
  participant: Participant
  name: string
  profileUrl: string
  isLoadingProfiles: boolean
}

export function SessionTile({ height, width, participant, profileUrl, isLoadingProfiles, name }: SessionTileProps) {
  const attach = useZoomSessionStore(s => s.attachVideoPlayer)
  const detach = useZoomSessionStore(s => s.detachVideoPlayer)

  const attachStable = useCallback(
    (el: VideoPlayer) => attach(participant.userId, el),
    [attach, participant.userId],
  )

  const detachStable = useCallback(() => detach(participant.userId), [detach, participant.userId])

  return (
    <ParticipantTile
      height={height}
      width={width}
      name={name}
      profileUrl={profileUrl}
      isLoadingProfiles={isLoadingProfiles}
    >
      {participant.bVideoOn && <VideoRenderer attach={attachStable} detach={detachStable} />}

      <Corner position="bottom-right" yOffset={6} xOffset={8}>
        <AudioLevelIndicator
          volume={0}
          isTrackEnabled={participant.audio === 'computer' || participant.audio === 'phone'}
        />
      </Corner>
    </ParticipantTile>
  )
}
