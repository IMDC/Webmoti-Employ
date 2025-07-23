import type { WebContents } from 'electron'
import path from 'node:path'
import { app, ipcMain } from 'electron'

export const isDev = !app.isPackaged

export function getPreloadPath() {
  return path.join(
    app.getAppPath(),
    isDev ? '.' : '..',
    '/dist/preload.cjs',
  )
}

export function ipcHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: () => EventPayloadMapping[Key],
) {
  ipcMain.handle(key, () => handler())
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key],
) {
  webContents.send(key, payload)
}
