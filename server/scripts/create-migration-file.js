/* eslint-disable node/prefer-global/process */
import fs from 'node:fs'
import path from 'node:path'

// read migration description from command line
const description = process.argv[2]
if (!description) {
  console.error('Usage: node create-migration.js <description>')
  process.exit(1)
}

// format timestamp: YYYYMMDDHHMM
const now = new Date()
const pad = n => String(n).padStart(2, '0')
const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`

// generate filename
const fileName = `${timestamp}_${description.replace(/\s+/g, '_').toLowerCase()}.ts`
const migrationsDir = path.resolve('./src/db/migrations')
const filePath = path.join(migrationsDir, fileName)

// template for Kysely migration
const template = `import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // TODO: write migration here
}

export async function down(db: Kysely<any>): Promise<void> {
  // TODO: write rollback here
}
`

// ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true })
}

// create the file
fs.writeFileSync(filePath, template)
console.log('Created migration:', filePath)
