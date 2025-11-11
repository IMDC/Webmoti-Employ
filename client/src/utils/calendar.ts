import { DateTime } from 'luxon'
import { getInterviewLink } from './utils'

/**
 * Opens Google Calendar in a new tab with pre-filled event details
 * @param startTime - Interview start time
 * @param endTime - Interview end time
 * @param invites - Array of email addresses to invite
 * @param sessionId - Interview session ID for generating the join link
 */
export function openGoogleCalendarTab(
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
