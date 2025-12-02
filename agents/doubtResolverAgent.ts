import {
  DoubtResolverInput,
  DoubtResolverOutput,
} from './types'

/**
 * Doubt Resolver Agent
 * Provides clear explanations with analogies and step-by-step breakdowns using OpenAI API
 */
export async function resolveDoubt(
  input: DoubtResolverInput
): Promise<DoubtResolverOutput> {
  console.log('[DoubtResolverAgent] Resolving doubt...')

  try {
    const response = await fetch('/api/resolve-doubt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doubt: input.doubt,
        context: input.context,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to resolve doubt')
    }

    const result = await response.json()
    
    // Return based on response type (chat or doubt)
    if (result.type === 'chat') {
      return {
        type: 'chat',
        reply: result.reply,
      }
    }
    
    return {
      type: 'doubt',
      simpleExplanation: result.simpleExplanation,
      detailedExplanation: result.detailedExplanation,
      analogy: result.analogy,
      oneLiner: result.oneLiner,
      stepByStep: result.stepByStep,
    }
  } catch (error) {
    console.error('[DoubtResolverAgent] Error:', error)
    throw error
  }
}
