import {
  FlashcardAgentInput,
  FlashcardAgentOutput,
} from './types'

/**
 * Flashcard Agent
 * Generates Q&A flashcards from concepts using OpenAI API
 */
export async function generateFlashcards(
  input: FlashcardAgentInput
): Promise<FlashcardAgentOutput> {
  console.log('[FlashcardAgent] Generating flashcards...')

  try {
    const response = await fetch('/api/generate-flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        concepts: input.concepts,
        additionalContext: input.additionalContext,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate flashcards')
    }

    const result = await response.json()
    return {
      flashcards: result.flashcards,
    }
  } catch (error) {
    console.error('[FlashcardAgent] Error:', error)
    throw error
  }
}
