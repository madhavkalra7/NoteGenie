import {
  AnswerValidatorInput,
  AnswerValidatorOutput,
} from './types'

/**
 * Answer Validator Agent
 * Validates user answers and provides detailed feedback using OpenAI API
 */
export async function validateAnswer(
  input: AnswerValidatorInput
): Promise<AnswerValidatorOutput> {
  console.log('[AnswerValidatorAgent] Validating answer...')

  try {
    const response = await fetch('/api/validate-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: input.question,
        userAnswer: input.userAnswer,
        correctAnswer: input.correctAnswer,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to validate answer')
    }

    const result = await response.json()
    return {
      score: result.score,
      feedback: result.feedback,
      modelAnswer: result.modelAnswer,
      wasCorrect: result.wasCorrect,
    }
  } catch (error) {
    console.error('[AnswerValidatorAgent] Error:', error)
    throw error
  }
}
