import type { AppContext } from '../..'
import type { DB } from '../../db/schema'
import type { Kysely } from 'kysely'

export async function getAllowlist(db: Kysely<DB>) {
  return await db
    .selectFrom('allowlist')
    .select(['id', 'email', 'addedById', 'createdAt'])
    .orderBy('createdAt', 'desc')
    .execute()
}

export async function addToAllowlist(db: Kysely<DB>, email: string, addedById: string) {
  return await db
    .insertInto('allowlist')
    .values({ email: email.toLowerCase(), addedById })
    .returning(['id', 'email', 'addedById', 'createdAt'])
    .executeTakeFirstOrThrow()
}

export async function removeFromAllowlist(db: Kysely<DB>, id: number) {
  return await db
    .deleteFrom('allowlist')
    .where('id', '=', id)
    .executeTakeFirstOrThrow()
}

export async function getAllUsers(db: Kysely<DB>) {
  return await db
    .selectFrom('user')
    .select(['id', 'email', 'name', 'image', 'createdAt'])
    .orderBy('createdAt', 'desc')
    .execute()
}
