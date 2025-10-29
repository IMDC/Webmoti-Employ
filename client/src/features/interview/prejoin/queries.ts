import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { z } from 'zod'
import { HttpError } from '@/utils/HttpError'
import { getLocalBearerToken } from '@/utils/utils'
import { SessionsGetResponse } from './schema'

// ----------------------------------------------------------------
// GET /sessions

async function fetchInterviewSession(sessionId?: string): Promise<SessionsGetResponse> {
  const endpoint = `${import.meta.env.VITE_API_BASE_URL}/sessions${sessionId ? `/${sessionId}` : ''}`
  const authToken = getLocalBearerToken()
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${authToken}` },
  })
  const json = await response.json()

  if (!response.ok) {
    throw new HttpError(
      sessionId ? 'Failed to join session' : 'Failed to create session',
      response.status,
      json,
    )
  }

  const result = SessionsGetResponse.safeParse(json)
  if (!result.success) {
    throw new HttpError('Invalid response schema', 500, z.flattenError(result.error))
  }

  return result.data
}

export function useInterviewSession(sessionId?: string) {
  const navigate = useNavigate()

  const {
    data: interviewSession,
    isPending: isInterviewSessionPending,
    error: interviewSessionError,
  } = useQuery({
    queryKey: ['interviewSession', sessionId ? 'join' : 'create', sessionId],
    queryFn: () => fetchInterviewSession(sessionId),
    refetchInterval: 1000 * 60 * 105, // 1 hour 45 minutes (15 less than jwt exp)
    refetchIntervalInBackground: true,
  })

  // update url after creating a new session
  useEffect(() => {
    if (!sessionId && interviewSession?.sessionId) {
      navigate({
        to: '/interview/prejoin/$id',
        params: { id: interviewSession.sessionId },
        replace: true,
      })
    }
  }, [sessionId, interviewSession, navigate])

  return {
    interviewSession,
    isInterviewSessionPending,
    interviewSessionError,
  }
}
