import { describe, expect, it } from 'vitest'
import { countWords, parseAiResponse } from '../../src/durable-objects/ai-room-utils'

describe('countWords', () => {
  it('counts words in a single transcript', () => {
    expect(countWords(['hello world'])).toBe(2)
  })

  it('counts words across multiple transcripts', () => {
    expect(countWords(['hello world', 'foo bar baz'])).toBe(5)
  })

  it('returns 0 for an empty array', () => {
    expect(countWords([])).toBe(0)
  })

  it('returns 0 for empty strings', () => {
    expect(countWords(['', '  '])).toBe(0)
  })

  it('handles extra whitespace between words', () => {
    expect(countWords(['hello   world'])).toBe(2)
  })

  it('handles leading and trailing whitespace', () => {
    expect(countWords(['  hello world  '])).toBe(2)
  })

  it('handles a single word', () => {
    expect(countWords(['hello'])).toBe(1)
  })
})

describe('parseAiResponse', () => {
  it('extracts reasoning text and parses valid notification', () => {
    const response = 'The interviewee used filler words.\n{"fillerCount": 2, "hint": [], "newTopic": false, "offTopic": false}'
    const result = parseAiResponse(response, 50)

    expect(result.reasoningText).toBe('The interviewee used filler words.')
    expect(result.notification).not.toBeNull()
    expect(result.notification?.fillerCount).toBe(2)
    expect(result.notification?.wordCount).toBe(50)
  })

  it('handles response with only JSON (no reasoning)', () => {
    const response = '{"fillerCount": 0, "hint": [], "newTopic": true, "offTopic": false}'
    const result = parseAiResponse(response, 10)

    expect(result.reasoningText).toBe('')
    expect(result.notification).not.toBeNull()
    expect(result.notification?.newTopic).toBe(true)
  })

  it('returns null notification for invalid field types in JSON', () => {
    // fillerCount expects a number, not a string
    const response = '{"fillerCount": "not_a_number"}'
    const result = parseAiResponse(response, 10)

    expect(result.notification).toBeNull()
  })

  it('throws when no JSON is found in the response', () => {
    const response = 'Just some reasoning text without any JSON'

    expect(() => parseAiResponse(response, 10)).toThrow('No JSON found')
  })

  it('passes wordCount through to the notification', () => {
    const response = '{"fillerCount": 1, "hint": [], "newTopic": false, "offTopic": false}'
    const result = parseAiResponse(response, 42)

    expect(result.notification?.wordCount).toBe(42)
  })

  it('handles hint arrays with multiple items', () => {
    const response = '{"fillerCount": 0, "hint": ["data structures", "algorithms"], "newTopic": true, "offTopic": false}'
    const result = parseAiResponse(response, 20)

    expect(result.notification?.hint).toEqual(['data structures', 'algorithms'])
  })

  it('handles all notification fields being active', () => {
    const response = '{"fillerCount": 5, "hint": ["clarify"], "newTopic": true, "offTopic": true}'
    const result = parseAiResponse(response, 100)

    expect(result.notification).toEqual({
      fillerCount: 5,
      hint: ['clarify'],
      newTopic: true,
      offTopic: true,
      wordCount: 100,
    })
  })

  it('uses default values when fields are missing from JSON', () => {
    // IntervieweeNotification has defaults for all fields
    const response = '{}'
    const result = parseAiResponse(response, 30)

    expect(result.notification).toEqual({
      fillerCount: 0,
      hint: [],
      newTopic: false,
      offTopic: false,
      wordCount: 30,
    })
  })

  it('handles reasoning with multiple lines before JSON', () => {
    const response = 'Line one.\nLine two.\nLine three.\n{"fillerCount": 0, "hint": [], "newTopic": false, "offTopic": false}'
    const result = parseAiResponse(response, 15)

    expect(result.reasoningText).toBe('Line one.\nLine two.\nLine three.')
    expect(result.notification).not.toBeNull()
  })
})
