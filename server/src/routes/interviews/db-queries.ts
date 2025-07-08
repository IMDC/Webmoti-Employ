import { DB } from '../../db/schema';
import { InterviewInvite } from './schema';
import { Kysely } from 'kysely';

export async function getInterviews(db: Kysely<DB>, userId: string, userEmail: string) {
  return await db.transaction().execute(async (trx) => {
    // first find all interviews the user is a creator of or invited to
    const scheduledInterviewIds = await trx
      .selectFrom('interview')
      .leftJoin('interviewInvite', 'interviewInvite.interviewId', 'interview.id')
      .where((expBuilder) =>
        expBuilder.or([
          expBuilder('interview.creatorId', '=', userId),
          expBuilder('interviewInvite.email', '=', userEmail),
        ])
      )
      .select('interview.id')
      .distinct()
      .execute();

    if (!scheduledInterviewIds) {
      return [];
    }

    const idArray = scheduledInterviewIds.map((row) => row.id);

    const scheduledInterviews = await trx
      .selectFrom('interview')
      .where('interview.id', 'in', idArray)
      .selectAll()
      .execute();

    return scheduledInterviews;
  });
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
