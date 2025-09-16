import type { ProfilesResponse } from '@webmoti-employ/shared'
import type { Participant } from '@zoom/videosdk'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { logger } from '@/utils/logger'
import { useLocalUserId } from '../../zoom/useZoomSessionStore'
import { useSingleLayout } from '../hooks/useSingleLayout'
import { SessionTile } from './SessionTile'

interface SpotlightViewProps {
  containerRef: RefObject<HTMLDivElement | null>
  setHostVideo: Dispatch<SetStateAction<HTMLVideoElement | null>>
  participants: Map<number, Participant>
  isLoadingProfiles: boolean
  profiles?: ProfilesResponse
}

export function SpotlightView({
  containerRef,
  participants,
  profiles,
  isLoadingProfiles,
  setHostVideo,
}: SpotlightViewProps) {
  const { width, height } = useSingleLayout(containerRef)
  const localUserId = useLocalUserId()

  const localParticipant = localUserId ? participants.get(localUserId) : undefined
  if (!localParticipant) {
    logger.error('No local participant found')
    return null
  }

  const localProfile = profiles?.[localParticipant.displayName]

  const mainParticipant = localParticipant
  const mainProfile = localProfile

  return (
    <>
      <SessionTile
        // always run face detection on main participant (even if it's the local participant)
        setHostVideo={setHostVideo}
        height={height}
        width={width}
        participant={mainParticipant}
        name={mainParticipant?.displayName || mainParticipant.displayName}
        profileUrl={mainProfile?.profilePic || ''}
        isLoadingProfiles={isLoadingProfiles}
      />

      {/* <AspectRatio
          ratio={16 / 9}
          w={250}
          style={{
            position: 'absolute',
            bottom: 15,
            right: 15,
          }}
        >
          <ParticipantTile width="100%" height="100%" />
        </AspectRatio>  */}
    </>
  )
}
