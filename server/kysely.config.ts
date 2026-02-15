import { defineConfig } from 'kysely-ctl'
import { getMigrationDb } from './src/db/getMigrationDb'

export default defineConfig({
  kysely: getMigrationDb(),
  migrations: {
    migrationFolder: 'src/db/migrations',
  },
})
