import path from 'node:path'
import process from 'node:process'
import { app, BrowserWindow } from 'electron'
import { io } from 'socket.io-client'
import {
  getLocalDomain,
  getModelBuffer,
  getPreloadPath,
  getUiPath,
  ipcHandle,
  ipcOnMain,
  isDev,
} from './utils'

let socket: ReturnType<typeof io>

function setupSocket(mainWindow: BrowserWindow) {
  socket = io('http://localhost:65432')

  socket.on('connect', () => {
    // eslint-disable-next-line no-console
    console.log('✅ Connected to Python Socket.IO server')
  })

  socket.on('gaze_data', (data) => {
    // eslint-disable-next-line no-console
    console.log('🚀 Received gaze data from Python:', data)
    // Forward data to renderer (frontend React app) if needed
    mainWindow.webContents.send('gaze_data', data)
  })

  socket.on('disconnect', () => {
    // eslint-disable-next-line no-console
    console.log('⚠️ Disconnected from Python server')
  })

  socket.on('connect_error', (error) => {
    console.error('❌ Connection Error:', error)
  })

  // Listen for updates from frontend renderer (React app)
  ipcOnMain('coordinates', (_event, coordinates) => {
    socket.emit('update_aoi', coordinates.boundingBox)
  })
}

function createWindow() {
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
