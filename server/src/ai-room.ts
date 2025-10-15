// https://dzone.com/articles/serverless-websocket-real-time-apps

import type { ModelMessage } from 'ai'
import { groq } from '@ai-sdk/groq'
import { NotificationMessage, WebSocketMessage } from '@webmoti-employ/shared'
import { generateText } from 'ai'

export class AiRoom {
  private state: DurableObjectState
  private sessions: Set<WebSocket>
  private messages: ModelMessage[]
  private pingInterval?: ReturnType<typeof setInterval>

  private generating = false
  private transcriptQueue: string[] = []

  private model = groq('meta-llama/llama-4-scout-17b-16e-instruct')

  private systemPrompt = `
    Virtual Interview Assistant Notification System

    For each transcript:

    1. Provide 1-2 concise sentences explaining the reasoning for the notification.  
      - Reasoning is based only on the transcript content.  
      - Ignore greetings or small talk; do not invent roles.  
      - Only responses to questions are evaluated for "detail". Questions themselves do not trigger "detail".

    2. Then provide a JSON object with three keys:
      - "detail": null if transcript is a question or irrelevant, false if response to a question lacks detail, true if response provides sufficient detail.
      - "fillerCount": number of filler words (0 if none).
      - "timer": estimated answer duration in seconds if transcript is a question, null otherwise.

    Always output reasoning first, then JSON on a new line.
    NEVER ACT AS A LANGUAGE MODEL AND ADDRESS THE USER. ONLY PROVIDE REASONING THEN JSON.
    EVEN IF THE TRANSCRIPT SEEMS IRRELEVANT TO THE INTERVIEW!
    DO NOT MAKE UP TRANSCRIPTS, JUST NOTIFY WITH NULL IF NOT RELEVANT.

    NOTE THAT PARTIAL TRANSCRIPTS MAY BE SENT IN REAL TIME. THE CURRENT TRANSCRIPT MAY BE LINKED TO THE ONES ABOVE.
    IF A FINAL TRANSCRIPT FOLLOWS A PARTIAL, IT IS A CONTINUATION OF THE PREVIOUS PARTIAL MESSAGE.

    For testing, assume both participants use the same transcript.

    Example outputs:

    Transcript is a greeting:  
    "Hello there."  
    {"detail": null, "fillerCount": 0, "timer": null}

    Transcript is a question:  
    "Tell me about yourself."  
    {"detail": null, "fillerCount": 0, "timer": 120}

    Transcript is a response lacking detail:  
    "I did some projects."  
    {"detail": false, "fillerCount": 0, "timer": null}

    Transcript is a detailed response:  
    "I led a project on X, faced Y challenge, and achieved Z outcome."  
    {"detail": true, "fillerCount": 0, "timer": null}
  `

  constructor(state: DurableObjectState) {
    this.state = state
    this.sessions = new Set()
    this.messages = []
    // add system prompt to beginning of message list
    this.messages.push({ role: 'system', content: this.systemPrompt })
    this.startPing()
  }

  private startPing() {
    if (this.pingInterval)
      return

    this.pingInterval = setInterval(() => {
      const pingMessage: WebSocketMessage = { type: 'ping' }
      this.broadcastMessage(pingMessage)
    }, 5000)
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = undefined
    }
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
    this.startPing()
    // console.log(`New WebSocket connection established. Total connections: ${this.sessions.size}`)
    // Return the client-side WebSocket back to the client.
    return new Response(null, { status: 101, webSocket: client })
  }

  async aiGenerateText() {
    const result = await generateText({ model: this.model, messages: this.messages })
    const responseText = result.text

    // TODO after adding debug logger, make this log instead
    // eslint-disable-next-line no-console
    console.log(responseText)

    // we need to store the response text as well so the ai knows what it's responded to
    this.messages.push({ role: 'assistant', content: responseText })
    return responseText
  }

  private async processQueue() {
    if (this.generating || this.transcriptQueue.length === 0)
      return

    this.generating = true

    // combine all queued transcripts into one message
    const transcript = this.transcriptQueue.join(' ')
    this.transcriptQueue = [] // clear the queue immediately
    // eslint-disable-next-line no-console
    console.log('Transcript:', transcript)

    try {
      this.messages.push({ role: 'user', content: transcript })
      const response = await this.aiGenerateText()
      await this.handleAiResponse(response)
    }
    finally {
      this.generating = false
      // recursively process any new transcripts that arrived during generation
      if (this.transcriptQueue.length > 0)
        await this.processQueue()
    }
  }

  private async handleAiResponse(response: string) {
    function getResponseObject(response: string) {
    // match first {...} JSON block
      const match = response.match(/\{[\s\S]*\}/)
      if (!match) {
        throw new Error('No JSON found in response')
      }
      return JSON.parse(match[0])
    }

    const notificationResult = NotificationMessage.safeParse(getResponseObject(response))

    if (!notificationResult.success) {
      console.error('Failed to parse generated notification:', notificationResult.error)
      console.error('Invalid generation is:', response)
      return
    }

    const notificationMessage: WebSocketMessage = {
      type: 'notification',
      payload: {
        detail: notificationResult.data.detail,
        timer: notificationResult.data.timer,
        fillerCount: notificationResult.data.fillerCount,
      },
    }

    // eslint-disable-next-line no-console
    console.log('Notification:', notificationMessage)
    this.broadcastMessage(notificationMessage)
  }

  // Handles messages received from any connected client.
  async webSocketMessage(_: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string')
      return

    try {
      const parsedMsg = JSON.parse(message)
      const websocketMsg = WebSocketMessage.parse(parsedMsg)
      // console.log(`Received message: ${parsedMessage.text}`)

      if (websocketMsg.type === 'transcript') {
        const payload = websocketMsg.payload
        this.transcriptQueue.push(`${payload.status}: ${payload.text}`)
        // don't await this
        void this.processQueue()
      }
    }
    catch (e) {
      console.error('Failed to parse message:', e)
    }
  }

  // Broadcast to all connected clients in the room.
  async broadcastMessage(message: WebSocketMessage) {
    this.sessions.forEach((session) => {
      session.send(JSON.stringify(message))
    })
  }

  // Cleans up a session when a WebSocket connection is closed.
  async webSocketClose(ws: WebSocket): Promise<void> {
    console.warn('WebSocket connection closed.')
    this.sessions.delete(ws)
    if (this.sessions.size === 0) {
      this.stopPing()
    }
    // console.log(`Total connections remaining: ${this.sessions.size}`)
  }

  // Handles errors on a WebSocket connection.
  async webSocketError(ws: WebSocket, error: any): Promise<void> {
    console.error('WebSocket error:', error)
    this.sessions.delete(ws)
  }
}
