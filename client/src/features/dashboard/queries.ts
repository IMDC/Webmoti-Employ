import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod/v4';
import { HttpError } from '@/utils/HttpError';
import { InterviewsGetResponse, InterviewsPostRequest } from './schema';

const queryKeys = {
  interviews: ['interviews'] as const,
};

// ----------------------------------------------------------------
// GET from interviews

async function getInterviews() {
  const response = await fetch('/api/interviews');
  if (!response.ok) {
    throw new Error(`Failed to get interviews: ${response.status}`);
  }

  const json = await response.json();
  const result = InterviewsGetResponse.safeParse(json);
  if (!result.success) {
    throw new Error(z.prettifyError(result.error));
  }

  return result.data.interviews;
}

export function useInterviews() {
  const {
    data: interviews,
    isPending,
    error,
  } = useQuery({
    queryKey: queryKeys.interviews,
    queryFn: getInterviews,
  });

  return { interviews, isPending, error };
}

// ----------------------------------------------------------------
// POST to interviews

async function scheduleInterview(interview: InterviewCreate) {
  const response = await fetch('/api/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interview),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new HttpError('Failed to schedule interview', response.status, data);
  }
}

export function useScheduleInterview() {
  const queryClient = useQueryClient();

  const { mutateAsync: scheduleInterviewMutation, isPending: isScheduleInterviewPending } =
    useMutation({
      mutationFn: scheduleInterview,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.interviews });
      },
    });

  return { scheduleInterviewMutation, isScheduleInterviewPending };
}
