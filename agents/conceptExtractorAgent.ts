import {
  ConceptExtractorInput,
  ConceptExtractorOutput,
} from './types'

/**
 * Concept Extractor Agent
 * Extracts keywords, concepts, definitions, formulas from text using OpenAI API
 */
export async function extractConcepts(
  input: ConceptExtractorInput
): Promise<ConceptExtractorOutput> {
  console.log('[ConceptExtractorAgent] Extracting concepts...')

  try {
    const response = await fetch('/api/extract-concepts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: input.text,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to extract concepts')
    }

    const result = await response.json()
    return {
      concepts: result.concepts,
    }
  } catch (error) {
    console.error('[ConceptExtractorAgent] Error:', error)
    throw error
  }
}
