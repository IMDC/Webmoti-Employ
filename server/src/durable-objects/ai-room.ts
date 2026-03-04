// https://dzone.com/articles/serverless-websocket-real-time-apps

import type { NotificationMessage } from '@webmoti-employ/shared'
import type { ModelMessage } from 'ai'
import { groq } from '@ai-sdk/groq'
import { WebSocketMessage } from '@webmoti-employ/shared'
import { generateText } from 'ai'
import { debugLog } from '@/utils/logger'
import { SYSTEM_PROMPT } from './ai-prompt'
import { countWords, parseAiResponse } from './ai-room-utils'

interface Session {
  name: string
  isInterviewer: boolean
}

interface QueuedTranscript {
  text: string
  isInterviewer: boolean
  status: 'partial' | 'final'
  enqueuedAt: number
}

export class AiRoom {
  private state: DurableObjectState
  private env: CloudflareBindings

  private sessions = new Map<WebSocket, Session>()
  private messages: ModelMessage[] = []
  private pingInterval?: ReturnType<typeof setInterval>

  private devIsJohnDoNotUseThis = false
  private devIsJohnInterviewer = false

  private generating = false
  private transcriptQueue: QueuedTranscript[] = []

  private model = groq('meta-llama/llama-4-scout-17b-16e-instruct')

  constructor(state: DurableObjectState, env: CloudflareBindings) {
    this.state = state
    this.env = env
    // add system prompt to beginning of message list
    this.messages.push({ role: 'system', content: SYSTEM_PROMPT })
    this.startPing()
  }

  // ── WebSocket lifecycle ──────────────────────────────────────────────

  // Handles all incoming requests. We only care about WebSocket upgrades here.
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected a WebSocket upgrade request.', { status: 426 })
    }

    const { 0: client, 1: server } = new WebSocketPair()
    // Accept the connection and add the server-side WebSocket to our session list.
    this.state.acceptWebSocket(server)

    const isInterviewer = request.headers.get('x-is-interviewer') === 'true'
    const name = request.headers.get('x-name') ?? ''
    this.sessions.set(server, { name, isInterviewer })

    this.startPing()
    // debugLog(`New WebSocket connection established. Total connections: ${this.sessions.size}`)
    // Return the client-side WebSocket back to the client.
    return new Response(null, { status: 101, webSocket: client })
  }

  // Handles messages received from any connected client.
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string')
      return

    try {
      const parsedMsg = JSON.parse(message)
      const websocketMsg = WebSocketMessage.parse(parsedMsg)
      // debugLog(`Received message: ${parsedMessage.text}`)

      if (websocketMsg.type === 'transcript') {
        this.handleTranscript(ws, websocketMsg.payload)
      }
      else if (websocketMsg.type === 'devIsJohnDoNotUseThis') {
        const payload = websocketMsg.payload
        this.devIsJohnDoNotUseThis = payload.isJohn
        this.devIsJohnInterviewer = payload.isInterviewer
      }
      // else if (websocketMsg.type === 'pong') {
      //   debugLog('client sent pong')
      // }
    }
    catch (e) {
      console.error('Failed to parse message:', e)
    }
  }

  // Cleans up a session when a WebSocket connection is closed.
  async webSocketClose(ws: WebSocket): Promise<void> {
    console.warn('WebSocket connection closed.')
    this.sessions.delete(ws)
    if (this.sessions.size === 0) {
      this.stopPing()
    }
    // debugLog(`Total connections remaining: ${this.sessions.size}`)
  }

  // Handles errors on a WebSocket connection.
  async webSocketError(ws: WebSocket, error: any): Promise<void> {
    console.error('WebSocket error:', error)
    this.sessions.delete(ws)
  }

  // ── Transcript handling ──────────────────────────────────────────────

  private handleTranscript(ws: WebSocket, payload: { text: string, status: 'partial' | 'final' }) {
    let name = this.sessions.get(ws)?.name ?? ''
    let role: 'interviewer' | 'interviewee'
      = this.sessions.get(ws)?.isInterviewer ? 'interviewer' : 'interviewee'

    if (this.devIsJohnDoNotUseThis) {
      // dev override
      role = this.devIsJohnInterviewer ? 'interviewer' : 'interviewee'
      name = 'John Smith'
    }

    // Format: [role] name: transcript text
    // e.g., "[interviewer] John Smith: Tell me about yourself"
    const formatted = `[${role}] ${name}: ${payload.text}`
    this.transcriptQueue.push({
      text: formatted,
      isInterviewer: role === 'interviewer',
      status: payload.status,
      enqueuedAt: Date.now(),
    })
    // don't await this
    void this.processQueue()
  }

  private async processQueue() {
    if (this.generating || this.transcriptQueue.length === 0)
      return

    this.generating = true

    const queued = this.transcriptQueue
    this.transcriptQueue = [] // clear the queue immediately

    // combine all queued transcripts into one message for the AI
    const transcript = queued.map(q => q.text).join(' ')
    debugLog(this.env.IS_DEV, 'Transcript:', transcript)

    // Count only interviewee words so the denominator matches filler-counting rules
    const wordCount = countWords(
      queued.filter(q => !q.isInterviewer).map(q => q.text),
    )

    try {
      this.messages.push({ role: 'user', content: transcript })
      const response = await this.generateAiResponse()
      await this.handleAiResponse(response, wordCount)
    }
    finally {
      this.generating = false
      // recursively process any new transcripts that arrived during generation
      if (this.transcriptQueue.length > 0)
        await this.processQueue()
    }
  }

  // ── AI generation ────────────────────────────────────────────────────

  private async generateAiResponse() {
    const result = await generateText({ model: this.model, messages: this.messages })
    const responseText = result.text

    debugLog(this.env.IS_DEV, responseText)

    // we need to store the response text as well so the ai knows what it's responded to
    this.messages.push({ role: 'assistant', content: responseText })
    return responseText
  }

  private async handleAiResponse(response: string, wordCount: number) {
    const { reasoningText, notification } = parseAiResponse(response, wordCount)

    // broadcast reasoning text if we extracted any
    if (reasoningText) {
      const reasoningMsg: WebSocketMessage = {
        type: 'reasoning',
        payload: reasoningText,
      }
      await this.broadcastMessage(reasoningMsg)
    }

    if (notification) {
      this.notifyClients(notification)
    }
  }

  // ── Broadcasting ─────────────────────────────────────────────────────

  // Broadcast to all connected clients in the room.
  private async broadcastMessage(message: WebSocketMessage) {
    this.sessions.forEach((_, session) => {
      session.send(JSON.stringify(message))
    })
  }

  private notifyClients(payload: NotificationMessage) {
    let notifiedCount = 0
    this.sessions.forEach(({ isInterviewer: sessionIsInterviewer }, ws) => {
      // In dev mode, use the dev override role instead of the session's actual role
      const isInterviewer = this.devIsJohnDoNotUseThis
        ? this.devIsJohnInterviewer
        : sessionIsInterviewer

      // Interviewers only receive hints — strip filler data and off-topic
      const sessionPayload: NotificationMessage = isInterviewer
        ? { ...payload, fillerCount: 0, wordCount: 0, offTopic: false }
        : payload

      const notificationMessage: WebSocketMessage = {
        type: 'notification',
        payload: sessionPayload,
      }

      ws.send(JSON.stringify(notificationMessage))
      notifiedCount += 1
    })

    return notifiedCount
  }

  // ── Ping / keep-alive ───────────────────────────────────────────────

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
}
