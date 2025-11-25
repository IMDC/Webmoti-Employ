import type { Participant, VideoPlayer } from '@zoom/videosdk'
import type { Dispatch, SetStateAction } from 'react'
import { Box, Group } from '@mantine/core'
import { useCallback } from 'react'
import {
  useActiveSpeakerUserId,
  useParticipantNetworkLevel,
  useZoomSessionActions,
} from '@/features/interview/zoom/useZoomSessionStore'
import { Corner } from '../../../../components/Corner'
import AudioLevelIndicator from '../../components/AudioLevelIndicator'
import NetworkQualityIndicator from '../../components/NetworkQualityIndicator'
import { ParticipantTile } from '../../components/ParticipantTile'
import { VideoRenderer } from './VideoRenderer'

interface SessionTileProps {
  height: number | string
  width: number | string
  participant: Participant
  name: string
  profileUrl: string
  isLoadingProfiles: boolean
  setHostVideo?: Dispatch<SetStateAction<HTMLVideoElement | null>>
}

export function SessionTile({
  height,
  width,
  participant,
  profileUrl,
  isLoadingProfiles,
  name,
  setHostVideo,
}: SessionTileProps) {
  const { attachVideoPlayer, detachVideoPlayer } = useZoomSessionActions()

  const attachStable = useCallback(
    (el: VideoPlayer) => attachVideoPlayer(participant.userId, el),
    [attachVideoPlayer, participant.userId],
  )

  const detachStable = useCallback(
    () => detachVideoPlayer(participant.userId),
    [detachVideoPlayer, participant.userId],
  )

  const isTrackEnabled = participant.audio === 'computer' || participant.audio === 'phone'

  const activeSpeakerId = useActiveSpeakerUserId()

  const networkLevel = useParticipantNetworkLevel(participant.userId)

  // Debug logging
  // Removed logging to reduce console spam

  return (
    <ParticipantTile
      height={height}
      width={width}
      name={name}
      profileUrl={profileUrl}
      isLoadingProfiles={isLoadingProfiles}
      isActiveSpeaker={activeSpeakerId === participant.userId && isTrackEnabled}
    >
      {participant.bVideoOn && (
        <VideoRenderer
          userId={participant.userId}
          attach={attachStable}
          detach={detachStable}
          setHostVideo={setHostVideo}
        />
      )}

      <Corner position="bottom-right" yOffset={8} xOffset={12}>
        <Group gap="xs" align="end">
          {!isTrackEnabled && (
            <AudioLevelIndicator
              volume={0}
              isTrackEnabled={false}
            />
          )}

          {/* container to vertically center the network indicator with the audio one */}
          <Box h={20}>
            <NetworkQualityIndicator level={networkLevel} />
          </Box>
        </Group>

      </Corner>
    </ParticipantTile>
  )
}
