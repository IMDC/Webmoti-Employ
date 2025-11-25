import process from 'node:process'
import { app, BrowserWindow } from 'electron'
import { addLog, setRendererReady } from './logQueue'
import { setupSocket, socketSendBoundingBox } from './socket'
import { startLocalPythonServer, startPackagedPythonServer, stopPythonServer } from './startPythonServer'
import {
  getAppIconPath,
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
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })
  mainWindow.maximize()

  if (isDev) {
    mainWindow.setIcon(getAppIconPath())
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

  addLog(mainWindow, 'Starting python server...')
  try {
    if (isDev) {
      await startLocalPythonServer()
      addLog(mainWindow, 'Local Python server started successfully.')
    }
    else {
      await startPackagedPythonServer()
      addLog(mainWindow, 'Packaged Python server started successfully.')
    }
  }
  catch (error) {
    addLog(mainWindow, `Failed to start Python server: ${error}`)
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
