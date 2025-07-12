import type { Participant } from '@zoom/videosdk'
import { useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { resolveProfiles } from './resolveProfiles'

export function useParticipantProfiles(participants: Map<number, Participant>) {
  const { getToken } = useAuth()

  const userIds = Array.from(participants.values())
    .map(p => p.displayName) // display name is clerk id
    .filter(Boolean)
    .sort() // make key stable

  const {
    data: profiles,
    isPending: isLoadingProfiles,
  } = useQuery({
    queryKey: ['profiles', userIds],
    queryFn: async () => {
      const token = await getToken()
      return resolveProfiles(token, { userIds })
    },
    enabled: userIds.length > 0,
    meta: {
      errorTitle: 'Failed to load participant profiles',
    },
  })

  return { profiles, isLoadingProfiles }
}
