// https://dzone.com/articles/serverless-websocket-real-time-apps

import { WebSocketMessage } from '@webmoti-employ/shared'

export class AiRoom {
  private state: DurableObjectState
  private sessions: Set<WebSocket>

  constructor(state: DurableObjectState) {
    this.state = state
    this.sessions = new Set()
  }

  // Handles all incoming requests. We only care about WebSocket upgrades here.
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected a WebSocket upgrade request.', { status: 426 })
    }

    const { 0: client, 1: server } = new WebSocketPair()

    // Accept the connection and add the server-side WebSocket to our session list.
    this.state.acceptWebSocket(server)
    this.sessions.add(server)

    // console.log(`New WebSocket connection established. Total connections: ${this.sessions.size}`)

    // Return the client-side WebSocket back to the client.
    return new Response(null, { status: 101, webSocket: client })
  }

  // Handles messages received from any connected client.
  async webSocketMessage(_: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string')
      return

    try {
      const parsedMsg = JSON.parse(message)
      const websocketMsg = WebSocketMessage.parse(parsedMsg)
      // console.log(`Received message: ${parsedMessage.text}`)

      if (websocketMsg.type !== 'transcript') {
        return
      }

      // send test message after receiving transcript
      const notificationMessage: WebSocketMessage = {
        type: 'notification',
        payload: {
          'detail': false,
          'timer': 30,
          'filler-count': websocketMsg.payload.text.length,
        },
      }
      const serialized = JSON.stringify(notificationMessage)

      // Broadcast notification to all connected clients in the room.
      this.sessions.forEach((session) => {
        session.send(serialized)
      })
    }
    catch (e) {
      console.error('Failed to parse message:', e)
    }
  }

  // Cleans up a session when a WebSocket connection is closed.
  async webSocketClose(ws: WebSocket): Promise<void> {
    // console.log('WebSocket connection closed.')
    this.sessions.delete(ws)
    // console.log(`Total connections remaining: ${this.sessions.size}`)
  }

  // Handles errors on a WebSocket connection.
  async webSocketError(ws: WebSocket, error: any): Promise<void> {
    console.error('WebSocket error:', error)
    this.sessions.delete(ws)
  }
}
