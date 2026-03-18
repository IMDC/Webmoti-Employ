import type { ScheduleData } from '@/components/ScheduleForm'
import { DateTime } from 'luxon'
import { ScheduleForm as ScheduleFormBase } from '@/components/ScheduleForm'
import { useUser } from '@/features/auth/hooks/useUserStore'
import {
  getInterviewLink,
} from '@/utils/utils'
import { useScheduleInterview } from '../queries'

function openGoogleCalendarTab(
  startTime: Date,
  endTime: Date,
  invites: string[],
  sessionId: string,
) {
  const formatDate = (dt: DateTime) =>
    dt.toUTC().toFormat('yyyyLLdd\'T\'HHmmss\'Z\'')

  const start = DateTime.fromJSDate(startTime)
  const end = DateTime.fromJSDate(endTime)

  const startDateTime = formatDate(start)
  const endDateTime = formatDate(end)

  const title = encodeURIComponent('WebMoti-Employ Interview')
  const description = encodeURIComponent(
    'You are invited to a virtual interview on the WebMoti-Employ platform.'
    + `\nJoin link: ${getInterviewLink(sessionId)}`,
  )
  const location = encodeURIComponent(window.location.origin)
  const guests = encodeURIComponent(invites.join(','))

  const url = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${title}&details=${description}&location=${location}&dates=${startDateTime}/${endDateTime}&add=${guests}`

  window.open(url, '_blank')
}

interface ScheduleFormProps {
  onSuccess: () => void
}

export function ScheduleForm({ onSuccess }: ScheduleFormProps) {
  const { scheduleInterviewMutation, isScheduleInterviewPending } = useScheduleInterview()
  const user = useUser()

  async function handleSchedule(data: ScheduleData) {
    return scheduleInterviewMutation({
      hostId: data.hostId,
      startTime: data.startTime,
      endTime: data.endTime,
      invites: data.invites,
      isInstant: false,
    })
  }

  function handleSuccess(sessionId: string, data: ScheduleData) {
    if (data.openGoogleCalendar) {
      const inviteEmails = data.invites.map(i => i.email)
      openGoogleCalendarTab(data.startTime, data.endTime, inviteEmails, sessionId)
    }
    onSuccess()
  }

  return (
    <ScheduleFormBase
      hostId={user.id}
      onSchedule={handleSchedule}
      isPending={isScheduleInterviewPending}
      onSuccess={handleSuccess}
    />
  )
}
