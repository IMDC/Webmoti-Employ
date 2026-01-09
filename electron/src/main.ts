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
  ipcWebContentsSend,
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
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    minWidth: 576, // prevent shrinking too small and messing up the ui
    minHeight: 576,
    titleBarStyle: 'hidden', // remove the default titlebar
    // expose window controls in Windows/Linux
    ...(!isMac()
      ? {
          // add system buttons (minimize, restore, close)
          titleBarOverlay: {
            color: '#00000000', // transparent background
            symbolColor: '#ffffff',
            height: 40, // this should be the same height as the client toolbar
          },
        }
      : {}),
    show: false, // only show after maximized
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // start maximized. this also makes the window show
  mainWindow.maximize()

  if (isDev) {
    mainWindow.setIcon(getAppIconPath())
    mainWindow.loadURL(`http://${getLocalDomain()}`)
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
    try {
      const parsedUrl = new URL(url)
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        shell.openExternal(parsedUrl.toString())
      }
      else {
        console.error('Blocked attempt to open URL with disallowed protocol:', url)
      }
    }
    catch (err) {
      console.error('Failed to parse URL in openExternalUrl handler:', err)
    }
  })

  const wc = mainWindow.webContents

  function sendNavState() {
    ipcWebContentsSend(
      'navigationState',
      wc,
      {
        canGoBack: wc.navigationHistory.canGoBack(),
        canGoForward: wc.navigationHistory.canGoForward(),
      },
    )
  }

  // update whenever navigation happens
  wc.once('did-finish-load', sendNavState)
  wc.on('did-navigate', sendNavState)
  wc.on('did-navigate-in-page', sendNavState)

  // toolbar controls
  ipcOnMain('reloadWindow', () => mainWindow!.reload())
  ipcOnMain('goBackWindow', () => {
    if (wc.navigationHistory.canGoBack())
      wc.navigationHistory.goBack()
  })
  ipcOnMain('goForwardWindow', () => {
    if (wc.navigationHistory.canGoForward())
      wc.navigationHistory.goForward()
  })
  ipcOnMain('toggleConsoleWindow', () => {
    if (wc.isDevToolsOpened())
      wc.closeDevTools()
    else wc.openDevTools({ mode: 'bottom' })
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
