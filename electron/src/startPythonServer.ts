import { spawn } from 'node:child_process'
import path from 'node:path'
import { app } from 'electron'

let pythonProcess: ReturnType<typeof spawn> | null = null

export function stopPythonServer() {
  if (pythonProcess) {
    pythonProcess.kill()
    pythonProcess = null
  }
}

export function startPythonServer(): Promise<void> {
  if (pythonProcess) {
    console.warn('Python server already running.')
    return Promise.resolve()
  }

  const basePath = path.join(app.getAppPath(), 'python')

  return new Promise((resolve, reject) => {
    // TODO: This will only work locally. For the actual app, need to
    // bundle python and deps with app, and run that
    pythonProcess = spawn('uv', ['run', 'main.py'], {
      cwd: basePath,
      // eslint-disable-next-line node/prefer-global/process
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    pythonProcess.stdout?.on('data', (data) => {
      const line = data.toString().trim()
      // eslint-disable-next-line no-console
      console.log(`[PYTHON] ${line}`)
      if (line.includes('Socket.IO server running')) {
        resolve()
      }
    })

    pythonProcess.stderr?.on('data', (data) => {
      console.error(`[PYTHON ERROR] ${data.toString().trim()}`)
    })

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err)
      reject(err)
    })

    pythonProcess.on('exit', (code) => {
      console.warn(`Python server exited with code ${code}`)
      pythonProcess = null
    })
  })
}
