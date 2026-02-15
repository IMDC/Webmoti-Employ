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

  // user
  await db.schema
    .createTable('public.user')
    .addColumn('id', 'text', col => col.primaryKey())
    .addColumn('name', 'text', col => col.notNull())
    .addColumn('email', 'text', col => col.notNull().unique())
    .addColumn('email_verified', 'boolean', col => col.notNull())
    .addColumn('image', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  // session
  await db.schema
    .createTable('public.session')
    .addColumn('id', 'text', col => col.primaryKey())
    .addColumn('expires_at', 'timestamp', col => col.notNull())
    .addColumn('token', 'text', col => col.notNull().unique())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('ip_address', 'text')
    .addColumn('user_agent', 'text')
    .addColumn('user_id', 'text', col => col.notNull())
    .addForeignKeyConstraint(
      'session_user_id_fkey',
      ['user_id'],
      'public.user',
      ['id'],
    )
    .execute()

  // account
  await db.schema
    .createTable('public.account')
    .addColumn('id', 'text', col => col.primaryKey())
    .addColumn('account_id', 'text', col => col.notNull())
    .addColumn('provider_id', 'text', col => col.notNull())
    .addColumn('user_id', 'text', col => col.notNull())
    .addColumn('access_token', 'text')
    .addColumn('refresh_token', 'text')
    .addColumn('id_token', 'text')
    .addColumn('access_token_expires_at', 'timestamp')
    .addColumn('refresh_token_expires_at', 'timestamp')
    .addColumn('scope', 'text')
    .addColumn('password', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addForeignKeyConstraint(
      'account_user_id_fkey',
      ['user_id'],
      'public.user',
      ['id'],
    )
    .execute()

  // verification
  await db.schema
    .createTable('public.verification')
    .addColumn('id', 'text', col => col.primaryKey())
    .addColumn('identifier', 'text', col => col.notNull())
    .addColumn('value', 'text', col => col.notNull())
    .addColumn('expires_at', 'timestamp', col => col.notNull())
    .addColumn('created_at', 'timestamp')
    .addColumn('updated_at', 'timestamp')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('public.verification').execute()
  await db.schema.dropTable('public.account').execute()
  await db.schema.dropTable('public.session').execute()
  await db.schema.dropTable('public.user').execute()
  await db.schema.dropTable('public.interview_invite').execute()
  await db.schema.dropTable('public.interview').execute()
}
