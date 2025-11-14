import path from 'node:path'
import process from 'node:process'
import { app, BrowserWindow } from 'electron'
import { io } from 'socket.io-client'
import z from 'zod'
import { logger } from './logger'
import { addLog, setRendererReady } from './logQueue'
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
      logger.error('Invalid feedback payload:', z.flattenError(parsed.error))
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
    logger.warn('Disconnected from Python server')
  })

  socket.on('connect_error', (error) => {
    if (error.message.includes('xhr poll error')) {
      // suppress these messages because they only appear when socket isn't open yet
      logger.error('Connecting to socket...')
    }
    else {
      logger.error('Connection Error:', error.message)
    }
  })

  socket.on('gaze_stats', (data) => {
    const parsed = GazeStatsSchema.safeParse(data)
    if (!parsed.success) {
      logger.error('Invalid gaze_stats payload:', z.flattenError(parsed.error))
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
  }
  else {
    mainWindow.loadURL(HOSTED_URL)
  }

  ipcHandle('getModelBuffer', getModelBuffer)

  // Listen for updates from frontend renderer (React app)
  ipcOnMain('coordinates', (_event, coordinates) => {
    socket.emit('update_aoi', coordinates.boundingBox)
  })

  ipcOnMain('setRendererReady', (_event) => {
    setRendererReady(mainWindow)
  })

  return mainWindow
}

app.on('ready', async () => {
  const mainWindow = await createWindow()
  setupSocket(mainWindow)

  if (isDev) {
    try {
      await startLocalPythonServer()
      addLog(mainWindow, 'Local Python server started successfully.')
    }
    catch (err) {
      addLog(mainWindow, `Failed to start local Python server: ${err}`)
    }
  }
  else {
    try {
      await startPackagedPythonServer()
      addLog(mainWindow, 'Packaged Python server started successfully.')
    }
    catch (err) {
      addLog(mainWindow, `Failed to start packaged Python server: ${err}`)
    }
  }
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
