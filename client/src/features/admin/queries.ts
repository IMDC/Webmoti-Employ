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
  allowlist: ['admin', 'allowlist'] as const,
  users: ['admin', 'users'] as const,
  interviews: ['admin', 'interviews'] as const,
  liveSessions: ['admin', 'live-sessions'] as const,
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

// ── Allowlist ──────────────────────────────────────────────

const AllowlistEntry = z.object({
  id: z.number(),
  email: z.string(),
  addedById: z.string(),
  createdAt: z.coerce.date(),
})

const AllowlistResponse = z.object({
  allowlist: z.array(AllowlistEntry),
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
  return result.data.allowlist
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
  return result.data.users
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminQueryKeys.users,
    queryFn: getUsers,
  })
}

// ── Interviews ─────────────────────────────────────────────

const InterviewsResponse = z.object({
  interviews: z.array(z.object({
    id: z.number(),
    hostId: z.string(),
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

// ── Live Sessions ──────────────────────────────────────────

const LiveSession = z.object({
  id: z.string(),
  session_name: z.string(),
  session_key: z.string(),
  start_time: z.coerce.date(),
  end_time: z.literal(''),
  user_count: z.number(),
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
