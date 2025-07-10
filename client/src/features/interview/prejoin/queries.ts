import { useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod/v4'
import { HttpError } from '@/utils/HttpError'
import { SessionsGetResponse } from './schema'

interface CreateArgs {
  action: 'create'
  userIdentity: string
}

interface JoinArgs {
  action: 'join'
  userIdentity: string
  sessionId: string
}

export type InterviewSessionArgs = CreateArgs | JoinArgs

// ----------------------------------------------------------------
// GET /sessions

async function fetchInterviewSession(
  args: InterviewSessionArgs,
  authToken: string | null,
): Promise<SessionsGetResponse> {
  if (!authToken) {
    throw new HttpError('Missing auth token', 401)
  }

  const { action, userIdentity } = args

  const params = new URLSearchParams({ userIdentity })
  let endpoint: string
  if (action === 'create') {
    endpoint = `/api/sessions?${params.toString()}`
  }
  else {
    const { sessionId } = args
    endpoint = `/api/sessions/${sessionId}?${params.toString()}`
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
  const json = await response.json()
  if (!response.ok) {
    throw new HttpError(`Failed to ${action} session`, response.status, json)
  }

  const result = SessionsGetResponse.safeParse(json)
  if (!result.success) {
    throw new HttpError('Invalid response schema', 500, z.flattenError(result.error))
  }

  return result.data
}

function getInterviewSessionKey(args: InterviewSessionArgs) {
  if (args.action === 'create') {
    return ['interviewSession', 'create', args.userIdentity]
  }

  return ['interviewSession', 'join', args.userIdentity, args.sessionId]
}

export function useInterviewSession(args: InterviewSessionArgs) {
  const { getToken } = useAuth()

  const {
    data: interviewSession,
    isPending: isInterviewSessionPending,
    error: interviewSessionError,
  } = useQuery({
    queryKey: getInterviewSessionKey(args),
    queryFn: async () => {
      const token = await getToken()
      return fetchInterviewSession(args, token)
    },
    refetchInterval: 1000 * 60 * 105, // 1 hour 45 minutes (15 less than jwt exp)
    refetchIntervalInBackground: true,
  })

  return {
    interviewSession,
    isInterviewSessionPending,
    interviewSessionError,
  }
}
