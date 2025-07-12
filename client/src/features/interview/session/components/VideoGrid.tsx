import type { ProfilesResponse } from '@web-employ/shared'
import type { Participant } from '@zoom/videosdk'
import { GALLERY_VIEW_ASPECT_RATIO } from '../../../../utils/constants'
import useGalleryViewLayout from '../hooks/useGalleryViewLayout'
import { SessionTile } from './SessionTile'

interface VideoGridProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  participants: Map<number, Participant>
  isLoadingProfiles: boolean
  profiles?: ProfilesResponse
}

export function VideoGrid({ containerRef, participants, profiles, isLoadingProfiles }: VideoGridProps) {
  const participantCount = participants.size
  const { participantVideoWidth } = useGalleryViewLayout(participantCount, containerRef)

  const participantHeight = participantVideoWidth * GALLERY_VIEW_ASPECT_RATIO

  return (
    <>
      {Array.from(participants.entries()).map(([userId, participant]) => {
        const profile = profiles?.[participant.displayName]
        return (
          <SessionTile
            key={userId}
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
