// https://dzone.com/articles/serverless-websocket-real-time-apps

import type { ModelMessage } from 'ai'
import { groq } from '@ai-sdk/groq'
import { NotificationMessage, WebSocketMessage } from '@webmoti-employ/shared'
import { generateText } from 'ai'
import { debugLog } from '@/utils/logger'

export class AiRoom {
  private state: DurableObjectState
  private env: CloudflareBindings

  private sessions: Map<WebSocket, { name: string, isInterviewer: boolean }>
  private messages: ModelMessage[]
  private pingInterval?: ReturnType<typeof setInterval>

  private devIsJohnDoNotUseThis = false
  private devIsJohnInterviewer = false

  private generating = false
  private transcriptQueue: string[] = []

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
      - If the interviewee starts to go off topic compared to what was asked or said previously, provide a simple 2 word hint saying "off-topic" to hint them to get back on topic.
      - Otherwise, hint is [].

    2. Then provide a JSON object with these keys always:
      - "fillerCount": number of filler words in this transcript (0 if none, never null). Only count fillers from the INTERVIEWEE's speech — ignore the interviewer's filler words entirely. Only count these as fillers:
        * Hesitation sounds: "um", "uh", "er", "ah", "hmm"
        * "like" ONLY when used as a verbal crutch (e.g. "it was like, difficult"), NOT when expressing preference ("I like coding") or comparison ("something like React")
        * "you know" when used as a filler, not when genuinely asking
        * "I mean" when used to stall, not when genuinely clarifying
        * "basically", "sort of", "kind of" when used as hedging rather than literal meaning
        * "right" ONLY when used as a filler tag (e.g. "so right, the thing is"), NOT for agreement or correctness
        Do NOT count: "also", "so", "well", "actually", "just", "really", "okay", or any word used with clear meaning in context.
      - "isQuestion": boolean, true if transcript is a question, false otherwise.
      - "hint": list of hints as described above (always a list, never null). The hints should vary based on the question and stay until the question starts to be answered properly.
      - "newTopic": boolean, true if the interviewer has started a new topic/question, false otherwise.

    Always output reasoning first, then JSON on a new line.
    NEVER ACT AS A LANGUAGE MODEL AND ADDRESS THE USER. ONLY PROVIDE REASONING THEN JSON.
    EVEN IF THE TRANSCRIPT SEEMS IRRELEVANT TO THE INTERVIEW!
    DO NOT MAKE UP TRANSCRIPTS, JUST NOTIFY WITH NULL IF NOT RELEVANT.

    NOTE THAT PARTIAL TRANSCRIPTS MAY BE SENT IN REAL TIME. THE CURRENT TRANSCRIPT MAY BE LINKED TO THE ONES ABOVE.
    SO BE SURE TO CONSIDER IF THE CURRENT TRANSCRIPT IS LINKED TO THE PREVIOUS ONE.

    IF TRANSCRIPTS HAVE DIFFERENT NAMES THEN ONE IS THE INTERVIEWER AND ONE IS THE INTERVIEWEE. IMPORTANT!!!
    IF THEY HAVE THE SAME NAME, IT IS THE SAME PERSON AND CANNOT BE BOTH THE INTERVIEWER AND CANDIDATE.

    Make sure to keep the hints active while the candidate is answering the question until they have partly sufficiently answered it.

    ONLY SET newTopic TO TRUE WHEN IT SEEMS LIKE THE INTERVIEWER HAS STARTED A NEW TOPIC. THEN ONLY NOTIFY WITH newTopic TRUE ONCE FOR THE FIRST NOTIFICATION OF THAT NEW TOPIC. THIS APPLIES TO THE FIRST TOPIC.

    Example outputs:

    Transcript is a greeting:  
    "Hello there."  
    {"isQuestion": false, "hint": [], "fillerCount": 0, "newTopic": false}

    Transcript is a question:  
    "Tell me about yourself."  
    {"isQuestion": true, "hint": [], "fillerCount": 0, "newTopic": false}

    Transcript is a question asking for a definition:
    "What is polymorphism?"
    {"isQuestion": true, "hint": ["object", "behavior"], "fillerCount": 0, "newTopic": false}

    Transcript is a response:
    "I led a project on X and achieved Z outcome."
    {"isQuestion": false, "hint": [], "fillerCount": 0, "newTopic": false}

    Transcript is a general question:
    "Tell me about your project."
    {"isQuestion": true, "hint": [], "fillerCount": 0, "newTopic": false}

    Transcript is a question asking for an example:
    "Tell me about a time when you resolved a conflict."
    {"isQuestion": true, "hint": ["provide one example"], "fillerCount": 0, "newTopic": false}

    Transcript with filler words:
    "Um, I think, like, the main thing is, you know, scalability."
    {"isQuestion": false, "hint": [], "fillerCount": 3, "newTopic": false}

    Transcript is made up of two separate transcripts:
    "Define"
    {"isQuestion": false, "hint": [], "fillerCount": 0, "newTopic": false}
    "top down parsing"
    {"isQuestion": true, "hint": ["recursive", "grammar"], "fillerCount": 0, "newTopic": false}

    Transcript is incomplete:
    "Define"
    {"isQuestion": false, "hint": [], "fillerCount": 0, "newTopic": false}
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

    this.startPing()
    // debugLog(`New WebSocket connection established. Total connections: ${this.sessions.size}`)
    // Return the client-side WebSocket back to the client.
    return new Response(null, { status: 101, webSocket: client })
  }

  async aiGenerateText() {
    const result = await generateText({ model: this.model, messages: this.messages })
    const responseText = result.text

    debugLog(this.env.IS_DEV, responseText)

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
    debugLog(this.env.IS_DEV, 'Transcript:', transcript)

    try {
      this.messages.push({ role: 'user', content: transcript })
      const response = await this.aiGenerateText()
      // Count words from the transcript text (strip the "[role] Name: " prefix)
      const wordCount = countTranscriptWords(transcript)
      await this.handleAiResponse(response, wordCount)
    }
    finally {
      this.generating = false
      // recursively process any new transcripts that arrived during generation
      if (this.transcriptQueue.length > 0)
        await this.processQueue()
    }
  }

  private async handleAiResponse(response: string, wordCount: number) {
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

    if (!notificationResult.success) {
      console.error('Failed to parse generated notification:', notificationResult.error)
      console.error('Invalid generation is:', response)
      return
    }

    this.notifyClients(notificationResult.data)
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
        this.transcriptQueue.push(`[${role}] ${name}: ${payload.text}`)
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

  async notifyClients(payload: NotificationMessage) {
    this.sessions.forEach(({ isInterviewer: sessionIsInterviewer }, ws) => {
      // In dev mode, use the dev override role instead of the session's actual role
      const isInterviewer = this.devIsJohnDoNotUseThis
        ? this.devIsJohnInterviewer
        : sessionIsInterviewer

      // Interviewers only receive hints — strip filler data and question timing
      const sessionPayload: NotificationMessage = isInterviewer
        ? { ...payload, fillerCount: 0, wordCount: 0, isQuestion: false }
        : payload

      const notificationMessage: WebSocketMessage = {
        type: 'notification',
        payload: sessionPayload,
      }

      ws.send(JSON.stringify(notificationMessage))
    })
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
}

/**
 * Count spoken words from a transcript string.
 * Strips the "[role] Name: " prefix and counts whitespace-separated words.
 */
function countTranscriptWords(transcript: string): number {
  // Remove all "[role] Name: " prefixes (there can be multiple joined transcripts)
  const text = transcript.replace(/\[(?:interviewer|interviewee)\] [^:]+: /gi, '')
  const words = text.trim().split(/\s+/).filter(w => w.length > 0)
  return words.length
}
