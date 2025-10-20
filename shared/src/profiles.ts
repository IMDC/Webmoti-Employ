import { z } from 'zod'

export const ResolvedProfile = z.object({
  displayName: z.string(),
  // Allow profilePic to be either a valid URL OR an empty string
  // This is important because users may not have profile pictures (e.g., no Google photo)
  // The server returns '' when user.image is null/undefined
  // Without .or(z.literal('')), validation would fail and the entire profile would be rejected
  profilePic: z.string().url().or(z.literal('')),
})

// ProfilesResponse is an object keyed by user IDs (strings from database)
// Example: { "user-id-123": { displayName: "John", profilePic: "https://..." } }
export const ProfilesResponse = z.record(z.string(), ResolvedProfile.nullable())

export type ResolvedProfile = z.infer<typeof ResolvedProfile>
export type ProfilesResponse = z.infer<typeof ProfilesResponse>
