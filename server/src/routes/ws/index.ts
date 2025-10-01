import type { AppContext } from '../..'
import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/cloudflare-workers'
import { aiGenerateText, type CoreMessage } from '../ai'

const wsRoute = new Hono<AppContext>()

wsRoute.get('/ai-demo', upgradeWebSocket((c) => {
  return {
    onOpen: async (evt, ws) => {
      try {
        const messages: CoreMessage[] = [
          { role: 'system', content: 'You analyze interview transcripts.' },
          { role: 'user', content: 'Say hello and confirm the WebSocket bridge works.' },
        ]
        const res = await aiGenerateText({ messages, temperature: 0 })
        ws.send(JSON.stringify({ type: 'ai-result', text: res.text }))
      }
      catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: 'AI call failed' }))
      }
    },
    onMessage: async (evt, ws) => {
      const text = evt.data?.toString?.() ?? ''
      if (!text) return
      try {
        const messages: CoreMessage[] = [
          { role: 'system', content: 'You analyze interview transcripts.' },
          { role: 'user', content: text },
        ]
        const res = await aiGenerateText({ messages, temperature: 0.3 })
        ws.send(JSON.stringify({ type: 'ai-result', text: res.text }))
      }
      catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: 'AI call failed' }))
      }
    },
  }
}))

export default wsRoute

