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

async function waitForUrl(url: string, timeoutMs = 15000) {
  const start = Date.now()
  // Node 22 has global fetch
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok)
        return
    }
    catch {
      // ignore and retry
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
}

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

  // Google OAuth may block embedded browsers based on the Electron user-agent.
  // Remove the Electron token so Google treats this like a normal Chromium browser.
  const defaultUA = mainWindow.webContents.getUserAgent()
  const chromeLikeUA = defaultUA.replace(/\sElectron\/\S+/g, '')
  mainWindow.webContents.setUserAgent(chromeLikeUA)

  // Show the window when the page is ready to avoid white screen
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev) {
    mainWindow.setIcon(getAppIconPath())
    const url = `http://${getLocalDomain()}/`
    // When running `pnpm run dev:electron`, Vite and Electron start in parallel.
    // If Electron loads before Vite is listening, it can get stuck on a white screen.
    await waitForUrl(url)
    await mainWindow.loadURL(url)
    mainWindow.webContents.openDevTools()
  }
  else {
    await mainWindow.loadURL(HOSTED_URL)
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
