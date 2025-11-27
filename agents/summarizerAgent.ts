import {
  SummarizerInput,
  SummarizerOutput,
} from './types'

/**
 * Summarizer Agent
 * Takes raw text and generates structured summaries using OpenAI API
 */
export async function summarizeNotes(input: SummarizerInput): Promise<SummarizerOutput> {
  console.log(`[SummarizerAgent] Processing file: ${input.title || 'Untitled'}`)

  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rawText: input.rawText,
        title: input.title,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to summarize notes')
    }

    const result = await response.json()
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
