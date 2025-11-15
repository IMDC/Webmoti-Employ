import { spawn } from 'node:child_process'
import path from 'node:path'
import { app } from 'electron'
import treeKill from 'tree-kill'
import { logger } from './logger'

const PYTHON_SRC_FOLDER_NAME = 'python'
const PYTHON_BINARY_PREFIX = 'eyetracker'
const PYTHON_STARTED_OUTPUT_STRING = 'STARTED_PYTHON_SERVER'

function getPythonBinaryName() {
  return process.platform === 'win32' ? `${PYTHON_BINARY_PREFIX}.exe` : PYTHON_BINARY_PREFIX
}

let pythonProcess: ReturnType<typeof spawn> | null = null

export function stopPythonServer() {
  if (!pythonProcess)
    return

  const pid = pythonProcess.pid
  if (pid) {
    logger.log('Stopping Python server...')
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
      logger.log(`[PYTHON] ${line}`)
      if (line.includes(PYTHON_STARTED_OUTPUT_STRING))
        resolve()
    })

    pythonProcess.stderr?.on('data', (data) => {
      logger.error(`[PYTHON ERROR] ${data.toString().trim()}`)
    })

    pythonProcess.on('error', reject)
    pythonProcess.on('exit', (code) => {
      logger.warn(`Python server exited with code ${code}`)
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
  const exePath = path.join(resourcesDir, getPythonBinaryName())
  return spawnPythonServer(resourcesDir, [exePath])
}
