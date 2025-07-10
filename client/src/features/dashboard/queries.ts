import type { NewInterview } from '@web-employ/shared'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod/v4'
import { HttpError } from '@/utils/HttpError'
import { InterviewsGetResponse } from './schema'

const queryKeys = {
  interviews: ['interviews'] as const,
}

// ----------------------------------------------------------------
// GET from interviews

async function getInterviews(authToken: string | null) {
  if (!authToken) {
    throw new HttpError('Missing auth token', 401)
  }

  const response = await fetch('/api/interviews', {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to get interviews: ${response.status}`)
  }

  const json = await response.json()
  const result = InterviewsGetResponse.safeParse(json)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }

  return result.data.interviews
}

export function useInterviews() {
  const { getToken } = useAuth()
  const {
    data: interviews,
    isPending,
    error,
  } = useQuery({
    queryKey: queryKeys.interviews,
    queryFn: async () => {
      const token = await getToken()
      return getInterviews(token)
    },
  })

  return { interviews, isPending, error }
}

// ----------------------------------------------------------------
// POST to interviews

async function scheduleInterview(interview: NewInterview, authToken: string | null) {
  if (!authToken) {
    throw new HttpError('Missing auth token', 401)
  }

  const response = await fetch('/api/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify(interview),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new HttpError('Failed to schedule interview', response.status, data)
  }
}

export function useScheduleInterview() {
  const queryClient = useQueryClient()
  const { getToken } = useAuth()

  const { mutateAsync: scheduleInterviewMutation, isPending: isScheduleInterviewPending }
    = useMutation({
      mutationFn: async (interview: NewInterview) => {
        const token = await getToken()
        return scheduleInterview(interview, token)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.interviews })
      },
    })

  return { scheduleInterviewMutation, isScheduleInterviewPending }
}
