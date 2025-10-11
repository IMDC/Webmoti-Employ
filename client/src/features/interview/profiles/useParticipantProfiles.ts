import type { Participant } from '@zoom/videosdk'
import { useUser } from '@/features/auth/hooks/useUserStore'
import { useProfiles } from './useProfiles'

export function useParticipantProfiles(participants: Map<number, Participant>) {
  const user = useUser()
  const userIds = Array.from(participants.values())
    .map(p => p.userId.toString())
    .filter(Boolean)
    .sort()

  // Always include the authenticated user's ID to ensure their profile is loaded
  const allUserIds = [...new Set([...userIds, user.id])].sort()

  const { profiles, isPending } = useProfiles({ kind: 'ids', values: allUserIds })
  return { profiles, isLoadingProfiles: isPending }
}
