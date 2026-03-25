import type { BetterAuthPlugin } from 'better-auth'

export function socialBearer() {
  return {
    id: 'social-bearer',
    onResponse: async (response: Response) => {
      const authToken = response.headers.get('set-auth-token')
      if (authToken) {
        const location = response.headers.get('location')
        if (location) {
          // URL-encode the token since v1.5 signed tokens can contain
          // base64 chars (+, /, =) that corrupt when used in query strings
          response.headers.set(
            'location',
            `${location}?authToken=${encodeURIComponent(authToken)}`,
          )
        }
      }
    },
  } satisfies BetterAuthPlugin
}
