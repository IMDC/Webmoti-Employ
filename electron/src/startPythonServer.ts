import { spawn } from 'node:child_process'
import path from 'node:path'
import { app } from 'electron'
import treeKill from 'tree-kill'

const PYTHON_SRC_FOLDER_NAME = 'python'
const PYTHON_EXE_NAME = 'eyetracker.exe'

let pythonProcess: ReturnType<typeof spawn> | null = null

export function stopPythonServer() {
  if (!pythonProcess)
    return

  const pid = pythonProcess.pid
  if (pid) {
    // eslint-disable-next-line no-console
    console.log('Stopping Python server...')
    // need to kill all processes in the tree since the parent is uv, not python
    treeKill(pid)
  }

  pythonProcess = null
}

function spawnPythonServer(cwd: string, command: string[]): Promise<void> {
  if (pythonProcess)
    return Promise.resolve()

  return new Promise((resolve, reject) => {
    pythonProcess = spawn(command[0], command.slice(1), {
      cwd,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    pythonProcess.stdout?.on('data', (data) => {
      const line = data.toString().trim()
      // eslint-disable-next-line no-console
      console.log(`[PYTHON] ${line}`)
      if (line.includes('Socket.IO server running'))
        resolve()
    })

    pythonProcess.stderr?.on('data', (data) => {
      console.error(`[PYTHON ERROR] ${data.toString().trim()}`)
    })

    pythonProcess.on('error', reject)
    pythonProcess.on('exit', (code) => {
      console.warn(`Python server exited with code ${code}`)
      pythonProcess = null
    })
  })
}

export function startLocalPythonServer() {
  const basePath = path.join(app.getAppPath(), PYTHON_SRC_FOLDER_NAME)
  return spawnPythonServer(basePath, ['uv', 'run', 'main.py'])
}

export function startPackagedPythonServer() {
  const resourcesDir = path.join(app.getAppPath(), '..', 'resources')
  const exePath = path.join(resourcesDir, PYTHON_EXE_NAME)
  return spawnPythonServer(path.dirname(exePath), [exePath])
}
