import path from 'node:path'
import process from 'node:process'
import { app, BrowserWindow } from 'electron'
import { addLog, setRendererReady } from './logQueue'
import { setupSocket, socketSendBoundingBox } from './socket'
import { startLocalPythonServer, startPackagedPythonServer, stopPythonServer } from './startPythonServer'
import {
  getLocalDomain,
  getModelBuffer,
  getPreloadPath,
  HOSTED_URL,
  ipcHandle,
  ipcOnMain,
  isDev,
} from './utils'

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
    socketSendBoundingBox(coordinates.boundingBox)
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
