import type { Participant } from '@zoom/videosdk'
import { useProfiles } from './useProfiles'

export function useParticipantProfiles(participants: Map<number, Participant>) {
  const userIds = Array.from(participants.values())
    .map(p => p.userId.toString())
    .filter(Boolean)
    .sort()

  const { profiles, isPending } = useProfiles({ kind: 'ids', values: userIds })
  return { profiles, isLoadingProfiles: isPending }
}
