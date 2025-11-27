import {
  ConceptGraphInput,
  ConceptGraphOutput,
} from './types'

/**
 * Concept Graph Agent
 * Generates concept relationships for mind map visualization using OpenAI API
 */
export async function generateConceptGraph(
  input: ConceptGraphInput
): Promise<ConceptGraphOutput> {
  console.log('[ConceptGraphAgent] Generating concept graph...')

  try {
    const response = await fetch('/api/concept-graph', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        concepts: input.concepts,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate concept graph')
    }

    const result = await response.json()
    return {
      nodes: result.nodes,
      edges: result.edges,
    }
  } catch (error) {
    console.error('[ConceptGraphAgent] Error:', error)
    throw error
  }
}
