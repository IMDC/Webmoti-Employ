import { Kysely } from "kysely";
import { DB } from "./schema";

export async function getAllInterviews(db: Kysely<DB>) {
  return await db.selectFrom("interview").selectAll().execute();
}

export async function createInterview(
  db: Kysely<DB>,
  creatorId: string,
  startTime: Date,
  endTime: Date,
  invites: Array<string> = []
) {
  await db.transaction().execute(async (trx) => {
    // first add the interview to the table
    const newInterview = await trx
      .insertInto("interview")
      .values({ creatorId, startTime, endTime })
      .returning("interview.id")
      .executeTakeFirstOrThrow();

    // then add all invites to the interview_invite table
    for (const inviteEmail of invites) {
      await trx
        .insertInto("interviewInvite")
        .values({ email: inviteEmail, interviewId: newInterview.id })
        .executeTakeFirstOrThrow();
    }
  });
}

export async function deleteInterview(db: Kysely<DB>, interviewId: number) {
  return await db
    .deleteFrom("interview")
    .where("interview.id", "=", interviewId)
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
    .updateTable("interview")
    .set(updates)
    .where("interview.id", "=", interviewId)
    .executeTakeFirstOrThrow();
}
