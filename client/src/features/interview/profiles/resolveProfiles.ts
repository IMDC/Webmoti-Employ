import { ProfilesResponse } from '@webmoti-employ/shared'
import z from 'zod'
import { HttpError } from '@/utils/HttpError'

export async function resolveProfiles(
  input: {
    userIds?: string[]
    userEmails?: string[]
  },
) {
  // const authToken = localStorage.getItem('bearer_token')
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${authToken}`,
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
