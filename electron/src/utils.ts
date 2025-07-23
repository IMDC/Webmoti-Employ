import path from 'node:path'
import { app } from 'electron'

export const isDev = !app.isPackaged

export function getPreloadPath() {
  return path.join(
    app.getAppPath(),
    isDev ? '.' : '..',
    '/dist/preload.cjs',
  )
}
