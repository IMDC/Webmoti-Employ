import { useProfiles } from './useProfiles'

export function useInviteProfiles(emails: string[], isEnabled = false) {
  const { profiles, isPending } = useProfiles({ kind: 'emails', values: [...emails].sort() }, isEnabled)
  return { profiles, isLoadingProfiles: isPending }
}
