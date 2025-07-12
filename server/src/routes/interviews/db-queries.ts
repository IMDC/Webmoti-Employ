import type { NewInterviewInvite } from '@web-employ/shared'
import type { Expression, Kysely, SqlBool } from 'kysely'
import type { DB } from '../../db/schema'
import { sql } from 'kysely'

export async function getInterviews(
  db: Kysely<DB>,
  userId?: string,
  userEmail?: string,
  sessionId?: string,
  isUpcoming?: boolean,
) {
  return await db
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

          if (isUpcoming) {
            // filter using endTime since you could still join an interview after startTime
            filters.push(eb('interview.endTime', '>=', sql<Date>`now()`))
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
      'interviewInvite.id as inviteId',
      'interviewInvite.email as inviteEmail',
      'interviewInvite.isInterviewer as inviteIsInterviewer',
      'interviewInvite.isInterviewCreator as inviteIsInterviewCreator',

    ])
    .execute()
}

export async function createInterview(
  db: Kysely<DB>,
  creatorId: string,
  startTime: Date,
  endTime: Date,
  invites: Array<NewInterviewInvite> = [],
): Promise<string> {
  return await db.transaction().execute(async (trx) => {
    // first add the interview to the table
    const newInterview = await trx
      .insertInto('interview')
      .values({ creatorId, startTime, endTime })
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
          isInterviewCreator: invite.isInterviewCreator,
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
