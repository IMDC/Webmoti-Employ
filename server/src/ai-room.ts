// https://dzone.com/articles/serverless-websocket-real-time-apps

import type { CoreMessage } from 'ai'
import { WebSocketMessage } from '@webmoti-employ/shared'

export class AiRoom {
  private state: DurableObjectState
  private env: CloudflareBindings
  private sessions: Set<WebSocket>
  private messages: CoreMessage[]

  private systemPrompt = `
    Virtual Interview Assistant Notification System

    Notifications are in JSON format. Only provide the notification JSON as your response.

    Rules:
        Insufficient detail/context: {"detail": true} if insufficient detail provided when responding to a question.
        Filler words: count and notify with {"filler-count": <count>}. (Like, Um, You know...)
        Question asked: estimate answer duration and notify with {"timer": <seconds>}.
        Ongoing response: don't notify (except filler words) if user still talking.
        No notification: return {"detail": null, "filler-count": null, "timer": null} if no issues. This is important. So if nothing to notify about, just say null for the keys that there is nothing for.

    Notification format: {"detail": [true/null], "filler-count": [count/null], "timer": [seconds/null]}
  `

  constructor(state: DurableObjectState, env: CloudflareBindings) {
    this.state = state
    this.env = env
    this.sessions = new Set()
    this.messages = []

    // add system prompt to beginning of message list
    this.messages.push({ role: 'system', content: this.systemPrompt })
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

      const transcriptText = websocketMsg.payload.text

      this.messages.push({ role: 'user', content: transcriptText })

      // TODO: call ai here with groq key
      // eslint-disable-next-line ts/no-unused-expressions
      this.env.GROQ_API_KEY
      // const response = await aiGenerateText(this.env.GROQ_API_KEY, this.messages)
      // we need to store the response text as well so the ai knows what it's responded to
      // this.messages.push({ role: 'assistant', content: response })

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
