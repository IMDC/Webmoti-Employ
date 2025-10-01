import type { TranscriptMessage, WebSocketMessage } from '@webmoti-employ/shared'
import { useCallback, useEffect } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

export function useAiWebsocket() {
  // const roomName = useRoomName()

  const {
    lastJsonMessage,
    sendJsonMessage,
    readyState,
  } = useWebSocket<WebSocketMessage>(`${import.meta.env.VITE_API_BASE_URL}/ai`, {
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
