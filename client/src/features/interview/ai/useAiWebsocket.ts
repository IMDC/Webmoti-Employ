import type { TranscriptMessage } from '@webmoti-employ/shared'
import { NotificationMessage, WebSocketMessage } from '@webmoti-employ/shared'

import { useCallback, useRef, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { logger } from '@/utils/logger'
import { getLocalBearerToken } from '@/utils/utils'
import { useRoomName } from '../zoom/useZoomSessionStore'

export function useAiWebsocket() {
  const roomName = useRoomName()

  const [notification, setNotification] = useState<NotificationMessage>(
    // make empty message using defaults
    NotificationMessage.parse({}),
  )

  const protocol = import.meta.env.DEV ? 'ws' : 'wss'
  const host = import.meta.env.DEV
    ? 'localhost:8787'
    : import.meta.env.VITE_API_BASE_URL.replace(/^https?:\/\//, '')
  const socketUrl = `${protocol}://${host}/ws`

  // Buffer transcripts while the socket is not yet open (e.g., early messages on slow startup).
  const pendingQueueRef = useRef<WebSocketMessage[]>([])

  const {
    sendJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket<WebSocketMessage>(socketUrl, {
    queryParams: {
      token: encodeURIComponent(getLocalBearerToken() ?? ''),
      sessionId: roomName ?? '',
    },
    shouldReconnect: () => true,
    onMessage: event => handleMessage(event),
    onOpen: () => {
      // Flush any queued messages once the socket is ready.
      if (pendingQueueRef.current.length > 0) {
        const ws = getWebSocket()
        if (ws && ws.readyState === ReadyState.OPEN) {
          for (const msg of pendingQueueRef.current) {
            sendJsonMessage(msg)
          }
          pendingQueueRef.current = []
        }
      }
    },
  })

  const sendWebsocketMessage = useCallback((msg: WebSocketMessage) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage(msg)
    }
    else {
      // Queue messages until the socket opens; this avoids losing early transcripts.
      pendingQueueRef.current.push(msg)
      logger.warn('Websocket not ready yet; buffering message')
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
        setNotification((prev) => {
          const newPayload = Object.fromEntries(
            Object.entries(msg.payload).filter(([_, v]) => v !== null),
          )
          return { ...prev, ...newPayload }
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
