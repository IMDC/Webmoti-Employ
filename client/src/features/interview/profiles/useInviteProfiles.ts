import { useProfiles } from './useProfiles'

export function useInviteProfiles(emails: string[]) {
  const { profiles, isPending } = useProfiles({ kind: 'emails', values: [...emails].sort() })
  return { profiles, isLoadingProfiles: isPending }
}
