// https://dzone.com/articles/serverless-websocket-real-time-apps

import type { ModelMessage } from 'ai'
import { groq } from '@ai-sdk/groq'
import { NotificationMessage, WebSocketMessage } from '@webmoti-employ/shared'
import { generateText } from 'ai'
import { debugLog, prodLog } from '@/utils/logger'

export class AiRoom {
  private state: DurableObjectState
  private env: CloudflareBindings

  private sessions: Map<WebSocket, { name: string, isInterviewer: boolean }>
  private messages: ModelMessage[]
  private pingInterval?: ReturnType<typeof setInterval>

  private devIsJohnDoNotUseThis = false
  private devIsJohnInterviewer = false
  private pipelineCounter = 0

  private generating = false
  private transcriptQueue: {
    text: string
    isInterviewer: boolean
    status: 'partial' | 'final'
    enqueuedAt: number
  }[] = []

  private model = groq('meta-llama/llama-4-scout-17b-16e-instruct')

  private systemPrompt = `
    Virtual Interview Assistant Notification System

    Transcripts alternate between an interviewer and an interviewee, prefixed with their role (e.g. "[interviewer] Name:" or "[interviewee] Name:").

    For each transcript:

    1. Provide 1-2 concise sentences explaining the reasoning for the notification.  
      - Reasoning is based only on the transcript content.  
      - Ignore greetings or small talk; do not invent roles.
      - If the interviewer is asking for a definition, provide two 1-word hints without restating the definition word.
      - If the interviewer is asking for an example question, provide ["provide one example"].
      - If the interviewer is asking a personal question, like "tell me about yourself?", provide two 1-word hints about what the candidate could talk about.
      - Otherwise, hint is [].

    2. Then provide a JSON object with these keys always:
      - "fillerCount": number of filler words in this transcript (0 if none, never null). Only count fillers from the INTERVIEWEE's speech — ignore the interviewer's filler words entirely. Only count these as fillers:
        * Hesitation sounds: "um", "uh", "er", "ah", "hmm"
        * "like" ONLY when used as a verbal crutch (e.g. "it was like, difficult"), NOT when expressing preference ("I like coding") or comparison ("something like React")
        * "you know" when used as a filler, not when genuinely asking
        * "I mean" when used to stall, not when genuinely clarifying
        * "basically", "sort of", "kind of" when used as hedging rather than literal meaning
        * "right" ONLY when used as a filler tag (e.g. "so right, the thing is"), NOT for agreement or correctness
        Do NOT count: "also", "so", "well", "actually", "just", "really", "okay", "anyway", "anyways", or any word used with clear meaning in context.
      - "isQuestion": boolean, true if transcript is a question, false otherwise.
      - "hint": list of hints as described above (always a list, never null). The hints should vary based on the question and stay until the question starts to be answered properly.
      - "newTopic": boolean, true if the interviewer has started a new topic/question, false otherwise.
      - "offTopic": boolean, true ONLY if the interviewee has clearly gone off topic and is NOT coming back. Be very lenient — people often answer questions with stories or tangents that seem unrelated at first but circle back to the point. Only set true if the interviewee has been consistently off topic for multiple transcripts and shows no sign of returning, OR if it is blatantly irrelevant to the question. Default false.

    Always output reasoning first, then JSON on a new line.
    NEVER ACT AS A LANGUAGE MODEL AND ADDRESS THE USER. ONLY PROVIDE REASONING THEN JSON.
    EVEN IF THE TRANSCRIPT SEEMS IRRELEVANT TO THE INTERVIEW!
    DO NOT MAKE UP TRANSCRIPTS, JUST NOTIFY WITH NULL IF NOT RELEVANT.

    NOTE THAT PARTIAL TRANSCRIPTS MAY BE SENT IN REAL TIME. THE CURRENT TRANSCRIPT MAY BE LINKED TO THE ONES ABOVE.
    SO BE SURE TO CONSIDER IF THE CURRENT TRANSCRIPT IS LINKED TO THE PREVIOUS ONE.

    IF TRANSCRIPTS HAVE DIFFERENT NAMES THEN ONE IS THE INTERVIEWER AND ONE IS THE INTERVIEWEE. IMPORTANT!!!
    IF THEY HAVE THE SAME NAME, IT IS THE SAME PERSON AND CANNOT BE BOTH THE INTERVIEWER AND CANDIDATE.

    Make sure to keep the hints active while the candidate is answering the question until they have partly sufficiently answered it.

    ONLY SET newTopic TO TRUE WHEN A SIGNIFICANT NEW QUESTION OR SUBJECT IS INTRODUCED BY EITHER THE INTERVIEWER OR INTERVIEWEE. THEN ONLY NOTIFY WITH newTopic TRUE ONCE FOR THE FIRST NOTIFICATION OF THAT NEW TOPIC. THIS APPLIES TO THE FIRST TOPIC.
    IMPORTANT: An interviewee returning to the original topic after going off-topic is NOT a new topic. The topic only changes when a genuinely different question or subject is raised.

    Example outputs:

    Transcript is a greeting:  
    "Hello there."  
    {"isQuestion": false, "hint": [], "fillerCount": 0, "newTopic": false, "offTopic": false}

    Transcript is a question:  
    "Tell me about yourself."  
    {"isQuestion": true, "hint": [], "fillerCount": 0, "newTopic": false, "offTopic": false}

    Transcript is a question asking for a definition:
    "What is polymorphism?"
    {"isQuestion": true, "hint": ["object", "behavior"], "fillerCount": 0, "newTopic": false, "offTopic": false}

    Transcript is a response:
    "I led a project on X and achieved Z outcome."
    {"isQuestion": false, "hint": [], "fillerCount": 0, "newTopic": false, "offTopic": false}

    Transcript is a general question:
    "Tell me about your project."
    {"isQuestion": true, "hint": [], "fillerCount": 0, "newTopic": false, "offTopic": false}

    Transcript is a question asking for an example:
    "Tell me about a time when you resolved a conflict."
    {"isQuestion": true, "hint": ["provide one example"], "fillerCount": 0, "newTopic": false, "offTopic": false}

    Transcript with filler words:
    "Um, I think, like, the main thing is, you know, scalability."
    {"isQuestion": false, "hint": [], "fillerCount": 3, "newTopic": false, "offTopic": false}

    Transcript is made up of two separate transcripts:
    "Define"
    {"isQuestion": false, "hint": [], "fillerCount": 0, "newTopic": false, "offTopic": false}
    "top down parsing"
    {"isQuestion": true, "hint": ["recursive", "grammar"], "fillerCount": 0, "newTopic": false, "offTopic": false}

    Transcript is incomplete:
    "Define"
    {"isQuestion": false, "hint": [], "fillerCount": 0, "newTopic": false, "offTopic": false}
  `

  constructor(state: DurableObjectState, env: CloudflareBindings) {
    this.state = state
    this.env = env
    this.sessions = new Map()
    this.messages = []
    // add system prompt to beginning of message list
    this.messages.push({ role: 'system', content: this.systemPrompt })
    this.startPing()
  }

  private nextPipelineId() {
    this.pipelineCounter += 1
    return `${Date.now()}-${this.pipelineCounter}`
  }

  private pipelineLog(event: string, details: Record<string, unknown>) {
    prodLog('[AiRoom]', event, details)
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

    const isInterviewer = request.headers.get('x-is-interviewer') === 'true'
    const name = request.headers.get('x-name') ?? ''
    this.sessions.set(server, { name, isInterviewer })
    this.pipelineLog('websocket.connected', {
      connections: this.sessions.size,
      isInterviewer,
      userName: name,
    })

    this.startPing()
    // debugLog(`New WebSocket connection established. Total connections: ${this.sessions.size}`)
    // Return the client-side WebSocket back to the client.
    return new Response(null, { status: 101, webSocket: client })
  }

  async aiGenerateText(pipelineId: string) {
    const startedAt = Date.now()
    const result = await generateText({ model: this.model, messages: this.messages })
    const responseText = result.text
    const durationMs = Date.now() - startedAt

    this.pipelineLog('ai.generate.complete', {
      pipelineId,
      durationMs,
      responseLength: responseText.length,
      messageCount: this.messages.length,
    })

    debugLog(this.env.IS_DEV, responseText)

    // we need to store the response text as well so the ai knows what it's responded to
    this.messages.push({ role: 'assistant', content: responseText })
    return responseText
  }

  private async processQueue() {
    if (this.generating || this.transcriptQueue.length === 0)
      return

    this.generating = true
    const pipelineId = this.nextPipelineId()
    const startedAt = Date.now()

    const queued = this.transcriptQueue
    this.transcriptQueue = [] // clear the queue immediately

    const oldestEnqueuedAt = Math.min(...queued.map(q => q.enqueuedAt))
    this.pipelineLog('pipeline.start', {
      pipelineId,
      queuedCount: queued.length,
      queueWaitMs: startedAt - oldestEnqueuedAt,
      queuedStatuses: queued.map(q => q.status),
    })

    // combine all queued transcripts into one message for the AI
    const transcript = queued.map(q => q.text).join(' ')
    debugLog(this.env.IS_DEV, 'Transcript:', transcript)

    // Count only interviewee words so the denominator matches filler-counting rules
    const wordCount = countWords(
      queued.filter(q => !q.isInterviewer).map(q => q.text),
    )

    try {
      this.messages.push({ role: 'user', content: transcript })
      const response = await this.aiGenerateText(pipelineId)
      await this.handleAiResponse(response, wordCount, pipelineId)

      this.pipelineLog('pipeline.complete', {
        pipelineId,
        durationMs: Date.now() - startedAt,
        remainingQueueCount: this.transcriptQueue.length,
      })
    }
    finally {
      this.generating = false
      // recursively process any new transcripts that arrived during generation
      if (this.transcriptQueue.length > 0)
        await this.processQueue()
    }
  }

  private async handleAiResponse(response: string, wordCount: number, pipelineId: string) {
    const startedAt = Date.now()

    function getResponseObject(response: string) {
    // match first {...} JSON block
      const match = response.match(/\{[\s\S]*\}/)
      if (!match) {
        throw new Error('No JSON found in response')
      }
      return JSON.parse(match[0])
    }

    const notificationResult = NotificationMessage.safeParse({
      ...getResponseObject(response),
      wordCount,
    })

    this.pipelineLog('pipeline.parse.complete', {
      pipelineId,
      parseDurationMs: Date.now() - startedAt,
      wordCount,
    })

    if (!notificationResult.success) {
      console.error('Failed to parse generated notification:', notificationResult.error)
      console.error('Invalid generation is:', response)
      this.pipelineLog('pipeline.parse.failed', {
        pipelineId,
      })
      return
    }

    const notifyStartedAt = Date.now()
    const notifiedCount = this.notifyClients(notificationResult.data)
    this.pipelineLog('pipeline.notify.complete', {
      pipelineId,
      notifyDurationMs: Date.now() - notifyStartedAt,
      notifiedCount,
      totalDurationMs: Date.now() - startedAt,
    })
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
        const payload = websocketMsg.payload

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
        this.pipelineLog('transcript.enqueued', {
          queueCount: this.transcriptQueue.length,
          status: payload.status,
          textLength: payload.text.length,
          role,
        })
        // don't await this
        void this.processQueue()
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

  // Broadcast to all connected clients in the room.
  async broadcastMessage(message: WebSocketMessage) {
    this.sessions.forEach((_, session) => {
      session.send(JSON.stringify(message))
    })
  }

  notifyClients(payload: NotificationMessage) {
    let notifiedCount = 0
    this.sessions.forEach(({ isInterviewer: sessionIsInterviewer }, ws) => {
      // In dev mode, use the dev override role instead of the session's actual role
      const isInterviewer = this.devIsJohnDoNotUseThis
        ? this.devIsJohnInterviewer
        : sessionIsInterviewer

      // Interviewers only receive hints — strip filler data, question timing, and off-topic
      const sessionPayload: NotificationMessage = isInterviewer
        ? { ...payload, fillerCount: 0, wordCount: 0, isQuestion: false, offTopic: false }
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

  // Cleans up a session when a WebSocket connection is closed.
  async webSocketClose(ws: WebSocket): Promise<void> {
    console.warn('WebSocket connection closed.')
    this.sessions.delete(ws)
    this.pipelineLog('websocket.closed', { remainingConnections: this.sessions.size })
    if (this.sessions.size === 0) {
      this.stopPing()
    }
    // debugLog(`Total connections remaining: ${this.sessions.size}`)
  }

  // Handles errors on a WebSocket connection.
  async webSocketError(ws: WebSocket, error: any): Promise<void> {
    console.error('WebSocket error:', error)
    this.sessions.delete(ws)
    this.pipelineLog('websocket.error', { remainingConnections: this.sessions.size })
  }
}

function countWords(transcripts: string[]): number {
  let total = 0
  for (const t of transcripts) {
    const words = t.trim().split(/\s+/).filter(w => w.length > 0)
    total += words.length
  }
  return total
}
