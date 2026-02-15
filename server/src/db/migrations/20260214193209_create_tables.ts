import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // interview
  await db.schema
    .createTable('public.interview')
    .addColumn('id', 'integer', col => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('creator_id', 'varchar(128)', col => col.notNull())
    .addColumn('start_time', 'timestamptz', col => col.notNull())
    .addColumn('end_time', 'timestamptz')
    .addColumn('is_instant', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('session_id', 'uuid', col => col.notNull().unique().defaultTo(sql`gen_random_uuid()`))
    .addColumn('created_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .execute()

  // interview_invite
  await db.schema
    .createTable('public.interview_invite')
    .addColumn('id', 'integer', col => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('interview_id', 'integer', col => col.notNull())
    .addColumn('email', 'text', col => col.notNull())
    .addColumn('is_interviewer', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addForeignKeyConstraint(
      'interview_id_fkey',
      ['interview_id'],
      'public.interview',
      ['id'],
      cb => cb.onUpdate('cascade').onDelete('cascade'),
    )
    .addUniqueConstraint(
      'interview_invite_interview_id_email_key',
      ['interview_id', 'email'],
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('public.interview_invite').execute()
  await db.schema.dropTable('public.interview').execute()
}
