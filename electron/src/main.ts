import path from 'node:path'
import process from 'node:process'
import { app, BrowserWindow } from 'electron'
import { io } from 'socket.io-client'
import z from 'zod'
import { startPythonServer } from './startPythonServer'
import {
  getLocalDomain,
  getModelBuffer,
  getPreloadPath,
  getUiPath,
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

let socket: ReturnType<typeof io>

function setupSocket(mainWindow: BrowserWindow) {
  socket = io('http://localhost:65432')

  socket.on('connect', () => {
    // eslint-disable-next-line no-console
    console.log('Connected to Python Socket.IO server')
  })

  socket.on('feedback', (data) => {
    const parsed = FeedbackSchema.safeParse(data)
    if (!parsed.success) {
      console.error('Invalid feedback payload:', z.flattenError(parsed.error))
      return
    }
    const feedback = parsed.data

    // eslint-disable-next-line no-console
    console.log('feedback:', feedback)

    ipcWebContentsSend('feedback', mainWindow.webContents, feedback)
  })

  socket.on('disconnect', () => {
    console.warn('Disconnected from Python server')
  })

  socket.on('connect_error', (error) => {
    console.error('Connection Error:', error)
  })

  // Listen for updates from frontend renderer (React app)
  ipcOnMain('coordinates', (_event, coordinates) => {
    socket.emit('update_aoi', coordinates.boundingBox)
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
    mainWindow.loadFile(getUiPath())
  }

  ipcHandle('getModelBuffer', getModelBuffer)

  await startPythonServer()
  setupSocket(mainWindow)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
