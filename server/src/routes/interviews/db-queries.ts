import type { InterviewResponse, NewInterviewInvite } from '@webmoti-employ/shared'
import type { Expression, Kysely, SqlBool } from 'kysely'
import type { DB } from '../../db/schema'
import { sql } from 'kysely'

// this is a multi purpose function and can be used to get all user interviews or to get a specific interview
export async function getInterviews(
  db: Kysely<DB>,
  options?: {
    userId?: string
    userEmail?: string
    sessionId?: string
    isUpcoming?: boolean
    onlyScheduledInterviews?: boolean
  },
) {
  const {
    userId,
    userEmail,
    sessionId,
    isUpcoming = false,
    onlyScheduledInterviews = false,
  } = options ?? {}

  const interviewRows = await db
    .with('relevant_interviews', db =>
      // -----------------------------------------------------------------
      // first find all interviews the user is a creator of or invited to
      // -----------------------------------------------------------------
      db
        .selectFrom('interview')
        .leftJoin('interviewInvite', 'interviewInvite.interviewId', 'interview.id')
        .where((eb) => {
          const filters: Expression<SqlBool>[] = []

          if (userId || userEmail) {
            const orConditions: Expression<SqlBool>[] = []
            if (userId) {
              orConditions.push(eb('interview.creatorId', '=', userId))
            }
            if (userEmail) {
              orConditions.push(eb('interviewInvite.email', '=', userEmail))
            }
            filters.push(eb.or(orConditions))
          }

          if (onlyScheduledInterviews) {
            filters.push(eb('interview.isInstant', '=', false))
          }

          if (isUpcoming) {
            // filter using endTime since you could still join an interview after startTime
            // also allow instant interviews since they have no endTime
            filters.push(
              eb.or([
                eb('interview.endTime', '>=', sql<Date>`now()`),
                eb('interview.isInstant', '=', true),
              ]),
            )
          }

          if (sessionId) {
            filters.push(eb('interview.sessionId', '=', sessionId))
          }

          return eb.and(filters)
        })
        .select('interview.id')
        .distinct())
    // -----------------------------------------------------------------
    // then get the interview data for the interviews found
    // -----------------------------------------------------------------
    .selectFrom('interview')
    .leftJoin('interviewInvite', 'interviewInvite.interviewId', 'interview.id')
    .where('interview.id', 'in', db => db.selectFrom('relevant_interviews').select('id'))
    .select([
      'interview.id',
      'interview.creatorId',
      'interview.startTime',
      'interview.endTime',
      'interview.sessionId',
      'interview.createdAt',
      'interview.updatedAt',
      'interview.isInstant',
      'interviewInvite.id as inviteId',
      'interviewInvite.email as inviteEmail',
      'interviewInvite.isInterviewer as inviteIsInterviewer',
    ])
    .execute()

  // collapse flat rows into nested interviews
  // this is needed because the above joins will return a row for each invite.
  function nestInterviews(rows: typeof interviewRows) {
    const interviewMap = new Map<number, InterviewResponse>()

    for (const row of rows) {
      let interview = interviewMap.get(row.id)
      // if this interview hasn't been added to the map yet
      if (!interview) {
        const { id, creatorId, startTime, endTime, sessionId, createdAt, updatedAt, isInstant } = row
        interview = { id, creatorId, startTime, endTime, sessionId, invites: [], createdAt, updatedAt, isInstant }
        interviewMap.set(row.id, interview)
      }

      // then add the invite to the interview in the map
      if (row.inviteId && row.inviteEmail) {
        // interview either has an empty or non empty invites array at this point, so assert with !
        interview.invites!.push({
          id: row.inviteId,
          interviewId: row.id,
          email: row.inviteEmail,
          isInterviewer: row.inviteIsInterviewer ?? false,
        })
      }
    }

    return Array.from(interviewMap.values()) as InterviewResponse[]
  }

  return nestInterviews(interviewRows)
}

/**
 * Find a single interview by sessionId, optionally scoped to a specific user.
 * Returns the interview if found (and accessible by the user), or null otherwise.
 */
export async function findInterviewBySessionId(
  db: Kysely<DB>,
  sessionId: string,
  options?: {
    userId?: string
    userEmail?: string
    isUpcoming?: boolean
    onlyScheduledInterviews?: boolean
  },
): Promise<InterviewResponse | null> {
  const results = await getInterviews(db, { ...options, sessionId })
  return results[0] ?? null
}

export async function createInterview(
  db: Kysely<DB>,
  creatorId: string,
  startTime: Date,
  endTime: Date | null,
  isInstant: boolean,
  invites: Array<NewInterviewInvite> = [],
): Promise<string> {
  await cleanupInstantInterviews(db)

  return await db.transaction().execute(async (trx) => {
    // first add the interview to the table
    const newInterview = await trx
      .insertInto('interview')
      .values({ creatorId, startTime, endTime, isInstant })
      .returning(['interview.id', 'interview.sessionId'])
      .executeTakeFirstOrThrow()

    // then add all invites to the interview_invite table
    for (const invite of invites) {
      await trx
        .insertInto('interviewInvite')
        .values({
          email: invite.email,
          interviewId: newInterview.id,
          isInterviewer: invite.isInterviewer,
        })
        .executeTakeFirstOrThrow()
    }

    // return generated uuid sessionId
    return newInterview.sessionId
  })
}

export async function deleteInterview(db: Kysely<DB>, interviewId: number) {
  return await db
    .deleteFrom('interview')
    .where('interview.id', '=', interviewId)
    .executeTakeFirstOrThrow()
}

export async function cleanupInstantInterviews(db: Kysely<DB>) {
  // 24 hours ago
  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24)

  await db
    .deleteFrom('interview')
    .where('isInstant', '=', true)
    .where('createdAt', '<', cutoff)
    .execute()
}
