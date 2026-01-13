const { execSync } = require('node:child_process')
const { existsSync, readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')

const ROOT = resolve(__dirname, '..')
const ENV_PATH = resolve(ROOT, '.env.electron')
const PKG_PATH = resolve(ROOT, 'package.json')

// read existing file if it exists
const existing = existsSync(ENV_PATH)
  ? readFileSync(ENV_PATH, 'utf-8')
  : ''

// parse existing lines into a map
const lines = existing.split('\n')
const env = new Map()

for (const line of lines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#'))
    continue

  const idx = trimmed.indexOf('=')
  if (idx === -1)
    continue

  const key = trimmed.slice(0, idx)
  const value = trimmed.slice(idx + 1)
  env.set(key, value)
}

// read version from package.json
const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf-8'))
const version = pkg.version

let sha = 'unknown'
let gitCommitDate = 'unknown'
try {
  const resolvedSha = execSync('git rev-parse --short HEAD').toString().trim()
  const rawDate = execSync(`git show -s --format=%ci ${resolvedSha}`).toString().trim()
  sha = resolvedSha || 'unknown'
  gitCommitDate = new Date(rawDate).toISOString()
}
catch {}

// overwrite only our keys
env.set('ELECTRON_APP_VERSION', version)
env.set('ELECTRON_GIT_SHA', sha)
env.set('ELECTRON_GIT_COMMIT_DATE', gitCommitDate)
env.set('ELECTRON_BUILD_DATE', new Date().toISOString())

// serialize back to file
const output
  = `${Array.from(env.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')}\n`

writeFileSync(ENV_PATH, output)
