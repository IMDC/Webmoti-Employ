import path from 'node:path'
import process from 'node:process'
import { app, BrowserWindow } from 'electron'
import { io } from 'socket.io-client'
import z from 'zod'
import { logger } from './logger'
import { startLocalPythonServer, startPackagedPythonServer, stopPythonServer } from './startPythonServer'
import {
  getLocalDomain,
  getModelBuffer,
  getPreloadPath,
  HOSTED_URL,
  ipcHandle,
  ipcOnMain,
  ipcWebContentsSend,
  isDev,
} from './utils'

// TODO: move this to @webmoti-employ/shared
const FeedbackSchema = z.array(z.object({
  feedbackType: z.enum(['fixation', 'speech', 'lookingAtInterviewer']),
  isActive: z.boolean(),
}))

const GazeStatsSchema = z.object({
  gazeOnInterviewerRatio: z.number().min(0).max(1),
  windowSeconds: z.number().positive(),
})

let socket: ReturnType<typeof io>
let lastFeedbackLog = 0

function setupSocket(mainWindow: BrowserWindow) {
  socket = io('http://localhost:65432', {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    timeout: 1000,
  })

  socket.on('connect', () => {
    logger.log('Connected to Python Socket.IO server')
  })

  socket.on('feedback', (data) => {
    const parsed = FeedbackSchema.safeParse(data)
    if (!parsed.success) {
      console.error('Invalid feedback payload:', z.flattenError(parsed.error))
      return
    }
    const feedback = parsed.data

    if (isDev) {
      const now = Date.now()
      if (now - lastFeedbackLog > 1000) {
        logger.log('Feedback received:', feedback)
        lastFeedbackLog = now
      }
    }

    ipcWebContentsSend('feedback', mainWindow.webContents, feedback)
  })

  socket.on('disconnect', () => {
    console.warn('Disconnected from Python server')
  })

  socket.on('connect_error', (error) => {
    console.error('Connection Error:', error.message)
  })

  socket.on('gaze_stats', (data) => {
    const parsed = GazeStatsSchema.safeParse(data)
    if (!parsed.success) {
      console.error('Invalid gaze_stats payload:', z.flattenError(parsed.error))
      return
    }
    const stats = parsed.data
    if (isDev) {
      const now = Date.now()
      if (now - lastFeedbackLog > 1000) {
        logger.log('Gaze stats:', stats)
      }
    }
    ipcWebContentsSend('gazeStats', mainWindow.webContents, stats)
  })
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
    },
    show: false,
  })
  mainWindow.maximize()

  if (isDev) {
    mainWindow.setIcon(path.join(app.getAppPath(), 'icon.png'))
    mainWindow.loadURL(`http://${getLocalDomain()}`)
    mainWindow.webContents.openDevTools()
    await startLocalPythonServer()
  }
  else {
    mainWindow.loadURL(HOSTED_URL)
    await startPackagedPythonServer()
  }

  ipcHandle('getModelBuffer', getModelBuffer)

  // Listen for updates from frontend renderer (React app)
  ipcOnMain('coordinates', (_event, coordinates) => {
    socket.emit('update_aoi', coordinates.boundingBox)
  })

  return mainWindow
}

app.on('ready', async () => {
  const mainWindow = await createWindow()
  setupSocket(mainWindow)
})

app.on('window-all-closed', () => {
  stopPythonServer()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
