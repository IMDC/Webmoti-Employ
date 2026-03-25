import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { HttpError } from '@/utils/HttpError'
import { getLocalBearerToken } from '@/utils/utils'

const API_BASE = import.meta.env.VITE_API_BASE_URL

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getLocalBearerToken()}`,
  }
}

// ── Query Keys ─────────────────────────────────────────────

export const adminQueryKeys = {
  isAdmin: ['admin', 'check'] as const,
  overview: ['admin', 'overview'] as const,
  allowlist: ['admin', 'allowlist'] as const,
  users: ['admin', 'users'] as const,
  interviews: ['admin', 'interviews'] as const,
  liveSessions: ['admin', 'live-sessions'] as const,
  sessionHistory: (from: string, to: string) => ['admin', 'session-history', from, to] as const,
  sessionParticipants: (sessionId: string | null) => ['admin', 'session-participants', sessionId] as const,
}

// ── Admin Check ────────────────────────────────────────────

const AdminCheckResponse = z.object({ isAdmin: z.boolean() })

async function checkAdmin() {
  const response = await fetch(`${API_BASE}/admin/check`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error('Failed to check admin status')
  }
  const json = await response.json()
  const result = AdminCheckResponse.safeParse(json)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }
  return result.data.isAdmin
}

export function useIsAdmin() {
  return useQuery({
    queryKey: adminQueryKeys.isAdmin,
    queryFn: checkAdmin,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Overview ───────────────────────────────────────────────

const OverviewStats = z.object({
  totalUsers: z.number(),
  totalInterviews: z.number(),
  allowlistSize: z.number(),
  liveSessionCount: z.number(),
})

const OverviewRecentInterview = z.object({
  id: z.number(),
  hostId: z.string(),
  hostName: z.string().nullable(),
  startTime: z.coerce.date(),
  isInstant: z.boolean(),
})

const OverviewUpcomingInterview = z.object({
  id: z.number(),
  hostId: z.string(),
  hostName: z.string().nullable(),
  startTime: z.coerce.date(),
  isInstant: z.boolean(),
})

const OverviewResponse = z.object({
  stats: OverviewStats,
  recentInterviews: z.array(OverviewRecentInterview),
  upcomingInterviews: z.array(OverviewUpcomingInterview),
})

// eslint-disable-next-line ts/no-redeclare
export type OverviewStats = z.infer<typeof OverviewStats>
// eslint-disable-next-line ts/no-redeclare
export type OverviewRecentInterview = z.infer<typeof OverviewRecentInterview>
// eslint-disable-next-line ts/no-redeclare
export type OverviewUpcomingInterview = z.infer<typeof OverviewUpcomingInterview>

async function getOverview() {
  const response = await fetch(`${API_BASE}/admin/overview`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new HttpError('Failed to fetch overview', response.status)
  }
  const json = await response.json()
  const result = OverviewResponse.safeParse(json)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }
  return result.data
}

export function useAdminOverview() {
  return useQuery({
    queryKey: adminQueryKeys.overview,
    queryFn: getOverview,
  })
}

// ── Allowlist ──────────────────────────────────────────────

const AllowlistEntry = z.object({
  id: z.number(),
  email: z.string(),
  addedById: z.string().nullable(),
  createdAt: z.coerce.date(),
})

const AllowlistResponse = z.object({
  allowlist: z.array(AllowlistEntry),
  adminEmails: z.array(z.string()),
})

// eslint-disable-next-line ts/no-redeclare
export type AllowlistEntry = z.infer<typeof AllowlistEntry>

async function getAllowlist() {
  const response = await fetch(`${API_BASE}/admin/allowlist`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new HttpError('Failed to fetch allowlist', response.status)
  }
  const json = await response.json()
  const result = AllowlistResponse.safeParse(json)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }
  return result.data
}

export function useAllowlist() {
  return useQuery({
    queryKey: adminQueryKeys.allowlist,
    queryFn: getAllowlist,
  })
}

export function useAddToAllowlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`${API_BASE}/admin/allowlist`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new HttpError('Failed to add email', response.status, data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.allowlist })
    },
  })
}

export function useRemoveFromAllowlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE}/admin/allowlist/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!response.ok) {
        throw new HttpError('Failed to remove email', response.status)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.allowlist })
    },
  })
}

// ── Users ──────────────────────────────────────────────────

const UserEntry = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
})

const UsersResponse = z.object({
  users: z.array(UserEntry),
  adminEmails: z.array(z.string()),
})

// eslint-disable-next-line ts/no-redeclare
export type UserEntry = z.infer<typeof UserEntry>

async function getUsers() {
  const response = await fetch(`${API_BASE}/admin/users`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new HttpError('Failed to fetch users', response.status)
  }
  const json = await response.json()
  const result = UsersResponse.safeParse(json)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }
  return result.data
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminQueryKeys.users,
    queryFn: getUsers,
    select: data => data.users,
  })
}

export function useAdminEmails() {
  return useQuery({
    queryKey: adminQueryKeys.users,
    queryFn: getUsers,
    select: data => data.adminEmails,
  })
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new HttpError('Failed to delete user', response.status, data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users })
    },
  })
}

// ── Interviews ─────────────────────────────────────────────

const InterviewsResponse = z.object({
  interviews: z.array(z.object({
    id: z.number(),
    hostId: z.string(),
    hostName: z.string().nullable(),
    hostEmail: z.string().nullable(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date().nullable(),
    isInstant: z.boolean(),
    sessionId: z.uuidv4(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    invites: z.array(z.object({
      id: z.number(),
      interviewId: z.number(),
      email: z.string(),
      isInterviewer: z.boolean(),
      name: z.string().nullable(),
      userId: z.string().nullable(),
    })),
  })),
})

async function getAdminInterviews() {
  const response = await fetch(`${API_BASE}/admin/interviews`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new HttpError('Failed to fetch interviews', response.status)
  }
  const json = await response.json()
  const result = InterviewsResponse.safeParse(json)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }
  return result.data.interviews
}

export function useAdminInterviews() {
  return useQuery({
    queryKey: adminQueryKeys.interviews,
    queryFn: getAdminInterviews,
  })
}

export function useAdminDeleteInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE}/admin/interviews/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!response.ok) {
        throw new HttpError('Failed to delete interview', response.status)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.interviews })
    },
  })
}

export function useAdminClearInstantInterviews() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/admin/interviews/instant`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!response.ok) {
        throw new HttpError('Failed to clear instant interviews', response.status)
      }
      return response.json() as Promise<{ deleted: number }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.interviews })
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview })
    },
  })
}

// ── Live Sessions ──────────────────────────────────────────

const LiveSession = z.object({
  id: z.string(),
  session_name: z.string(),
  session_key: z.string(),
  start_time: z.coerce.date(),
  end_time: z.literal(''),
  user_count: z.number(),
  interviewId: z.number().nullable(),
})

const LiveSessionsResponse = z.object({
  sessions: z.array(LiveSession),
})

// eslint-disable-next-line ts/no-redeclare
export type LiveSession = z.infer<typeof LiveSession>

async function getLiveSessions() {
  const response = await fetch(`${API_BASE}/admin/live-sessions`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new HttpError('Failed to fetch live sessions', response.status)
  }
  const json = await response.json()
  const result = LiveSessionsResponse.safeParse(json)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }
  return result.data.sessions
}

export function useLiveSessions() {
  return useQuery({
    queryKey: adminQueryKeys.liveSessions,
    queryFn: getLiveSessions,
    refetchInterval: 10_000,
  })
}

// ── Session History ────────────────────────────────────────

const PastSession = z.object({
  id: z.string(),
  session_name: z.string(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  duration: z.string(),
  user_count: z.number(),
  has_voip: z.boolean(),
  has_video: z.boolean(),
  has_screen_share: z.boolean(),
  has_recording: z.boolean(),
  session_key: z.string(),
  interviewId: z.number().nullable(),
})

// eslint-disable-next-line ts/no-redeclare
export type PastSession = z.infer<typeof PastSession>

const SessionHistoryResponse = z.object({
  sessions: z.array(PastSession),
  from: z.string(),
  to: z.string(),
})

async function getSessionHistory(from: string, to: string) {
  const params = new URLSearchParams({ from, to })
  const response = await fetch(`${API_BASE}/admin/session-history?${params}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new HttpError('Failed to fetch session history', response.status)
  }
  const json = await response.json()
  const result = SessionHistoryResponse.safeParse(json)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }
  // Sort by most recent first
  return result.data.sessions.sort((a, b) => b.start_time.getTime() - a.start_time.getTime())
}

export function useSessionHistory(from: string, to: string) {
  return useQuery({
    queryKey: adminQueryKeys.sessionHistory(from, to),
    queryFn: () => getSessionHistory(from, to),
  })
}

// ── Session Participants ───────────────────────────────────

const SessionParticipant = z.object({
  id: z.string(),
  name: z.string(),
  device: z.string(),
  ip_address: z.string(),
  location: z.string(),
  network_type: z.string(),
  data_center: z.string(),
  join_time: z.coerce.date(),
  leave_time: z.coerce.date(),
  user_key: z.string(),
  audio_quality: z.string(),
  video_quality: z.string(),
  userName: z.string().nullable(),
  userEmail: z.string().nullable(),
  userImage: z.string().nullable(),
})

// eslint-disable-next-line ts/no-redeclare
export type SessionParticipant = z.infer<typeof SessionParticipant>

const SessionParticipantsResponse = z.object({
  participants: z.array(SessionParticipant),
})

async function getSessionParticipants(sessionId: string) {
  const response = await fetch(`${API_BASE}/admin/session-history/${encodeURIComponent(sessionId)}/participants`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new HttpError('Failed to fetch session participants', response.status)
  }
  const json = await response.json()
  const result = SessionParticipantsResponse.safeParse(json)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }
  return result.data.participants
}

export function useSessionParticipants(sessionId: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.sessionParticipants(sessionId),
    queryFn: () => getSessionParticipants(sessionId!),
    enabled: !!sessionId,
  })
}

// ── Schedule Interview (Admin) ─────────────────────────────

interface AdminNewInterview {
  hostId: string
  startTime: Date
  endTime: Date | null
  isInstant: boolean
  invites: { email: string, isInterviewer: boolean }[]
}

const ScheduleResponse = z.object({ sessionId: z.uuidv4() })

async function adminScheduleInterview(data: AdminNewInterview) {
  const response = await fetch(`${API_BASE}/admin/interviews`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const body = await response.json()
    throw new HttpError('Failed to schedule interview', response.status, body)
  }
  const json = await response.json()
  const result = ScheduleResponse.safeParse(json)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }
  return result.data.sessionId
}

export function useAdminScheduleInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminScheduleInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.interviews })
    },
  })
}
