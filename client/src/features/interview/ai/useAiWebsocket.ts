import type { TranscriptMessage } from '@webmoti-employ/shared'
import { NotificationMessage, WebSocketMessage } from '@webmoti-employ/shared'

import { useCallback, useRef, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { logger } from '@/utils/logger'
import { getLocalBearerToken } from '@/utils/utils'
import { useRoomName } from '../zoom/useZoomSessionStore'

/** Number of recent notifications to consider for filler percentage */
const FILLER_WINDOW_SIZE = 5

export function useAiWebsocket() {
  const roomName = useRoomName()

  const [notification, setNotification] = useState<NotificationMessage>(
    // make empty message using defaults
    NotificationMessage.parse({}),
  )

  // Ring buffer of recent { fillerCount, wordCount } for sliding window
  const recentRef = useRef<{ fillerCount: number, wordCount: number }[]>([])

  const protocol = import.meta.env.DEV ? 'ws' : 'wss'
  const host = import.meta.env.DEV
    ? 'localhost:8787'
    : import.meta.env.VITE_API_BASE_URL.replace(/^https?:\/\//, '')
  const socketUrl = `${protocol}://${host}/ws`

  const {
    sendJsonMessage,
    readyState,
  } = useWebSocket<WebSocketMessage>(socketUrl, {
    queryParams: {
      token: encodeURIComponent(getLocalBearerToken() ?? ''),
      sessionId: roomName ?? '',
    },
    shouldReconnect: () => true,
    onMessage: event => handleMessage(event),
  })

  const sendWebsocketMessage = useCallback((msg: WebSocketMessage) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage(msg)
    }
    else {
      logger.warn('Websocket is not ready to send transcript')
    }
  }, [readyState, sendJsonMessage])

  const sendTranscript = useCallback((transcript: TranscriptMessage) => {
    const websocketMsg: WebSocketMessage = {
      type: 'transcript',
      payload: transcript,
    }
    sendWebsocketMessage(websocketMsg)
  }, [sendWebsocketMessage])

  const sendDevIsJohnDoNotUseMessage = useCallback((isJohn: boolean, isInterviewer: boolean) => {
    const websocketMsg: WebSocketMessage = {
      type: 'devIsJohnDoNotUseThis',
      payload: { isJohn, isInterviewer },
    }
    sendWebsocketMessage(websocketMsg)
  }, [sendWebsocketMessage])

  function handleMessage(event: MessageEvent) {
    // logger.log('received message!')

    try {
      const parsed = JSON.parse(event.data)
      const result = WebSocketMessage.safeParse(parsed)
      if (!result.success) {
        logger.warn('Invalid WS message:', result.error)
        return
      }

      const msg = result.data
      if (msg.type === 'notification') {
        const incoming = msg.payload

        // Update sliding window outside of state updater to avoid double-mutation
        if (incoming.newTopic) {
          recentRef.current = [{ fillerCount: incoming.fillerCount, wordCount: incoming.wordCount }]
        }
        else {
          recentRef.current.push({ fillerCount: incoming.fillerCount, wordCount: incoming.wordCount })
          if (recentRef.current.length > FILLER_WINDOW_SIZE) {
            recentRef.current.shift()
          }
        }

        // Sum the window
        let totalFillers = 0
        let totalWords = 0
        for (const entry of recentRef.current) {
          totalFillers += entry.fillerCount
          totalWords += entry.wordCount
        }

        setNotification((prev) => {
          if (incoming.newTopic) {
            return {
              hint: incoming.hint,
              isQuestion: incoming.isQuestion,
              fillerCount: totalFillers,
              wordCount: totalWords,
              newTopic: true,
              offTopic: false,
            }
          }

          return {
            hint: incoming.hint.length > 0 ? incoming.hint : prev.hint,
            isQuestion: prev.isQuestion || incoming.isQuestion,
            fillerCount: totalFillers,
            wordCount: totalWords,
            newTopic: false,
            offTopic: incoming.offTopic,
          }
        })
        logger.log('Received notification:', msg.payload)
      }
      else if (msg.type === 'ping') {
        // send back after receiving it.
        // this should keep the connection warm to prevent delays
        sendWebsocketMessage({ type: 'pong' })
      }
    }
    catch (e) {
      logger.error('Failed to parse WS message', e)
    }
  }

  return {
    sendTranscript,
    sendDevIsJohnDoNotUseMessage,
    notification,
  }
}
