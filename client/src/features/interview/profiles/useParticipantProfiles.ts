import type { Participant } from '@zoom/videosdk'
import { useProfiles } from './useProfiles'

/**
 * Fetches profile data (names, profile pictures) for all participants in a Zoom session
 *
 * How it works:
 * 1. When users join Zoom, they pass their database user.id as the "name" parameter
 * 2. This database user.id becomes the Zoom participant's "displayName" field
 * 3. We extract all displayNames (which are database user IDs)
 * 4. Fetch profiles from the server using these IDs
 * 5. Server returns profiles keyed by user ID: { "user-id-123": { displayName, profilePic } }
 *
 * Note: We don't need useUser() because the current user is already in the participants map
 */
export function useParticipantProfiles(participants: Map<number, Participant>) {
  // Extract database user IDs from all participants
  // participant.displayName contains the database user ID (not a display name!)
  const userIds = Array.from(participants.values())
    .map(p => p.displayName) // displayName = database user ID
    .filter(Boolean)
    .sort()

  // Fetch all profiles at once from the server
  const { profiles, isPending } = useProfiles({ kind: 'ids', values: userIds })
  return { profiles, isLoadingProfiles: isPending }
}
