import type { TranscriptMessage } from '@webmoti-employ/shared'
import { NotificationMessage, WebSocketMessage } from '@webmoti-employ/shared'

import { useCallback, useState } from 'react'
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
        setNotification((prev) => {
          const incoming = msg.payload

          // New topic: reset accumulators
          if (incoming.newTopic) {
            return {
              hint: incoming.hint,
              isQuestion: incoming.isQuestion,
              fillerCount: incoming.fillerCount,
              newTopic: true,
            }
          }

          // Same topic: accumulate feedback to avoid flicker
          return {
            // Keep latest non-empty hints; preserve previous when AI sends []
            hint: incoming.hint.length > 0 ? incoming.hint : prev.hint,
            // Sticky within a topic: once a question is detected, keep it true
            // so the countup timer doesn't reset mid-answer
            isQuestion: prev.isQuestion || incoming.isQuestion,
            // Sum filler counts across the topic
            fillerCount: prev.fillerCount + incoming.fillerCount,
            // Only true on the first notification of a new topic
            newTopic: false,
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
