import {
  SummarizerInput,
  SummarizerOutput,
} from './types'
import { callOpenAI, parseJSONResponse } from '@/lib/openai'

const SYSTEM_PROMPT = `You are DoodleBot, a fun AI study companion. Summarize notes in JSON format.

IMPORTANT: Respond with ONLY valid JSON, no other text.

Required format:
{"oneLiner":"Catchy summary with emoji 🎯","shortSummary":"2-3 sentence overview","detailedBullets":["Point 1 [Doodle: icon]","Point 2","Point 3"]}

Be friendly, use simple language and fun analogies.`

/**
 * Summarizer Agent
 * Takes raw text and generates structured summaries using OpenAI API
 */
export async function summarizeNotes(input: SummarizerInput): Promise<SummarizerOutput> {
  console.log(`[SummarizerAgent] Processing file: ${input.title || 'Untitled'}`)

  try {
    // Limit text length to avoid token issues
    const truncatedText = input.rawText.slice(0, 8000)

    const userPrompt = `Summarize these notes${input.title ? ` (${input.title})` : ''}:

${truncatedText}

Respond with ONLY valid JSON.`

    const response = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ])

    const result = parseJSONResponse<{
      oneLiner: string
      shortSummary: string
      detailedBullets: string[]
    }>(response)

    return {
      oneLiner: result.oneLiner,
      shortSummary: result.shortSummary,
      detailedBullets: result.detailedBullets,
    }
  } catch (error) {
    console.error('[SummarizerAgent] Error:', error)
    throw error
  }
}
