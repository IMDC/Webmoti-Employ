import path from 'node:path'
import process from 'node:process'
import { app, BrowserWindow } from 'electron'
// Importing net module to create a socket connection
// This assumes you have a Python server running that listens on port 65432
// Adjust the port as necessary to match your Python server configuration
import net from 'node:net';

const client = net.createConnection({ port: 65432 }, () => {
    console.log('✅ Connected to Python socket server');
});

client.on('data', (data) => {
    const received = JSON.parse(data.toString());
    console.log('🚀 Received from Python:', received);

    // Optionally, send response back
    client.write('Received your data, Python!');
});

client.on('end', () => {
    console.log('⚠️ Disconnected from Python server');
});

client.on('error', (error) => {
    console.error('❌ Socket Error:', error);
});
// end of socket connection code

const isDev = !app.isPackaged

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  })

  if (isDev) {
    // load vite dev server running in /client
    mainWindow.setIcon(path.join(__dirname, '..', 'icon.png'))
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  }
  else {
    // load built app from /client
    const distPath = path.join(app.getAppPath(), 'client', 'dist', 'index.html')
    mainWindow.loadFile(distPath)
  }
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
