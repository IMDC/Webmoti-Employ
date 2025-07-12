import { useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { resolveProfiles } from './resolveProfiles'

type Keys
  = | { kind: 'ids', values: string[] }
    | { kind: 'emails', values: string[] }

export function useProfiles(keys: Keys, isEnabled = true) {
  const { getToken } = useAuth()

  // ['profiles', 'ids', ['a','b']] or ['profiles','emails',['x@y']]
  const queryKey = ['profiles', keys.kind, keys.values]

  const enabled = keys.values.length > 0 && isEnabled

  const { data, isPending } = useQuery({
    queryKey,
    enabled,
    meta: { errorTitle: 'Failed to load profiles' },
    queryFn: async () => {
      const token = await getToken()
      return resolveProfiles(
        token,
        keys.kind === 'ids'
          ? { userIds: keys.values }
          : { userEmails: keys.values },
      )
    },
  })

  return { profiles: data, isPending }
}
