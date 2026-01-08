import path from 'node:path'
import process from 'node:process'
import { app, BrowserWindow, shell } from 'electron'
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
  isMac,
} from './utils'

const PROTOCOL_SCHEME = 'webmoti-employ'
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL_SCHEME, process.execPath, [path.resolve(process.argv[1])])
  }
}
else {
  app.setAsDefaultProtocolClient(PROTOCOL_SCHEME)
}

let mainWindow: BrowserWindow | null = null

// the lock prevents a second app window from opening when handling custom protocol
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}
else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    await createWindow()
    if (!mainWindow)
      throw new Error('Main window not initialized')

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
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // only show after maximized
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
    setRendererReady(mainWindow!)
  })

  ipcOnMain('openExternalUrl', (_event, url: string) => {
    shell.openExternal(url)
  })

  return mainWindow
}

function handleDeepLink(url: string) {
  if (!mainWindow)
    return

  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== `${PROTOCOL_SCHEME}:`)
      return

    const token = parsedUrl.searchParams.get('authToken')
    if (!token) {
      console.error('Token not found')
      return
    }

    const redirectParam = `/?authToken=${encodeURIComponent(token)}`
    if (isDev) {
      mainWindow.loadURL(`http://${getLocalDomain()}${redirectParam}`)
    }
    else {
      mainWindow.loadURL(HOSTED_URL + redirectParam)
    }
  }
  catch (err) {
    console.error('Failed to parse deep link URL:', err)
  }
}

app.on('second-instance', (_event, commandLine) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized())
      mainWindow.restore()
    mainWindow.focus()
  }

  // the commandLine is array of strings in which last element is deep link url
  const url = commandLine.find(arg =>
    arg.startsWith(`${PROTOCOL_SCHEME}://`),
  )

  if (url) {
    handleDeepLink(url)
  }
})

// this is for mac
// https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app#macos-code
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

app.on('window-all-closed', () => {
  stopPythonServer()

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  if (!isMac()) {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
