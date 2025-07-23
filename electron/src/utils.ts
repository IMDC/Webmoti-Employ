import type { WebContents, WebFrameMain } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, ipcMain } from 'electron'

export const isDev = !app.isPackaged

export function getPreloadPath() {
  return path.join(app.getAppPath(), isDev ? '.' : '..', '/dist/preload.cjs')
}

export function getUiPath() {
  return path.join(app.getAppPath(), 'client', 'dist', 'index.html')
}

export function getLocalDomain() {
  return 'localhost:5173'
}

function validateEventFrame(frame: WebFrameMain) {
  if (isDev && new URL(frame.url).host === getLocalDomain()) {
    return
  }
  const uiPath = pathToFileURL(getUiPath()).toString()
  if (!frame.url.startsWith(uiPath)) {
    throw new Error('Not valid event')
  }
}

export function ipcHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: () => EventPayloadMapping[Key],
) {
  ipcMain.handle(key, (event) => {
    if (!event.senderFrame) {
      console.warn('Sender frame is null')
      return
    }

    validateEventFrame(event.senderFrame)
    return handler()
  })
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key],
) {
  webContents.send(key, payload)
}
