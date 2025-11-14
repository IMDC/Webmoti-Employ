import type { BrowserWindow } from 'electron'
import { io } from 'socket.io-client'
import z from 'zod'
import { logger } from './logger'
import { ipcWebContentsSend, isDev } from './utils'

let socket: ReturnType<typeof io>
let lastFeedbackLog = 0

// TODO: move this to @webmoti-employ/shared
const FeedbackSchema = z.array(z.object({
  feedbackType: z.enum(['fixation', 'speech', 'lookingAtInterviewer']),
  isActive: z.boolean(),
}))

const GazeStatsSchema = z.object({
  gazeOnInterviewerRatio: z.number().min(0).max(1),
  windowSeconds: z.number().positive(),
})

export function setupSocket(mainWindow: BrowserWindow) {
  socket = io('http://localhost:65432', {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    timeout: 1000,
  })

  socket.on('connect', () => {
    logger.log('Connected to Python Socket.IO server')
  })

  socket.on('feedback', (data) => {
    const parsed = FeedbackSchema.safeParse(data)
    if (!parsed.success) {
      logger.error('Invalid feedback payload:', z.flattenError(parsed.error))
      return
    }
    const feedback = parsed.data

    if (isDev) {
      const now = Date.now()
      if (now - lastFeedbackLog > 1000) {
        logger.log('Feedback received:', feedback)
        lastFeedbackLog = now
      }
    }

    ipcWebContentsSend('feedback', mainWindow.webContents, feedback)
  })

  socket.on('disconnect', () => {
    logger.warn('Disconnected from Python server')
  })

  socket.on('connect_error', (error) => {
    if (error.message.includes('xhr poll error')) {
      // suppress these messages because they only appear when socket isn't open yet
      logger.error('Connecting to socket...')
    }
    else {
      logger.error('Connection Error:', error.message)
    }
  })

  socket.on('gaze_stats', (data) => {
    const parsed = GazeStatsSchema.safeParse(data)
    if (!parsed.success) {
      logger.error('Invalid gaze_stats payload:', z.flattenError(parsed.error))
      return
    }
    const stats = parsed.data
    if (isDev) {
      const now = Date.now()
      if (now - lastFeedbackLog > 1000) {
        logger.log('Gaze stats:', stats)
      }
    }
    ipcWebContentsSend('gazeStats', mainWindow.webContents, stats)
  })
}

export function socketSendBoundingBox(boundingBox: FaceDetectionBoundingBox) {
  socket.emit('update_aoi', boundingBox)
}
