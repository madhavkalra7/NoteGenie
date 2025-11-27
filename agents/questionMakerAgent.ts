import {
  QuestionMakerInput,
  QuestionMakerOutput,
} from './types'

/**
 * Question Maker Agent
 * Generates MCQs, short answer, and true/false questions using OpenAI API
 */
export async function generateQuestions(
  input: QuestionMakerInput
): Promise<QuestionMakerOutput> {
  console.log('[QuestionMakerAgent] Generating questions...')

  try {
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        concepts: input.concepts,
        summary: input.summary,
        difficulty: input.difficulty,
        count: input.count,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate questions')
    }

    const result = await response.json()
    return {
      questions: result.questions,
    }
  } catch (error) {
    console.error('[QuestionMakerAgent] Error:', error)
    throw error
  }
}
