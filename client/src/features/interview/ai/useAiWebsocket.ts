import type { TranscriptMessage, WebSocketMessage } from '@webmoti-employ/shared'
import { useCallback, useEffect } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

export function useAiWebsocket() {
  // const roomName = useRoomName()

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
    // queryParams: { identity },
    shouldReconnect: () => true,
  })

  const sendTranscript = useCallback(
    (msg: TranscriptMessage) => sendJsonMessage({ type: 'transcript', ...msg }),
    [sendJsonMessage],
  )

  useEffect(() => {
    if (!lastJsonMessage)
      return

    if (lastJsonMessage.type === 'notification') {
      console.log(lastJsonMessage.payload)
    }
  }, [lastJsonMessage])

  useEffect(() => {
    console.log('hi')

    if (readyState === ReadyState.OPEN) {
      sendTranscript({ text: 'hi' })
    }
  }, [readyState, sendTranscript])
}
