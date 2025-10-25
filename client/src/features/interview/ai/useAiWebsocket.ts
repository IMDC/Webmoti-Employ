import type { TranscriptMessage } from '@webmoti-employ/shared'
import { NotificationMessage, WebSocketMessage } from '@webmoti-employ/shared'

import { useCallback, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useDevIsJohnDoNotUseThis, useUser } from '@/features/auth/hooks/useUserStore'
import { logger } from '@/utils/logger'
import { getLocalBearerToken } from '@/utils/utils'
import { useRoomName } from '../zoom/useZoomSessionStore'

export function useAiWebsocket() {
  const roomName = useRoomName()

  const user = useUser()
  const isJohn = useDevIsJohnDoNotUseThis()

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
      room: roomName ?? '',
    },
    shouldReconnect: () => true,
    onMessage: (event) => {
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
      }
      catch (e) {
        logger.error('Failed to parse WS message', e)
      }
    },
  })

  const sendWebsocketMessage = useCallback((msg: WebSocketMessage) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage(msg)
    }
    else {
      logger.error('Websocket is not ready to send transcript')
    }
  }, [readyState, sendJsonMessage])

  const sendTranscript = useCallback((transcript: TranscriptMessage) => {
    const modifiedTranscript: TranscriptMessage = {
      ...transcript,
      // dev override
      text: `${isJohn ? 'John Smith' : user.name}: ${transcript.text}`,
    }

    const transcriptMsg: WebSocketMessage = {
      type: 'transcript',
      payload: modifiedTranscript,
    }
    sendWebsocketMessage(transcriptMsg)
  }, [sendWebsocketMessage, user, isJohn])

  return {
    sendTranscript,
    notification,
  }
}
