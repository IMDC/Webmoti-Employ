import { DB } from '../../db/schema';
import { InterviewInvite } from './schema';
import { Expression, Kysely, sql, SqlBool } from 'kysely';

export async function getInterviews(
  db: Kysely<DB>,
  userId: string,
  userEmail: string,
  sessionId?: string,
  isUpcoming?: boolean
) {
  return await db
    .with('relevant_interviews', (db) =>
      // -----------------------------------------------------------------
      // first find all interviews the user is a creator of or invited to
      // -----------------------------------------------------------------
      db
        .selectFrom('interview')
        .leftJoin('interviewInvite', 'interviewInvite.interviewId', 'interview.id')
        .where((eb) => {
          const filters: Expression<SqlBool>[] = [
            eb.or([
              eb('interview.creatorId', '=', userId),
              eb('interviewInvite.email', '=', userEmail),
            ]),
          ];

          if (isUpcoming) {
            // filter using endTime since you could still join an interview after startTime
            filters.push(eb('interview.endTime', '>=', sql<Date>`now()`));
          }

          if (sessionId) {
            filters.push(eb('interview.sessionId', '=', sessionId));
          }

          return eb.and(filters);
        })
        .select('interview.id')
        .distinct()
    )
    // -----------------------------------------------------------------
    // then get the interview data for the interviews found
    // -----------------------------------------------------------------
    .selectFrom('interview')
    .leftJoin('interviewInvite', 'interviewInvite.interviewId', 'interview.id')
    .where('interview.id', 'in', (db) => db.selectFrom('relevant_interviews').select('id'))
    .select([
      'interview.id as interviewId',
      'interview.creatorId',
      'interview.startTime',
      'interview.endTime',
      'interview.sessionId',
      'interviewInvite.id as inviteId',
      'interviewInvite.email as inviteEmail',
    ])
    .execute();
}

export async function createInterview(
  db: Kysely<DB>,
  creatorId: string,
  startTime: Date,
  endTime: Date,
  invites: Array<InterviewInvite> = []
) {
  await db.transaction().execute(async (trx) => {
    // first add the interview to the table
    const newInterview = await trx
      .insertInto('interview')
      .values({ creatorId, startTime, endTime })
      .returning('interview.id')
      .executeTakeFirstOrThrow();

    // then add all invites to the interview_invite table
    for (const invite of invites) {
      await trx
        .insertInto('interviewInvite')
        .values({ email: invite.email, interviewId: newInterview.id })
        .executeTakeFirstOrThrow();
    }
  });
}

export async function deleteInterview(db: Kysely<DB>, interviewId: number) {
  return await db
    .deleteFrom('interview')
    .where('interview.id', '=', interviewId)
    .executeTakeFirstOrThrow();
}

export async function modifyInterview(
  db: Kysely<DB>,
  interviewId: number,
  startTime?: Date,
  endTime?: Date
) {
  const updates: Record<string, Date> = {};
  if (startTime !== undefined) updates.startTime = startTime;
  if (endTime !== undefined) updates.endTime = endTime;
  if (Object.keys(updates).length === 0) return;

  return await db
    .updateTable('interview')
    .set(updates)
    .where('interview.id', '=', interviewId)
    .executeTakeFirstOrThrow();
}
