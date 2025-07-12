import { ProfilesResponse } from '@web-employ/shared'
import z from 'zod'
import { HttpError } from '@/utils/HttpError'

export async function resolveProfiles(
  authToken: string | null,
  input: {
    userIds?: string[]
    userEmails?: string[]
  },
) {
  if (!authToken) {
    throw new HttpError('Missing auth token', 401)
  }

  const response = await fetch('/api/profiles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new HttpError('Failed to resolve profiles', response.status, {
      responseBody: body,
    })
  }

  const json = await response.json()
  const result = ProfilesResponse.safeParse(json)
  if (!result.success) {
    throw new HttpError('Invalid profile response', 500, z.flattenError(result.error))
  }

  return result.data
}
