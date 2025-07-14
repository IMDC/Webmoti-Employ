/* eslint-disable ts/no-redeclare */
import { z } from 'zod'

export const ResolvedProfile = z.object({
  displayName: z.string(),
  profilePic: z.url(),
})

export const ProfilesResponse = z.record(z.string(), ResolvedProfile.nullable())

export type ResolvedProfile = z.infer<typeof ResolvedProfile>
export type ProfilesResponse = z.infer<typeof ProfilesResponse>
