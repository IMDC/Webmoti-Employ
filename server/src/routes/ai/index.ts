import type { CoreMessage } from 'ai'
import process from 'node:process'
import { groq as createGroqModel } from '@ai-sdk/groq'
import { generateText, streamText } from 'ai'

export interface AiGenerateOptions {
  model?: GroqModelName
  system?: string
  messages: CoreMessage[]
  maxTokens?: number
  temperature?: number
}

export type GroqModelName = 'llama-3.1-8b-instant'
  | 'llama-3.1-70b-versatile'
  | 'llama-3.2-90b-vision-preview'
  | 'llama-3.2-11b-vision-preview'
  | 'llama-3.2-3b-preview'
  | 'llama-3.1-405b-reasoning'
  | 'llama-3.1-70b-tool-use-preview'
  | 'llama-3.1-8b-tool-use-preview'

function requireGroqApiKey(getEnv?: () => string | undefined): string {
  const read = getEnv ?? (() => process.env.GROQ_API_KEY)
  const key = read()
  if (!key) {
    throw new Error('Missing GROQ_API_KEY in environment')
  }
  return key
}

function getGroqModel(modelName: GroqModelName) {
  requireGroqApiKey()
  return createGroqModel(modelName)
}

export interface AiGenerateResult {
  text: string
  finishReason: unknown
  usage: unknown
}

export async function aiGenerateText(options: AiGenerateOptions): Promise<AiGenerateResult> {
  const { model = 'llama-3.1-8b-instant', system, messages, maxTokens, temperature } = options
  const result = await generateText({
    // Temporary cast to satisfy LanguageModelV1 typing from ai@4
    model: getGroqModel(model) as unknown as any,
    system,
    messages,
    maxTokens,
    temperature,
  })
  return {
    text: result.text,
    finishReason: result.finishReason,
    usage: result.usage,
  }
}

export function aiStreamText(options: AiGenerateOptions): any {
  const { model = 'llama-3.1-8b-instant', system, messages, maxTokens, temperature } = options
  return streamText({
    // Temporary cast to satisfy LanguageModelV1 typing from ai@4
    model: getGroqModel(model) as unknown as any,
    system,
    messages,
    maxTokens,
    temperature,
  })
}

export type { CoreMessage } from 'ai'
