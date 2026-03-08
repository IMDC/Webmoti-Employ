import type { TranscriptMessage } from '@webmoti-employ/shared'
import type { NotificationState } from './NotificationState'
import { WebSocketMessage } from '@webmoti-employ/shared'

import { useCallback } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { logger } from '@/utils/logger'
import { getLocalBearerToken } from '@/utils/utils'
import { useRoomName } from '../zoom/useZoomSessionStore'

interface UseAiWebsocketOptions {
  /** Called with each raw notification from the server */
  onNotification: (notification: NotificationState) => void
}

/**
 * WebSocket transport for the AI interview assistant.
 * Handles connection, sending transcripts, and dispatching incoming notifications.
 */
export function useAiWebsocket({ onNotification }: UseAiWebsocketOptions) {
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

  const sendResetMessages = useCallback(() => {
    sendWebsocketMessage({ type: 'resetMessages' })
  }, [sendWebsocketMessage])

  function handleMessage(event: MessageEvent) {
    try {
      const parsed = JSON.parse(event.data)
      const result = WebSocketMessage.safeParse(parsed)
      if (!result.success) {
        logger.warn('Invalid WS message:', result.error)
        return
      }

      const msg = result.data
      if (msg.type === 'intervieweeNotification') {
        onNotification({ role: 'interviewee', ...msg.payload })
      }
      else if (msg.type === 'interviewerNotification') {
        onNotification({ role: 'interviewer', ...msg.payload })
      }
      else if (msg.type === 'reasoning') {
        logger.info('AI reasoning:', msg.payload)
      }
      else if (msg.type === 'broadcastTranscript') {
        logger.info('Transcript:', msg.payload)
      }
      else if (msg.type === 'ping') {
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
    sendResetMessages,
  }
}
