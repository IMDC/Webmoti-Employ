import type { Kysely } from 'kysely'
import type { DB } from '@/db/schema'

export async function getProfilesByIds(db: Kysely<DB>, ids: string[]) {
  if (ids.length === 0)
    return []

  return db
    .selectFrom('user')
    .select(['id', 'image', 'name', 'email'])
    .where('id', 'in', ids)
    .execute()
}

export async function getProfilesByEmails(db: Kysely<DB>, emails: string[]) {
  if (emails.length === 0)
    return []

  return db
    .selectFrom('user')
    .select(['id', 'image', 'name', 'email'])
    .where('email', 'in', emails)
    .execute()
}
