import type { WebSocketMessage } from '@webmoti-employ/shared'
import { useCallback } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { logger } from '@/utils/logger'
import { useRoomName } from '../zoom/useZoomSessionStore'

export function useAiWebsocket() {
  const roomName = useRoomName()

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
      token: encodeURIComponent(localStorage.getItem('bearer_token') ?? ''),
      room: roomName ?? '',
    },
    shouldReconnect: () => true,
    onMessage: (event) => {
      try {
        const msg = JSON.parse(event.data) as WebSocketMessage
        if (msg.type === 'notification') {
          logger.log('Received notification:', msg.payload)
        }
      }
      catch (e) {
        logger.error('Failed to parse WS message', e)
      }
    },
  })

  const sendTranscript = useCallback(
    (transcript: string) => {
      if (readyState === ReadyState.OPEN) {
        const transcriptMsg: WebSocketMessage = {
          type: 'transcript',
          payload: {
            text: transcript,
          },
        }
        sendJsonMessage(transcriptMsg)
      }
      else {
        logger.error('Websocket is not ready to send transcript')
      }
    },
    [sendJsonMessage, readyState],
  )

  return {
    sendTranscript,
  }
}
