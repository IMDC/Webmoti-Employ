import type { WebContents, WebFrameMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { app, ipcMain } from 'electron'

const envPath = path.join(app.getAppPath(), '.env.electron')
console.log('[DEBUG] Loading .env.electron from:', envPath)
console.log('[DEBUG] File exists:', fs.existsSync(envPath))
dotenv.config({ path: envPath })
const envHostedUrl = process.env.CLIENT_HOSTED_URL
console.log('[DEBUG] CLIENT_HOSTED_URL value:', envHostedUrl)
if (!envHostedUrl)
  throw new Error(`CLIENT_HOSTED_URL not set in .env.electron. Tried to load from: ${envPath}`)

export const HOSTED_URL: string = envHostedUrl

export const isDev = !app.isPackaged

export function getPreloadPath() {
  return path.join(app.getAppPath(), isDev ? '.' : '..', '/dist/preload.cjs')
}

function getModelPath() {
  return path.join(app.getAppPath(), isDev ? '.' : '..', 'models', 'blaze_face_short_range.tflite')
}

export function getModelBuffer(): ArrayBuffer {
  const modelPath = getModelPath()
  const buffer = fs.readFileSync(modelPath)
  // only return actual model data
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}

export function getLocalDomain() {
  return 'localhost:5173'
}

export function isWindows() {
  return process.platform === 'win32'
}
export function isMac() {
  return process.platform === 'darwin'
}
export function isLinux() {
  return process.platform === 'linux'
}

export function getAppIconPath() {
  const iconBase = path.join(app.getAppPath(), 'icon')

  if (isWindows()) {
    return path.join(iconBase, 'icon.ico')
  }
  else if (isMac()) {
    return path.join(iconBase, 'icon.icns')
  }
  else if (isLinux()) {
    return path.join(iconBase, 'icon.png')
  }

  return path.join(iconBase, 'icon.png')
}

function validateEventFrame(frame: WebFrameMain) {
  if (isDev && new URL(frame.url).host === getLocalDomain()) {
    return
  }
  if (!frame.url.startsWith(HOSTED_URL)) {
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

export function ipcOnMain<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (event: Electron.IpcMainEvent, payload: EventPayloadMapping[Key]) => void,
) {
  ipcMain.on(key, (event, payload) => handler(event, payload))
}
