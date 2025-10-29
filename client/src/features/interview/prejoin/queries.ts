import { useQuery } from '@tanstack/react-query'
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

  // change url after creating a new session
  // useEffect(() => {
  //   if (!sessionId && interviewSession?.sessionId) {
  //     const newUrl = `/interview/prejoin/${interviewSession.sessionId}`
  //     window.history.replaceState(null, '', newUrl)
  //   }
  // }, [sessionId, interviewSession])

  return {
    interviewSession,
    isInterviewSessionPending,
    interviewSessionError,
  }
}
