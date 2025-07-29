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
  isDev,
} from './utils'

let socket: ReturnType<typeof io>

function setupSocket() {
  socket = io('http://localhost:65432')

  socket.on('connect', () => {
    // eslint-disable-next-line no-console
    console.log('✅ Connected to Python Socket.IO server')

    // Optionally send initial message upon connection
    socket.emit('electron_message', { greeting: 'Hello Python!' })
  })

  socket.on('python_data', (data) => {
    // eslint-disable-next-line no-console
    console.log('🚀 Received from Python:', data)
  })

  socket.on('disconnect', () => {
    // eslint-disable-next-line no-console
    console.log('⚠️ Disconnected from Python server')
  })

  socket.on('connect_error', (error) => {
    console.error('❌ Connection Error:', error)
  })
}

// end of socket connection code

function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
    },
    // only show after maximized
    show: false,
  })
  mainWindow.maximize()

  if (isDev) {
    // load vite dev server running in /client
    mainWindow.setIcon(path.join(app.getAppPath(), 'icon.png'))
    mainWindow.loadURL(`http://${getLocalDomain()}`)
    mainWindow.webContents.openDevTools()
  }
  else {
    // load built app from /client
    mainWindow.loadFile(getUiPath())
  }

  ipcHandle('getModelBuffer', getModelBuffer)

  setupSocket()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
