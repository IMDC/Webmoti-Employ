/* eslint-disable node/prefer-global/process */
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import 'dotenv/config'

// also run if undefined
const shouldAlwaysRun = process.env.POSTINSTALL_CF_TYPEGEN !== 'false'

if (shouldAlwaysRun) {
  console.log('Postinstall always run is on')
}

if (shouldAlwaysRun || !existsSync('worker-configuration.d.ts')) {
  console.log('Running postinstall cf-typegen')
  execSync('pnpm run cf-typegen', { stdio: 'inherit' })
}
else {
  console.log('worker-configuration.d.ts exists, skipping cf-typegen.')
}
