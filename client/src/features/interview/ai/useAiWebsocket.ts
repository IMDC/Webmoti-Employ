import type { TranscriptMessage, WebSocketMessage } from '@webmoti-employ/shared'
import { useCallback, useEffect } from 'react'
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
    lastJsonMessage,
    sendJsonMessage,
    readyState,
  } = useWebSocket<WebSocketMessage>(socketUrl, {
    queryParams: {
      token: encodeURIComponent(localStorage.getItem('bearer_token') ?? ''),
      room: roomName ?? '',
    },
    shouldReconnect: () => true,
  })

  const sendTranscript = useCallback(
    (msg: TranscriptMessage) => {
      if (readyState === ReadyState.OPEN) {
        sendJsonMessage({ type: 'transcript', ...msg })
      }
      else {
        logger.error('Websocket is not ready to send transcript')
      }
    },
    [sendJsonMessage, readyState],
  )

  useEffect(() => {
    if (!lastJsonMessage)
      return

    if (lastJsonMessage.type === 'notification') {
      logger.log(lastJsonMessage.payload)
    }
  }, [lastJsonMessage])

  return {
    sendTranscript,
  }
}
