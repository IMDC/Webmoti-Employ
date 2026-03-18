import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // make added_by_id nullable so allowlist entries survive when the adder is deleted
  await db.schema
    .alterTable('public.allowlist')
    .alterColumn('added_by_id', cb => cb.dropNotNull())
    .execute()

  // change FK from cascade to set null
  await db.schema
    .alterTable('public.allowlist')
    .dropConstraint('allowlist_added_by_id_fkey')
    .execute()

  await db.schema
    .alterTable('public.allowlist')
    .addForeignKeyConstraint(
      'allowlist_added_by_id_fkey',
      ['added_by_id'],
      'public.user',
      ['id'],
      cb => cb.onUpdate('cascade').onDelete('set null'),
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('public.allowlist')
    .dropConstraint('allowlist_added_by_id_fkey')
    .execute()

  await db.schema
    .alterTable('public.allowlist')
    .addForeignKeyConstraint(
      'allowlist_added_by_id_fkey',
      ['added_by_id'],
      'public.user',
      ['id'],
      cb => cb.onUpdate('cascade').onDelete('cascade'),
    )
    .execute()

  await db.schema
    .alterTable('public.allowlist')
    .alterColumn('added_by_id', cb => cb.setNotNull())
    .execute()
}
