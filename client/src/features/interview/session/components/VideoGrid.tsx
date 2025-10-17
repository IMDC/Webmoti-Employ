import type { ProfilesResponse } from '@webmoti-employ/shared'
import type { Participant } from '@zoom/videosdk'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useUser } from '@/features/auth/hooks/useUserStore'
import { GALLERY_VIEW_ASPECT_RATIO } from '../../../../utils/constants'
import { useLocalUserId } from '../../zoom/useZoomSessionStore'
import useGalleryViewLayout from '../hooks/useGalleryViewLayout'
import { SessionTile } from './SessionTile'

interface VideoGridProps {
  containerRef: RefObject<HTMLDivElement | null>
  setHostVideo: Dispatch<SetStateAction<HTMLVideoElement | null>>
  participants: Map<number, Participant>
  isLoadingProfiles: boolean
  profiles?: ProfilesResponse
}

export function VideoGrid({
  containerRef,
  participants,
  profiles,
  isLoadingProfiles,
  setHostVideo,
}: VideoGridProps) {
  const participantCount = participants.size
  const { participantVideoWidth } = useGalleryViewLayout(participantCount, containerRef)
  const localUserId = useLocalUserId()
  const user = useUser()

  const participantHeight = participantVideoWidth / GALLERY_VIEW_ASPECT_RATIO

  return (
    <>
      {Array.from(participants.entries()).map(([userId, participant]) => {
        // Use authenticated user ID for local participant profile lookup
        const profileKey = userId === localUserId ? user.id : participant.displayName
        const profile = profiles?.[profileKey]
        return (
          <SessionTile
            key={userId}
            // only run face detection on the host (the host is the interviewer)
            setHostVideo={participant.isHost ? setHostVideo : undefined}
            height={participantHeight}
            width={participantVideoWidth}
            participant={participant}
            name={profile?.displayName || participant.displayName}
            profileUrl={profile?.profilePic || ''}
            isLoadingProfiles={isLoadingProfiles}
          />
        )
      })}
    </>
  )
}
