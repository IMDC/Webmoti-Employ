import type { ProfilesResponse } from '@webmoti-employ/shared'
import type { Participant } from '@zoom/videosdk'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { AspectRatio } from '@mantine/core'
import { useUser } from '@/features/auth/hooks/useUserStore'
import { GALLERY_VIEW_ASPECT_RATIO } from '@/utils/constants'
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
  const user = useUser()

  const localParticipant = localUserId ? participants.get(localUserId) : undefined
  if (!localParticipant) {
    logger.error('No local participant found')
    return null
  }

  const remoteParticipants = [...participants.values()].filter(
    p => p.userId !== localUserId,
  )

  const hasRemote = remoteParticipants.length > 0

  const mainParticipant = hasRemote ? remoteParticipants[0] : localParticipant
  const secondaryParticipant = hasRemote ? localParticipant : null

  // Use authenticated user ID for local participant profile lookup
  const mainProfileKey = mainParticipant.userId === localUserId ? user.id : mainParticipant.displayName
  const mainProfile = profiles?.[mainProfileKey]
  const secondaryProfile = secondaryParticipant ? profiles?.[user.id] : null

  return (
    <>
      <SessionTile
        // always run face detection on main participant (even if it's the local participant)
        setHostVideo={setHostVideo}
        height={height}
        width={width}
        participant={mainParticipant}
        name={mainProfile?.displayName || mainParticipant.displayName}
        profileUrl={mainProfile?.profilePic || ''}
        isLoadingProfiles={isLoadingProfiles}
      />

      {secondaryParticipant && (
        <AspectRatio
          ratio={GALLERY_VIEW_ASPECT_RATIO}
          w={300}
          style={{
            position: 'absolute',
            bottom: 15,
            right: 15,
          }}
        >
          <SessionTile
            height="100%"
            width="100%"
            participant={secondaryParticipant}
            name={secondaryProfile?.displayName || secondaryParticipant.displayName}
            profileUrl={secondaryProfile?.profilePic || ''}
            isLoadingProfiles={isLoadingProfiles}
          />
        </AspectRatio>
      )}
    </>
  )
}
