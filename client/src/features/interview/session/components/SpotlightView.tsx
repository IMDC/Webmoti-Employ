import type { LayoutProps } from '../Room'
import { AspectRatio } from '@mantine/core'
import { GALLERY_VIEW_ASPECT_RATIO, HEADER_HEIGHT, OUTER_TOOLBAR_HEIGHT } from '@/utils/constants'
import { isElectron } from '@/utils/utils'
import { useLocalUserId } from '../../zoom/useZoomSessionStore'
import { useDraggable } from '../hooks/useDraggable'
import { useSingleLayout } from '../hooks/useSingleLayout'
import { SessionTile } from './SessionTile'

export function SpotlightView({
  containerRef,
  participants,
  profiles,
  isLoadingProfiles,
  setHostVideo,
  faceDetectionResult,
  isLookingAtInterviewer,
}: LayoutProps) {
  const { width, height } = useSingleLayout(containerRef)
  const localUserId = useLocalUserId()
  const draggable = useDraggable({
    bottomInset: HEADER_HEIGHT,
    topInset: isElectron() ? OUTER_TOOLBAR_HEIGHT : 0,
    margin: 8,
  })

  const localParticipant = localUserId ? participants.get(localUserId) : undefined
  if (!localParticipant) {
    return null
  }

  const remoteParticipants = [...participants.values()].filter(
    p => p.userId !== localUserId,
  )

  const hasRemote = remoteParticipants.length > 0

  const mainParticipant = hasRemote ? remoteParticipants[0] : localParticipant
  const secondaryParticipant = hasRemote ? localParticipant : null

  // Look up profiles using participant.displayName (which contains the database user ID)
  // The profiles object is keyed by database user IDs, so we can do a direct lookup
  // Example: profiles["user-id-123"] => { displayName: "John Doe", profilePic: "https://..." }
  // This works for ALL participants (local and remote) because everyone has their user ID in displayName
  const mainProfile = profiles?.[mainParticipant.displayName]
  const secondaryProfile = secondaryParticipant ? profiles?.[secondaryParticipant.displayName] : null

  // wait for the containers to have real dimensions.
  // this also fixes bug where active speaker highlight shows on a tile of 0 size
  if (width === 0 || height === 0)
    return null

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
        faceDetectionResult={faceDetectionResult}
        isLookingAtInterviewer={isLookingAtInterviewer}
      />

      {secondaryParticipant && (
        <AspectRatio
          ratio={GALLERY_VIEW_ASPECT_RATIO}
          w={300}
          onPointerDown={draggable.onPointerDown}
          onPointerMove={draggable.onPointerMove}
          onPointerUp={draggable.onPointerUp}
          style={{
            position: 'absolute',
            bottom: 15,
            right: 15,
            ...draggable.style,
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
