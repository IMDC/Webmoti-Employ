import type { BrowserWindow } from 'electron'
import { logger } from './logger'
import { ipcWebContentsSend } from './utils'

// if you send logs immediately to renderer, they will be lost.
// the log queue collects logs so that when "setRendererReady" is sent on ipc, all queued logs will then send
const logQueue: string[] = []
let isRendererReady = false

export function setRendererReady(window: BrowserWindow) {
  isRendererReady = true
  flushQueue(window)
}

export function addLog(window: BrowserWindow, log: string) {
  if (!isRendererReady) {
    logQueue.push(log)
  }
  else {
    sendLog(window, log)
  }
}

function flushQueue(window: BrowserWindow) {
  for (const msg of logQueue) {
    sendLog(window, msg)
  }
  logQueue.length = 0
}

async function sendLog(window: BrowserWindow, log: string) {
  // this function prints the log in the electron browser console
  logger.log(log)
  ipcWebContentsSend('log', window.webContents, log)
}
