import { IntervieweeNotification } from '@webmoti-employ/shared'

const jsonRegex = /\{[\s\S]*\}/
const wordRegex = /\s+/

/**
 * Splits an AI response into reasoning text (before the JSON) and the parsed notification object.
 */
export function parseAiResponse(response: string, wordCount: number): {
  reasoningText: string
  notification: IntervieweeNotification | null
} {
  // split reasoning text (everything before the first JSON block) from the JSON
  const jsonMatch = response.match(jsonRegex)
  let reasoningText = ''
  let jsonText = response
  if (jsonMatch) {
    reasoningText = response.slice(0, jsonMatch.index).trim()
    jsonText = jsonMatch[0]
  }

  const notificationResult = IntervieweeNotification.safeParse({
    ...extractJsonObject(jsonText),
    wordCount,
  })

  if (!notificationResult.success) {
    console.error('Failed to parse generated notification:', notificationResult.error)
    console.error('Invalid generation is:', response)
    return { reasoningText, notification: null }
  }

  return { reasoningText, notification: notificationResult.data }
}

/**
 * Extracts the first `{...}` JSON block from a string and parses it.
 */
function extractJsonObject(text: string): Record<string, unknown> {
  // match first {...} JSON block
  const match = text.match(jsonRegex)
  if (!match) {
    throw new Error('No JSON found in response')
  }
  return JSON.parse(match[0])
}

export function countWords(transcripts: string[]): number {
  let total = 0
  for (const t of transcripts) {
    const words = t.trim().split(wordRegex).filter(w => w.length > 0)
    total += words.length
  }
  return total
}
