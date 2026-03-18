import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // allowlist
  await db.schema
    .createTable('public.allowlist')
    .addColumn('id', 'integer', col => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('email', 'text', col => col.notNull().unique())
    .addColumn('added_by_id', 'varchar(128)', col => col.notNull())
    .addColumn('created_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addForeignKeyConstraint(
      'allowlist_added_by_id_fkey',
      ['added_by_id'],
      'public.user',
      ['id'],
      cb => cb.onUpdate('cascade').onDelete('cascade'),
    )
    .execute()

  // rename creator_id to host_id on interview table
  await db.schema
    .alterTable('public.interview')
    .renameColumn('creator_id', 'host_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('public.interview')
    .renameColumn('host_id', 'creator_id')
    .execute()

  await db.schema.dropTable('public.allowlist').execute()
}
