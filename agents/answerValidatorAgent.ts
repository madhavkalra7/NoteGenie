import {
  AnswerValidatorInput,
  AnswerValidatorOutput,
} from './types'

/**
 * Answer Validator Agent
 * Validates user answers and provides detailed feedback
 */
export async function validateAnswer(
  input: AnswerValidatorInput
): Promise<AnswerValidatorOutput> {
  // TODO: Call AI API for intelligent answer comparison
  
  await new Promise(resolve => setTimeout(resolve, 800))

  const userLower = input.userAnswer.toLowerCase().trim()
  const correctLower = input.correctAnswer.toLowerCase().trim()
  
  // Simple similarity check (in prod, use AI for semantic similarity)
  const similarity = calculateSimilarity(userLower, correctLower)
  const score = Math.round(similarity * 10)
  const wasCorrect = score >= 7

  let feedback = ''
  if (score >= 9) {
    feedback = 'Excellent! Your answer is spot on and demonstrates clear understanding.'
  } else if (score >= 7) {
    feedback = 'Good attempt! Your answer captures the main idea but could include more details.'
  } else if (score >= 5) {
    feedback = 'Partial understanding shown. Review the key concepts and try to be more specific.'
  } else {
    feedback = 'Needs improvement. Please review the material carefully and focus on the core concepts.'
  }

  return {
    score,
    feedback,
    modelAnswer: input.correctAnswer,
    wasCorrect,
  }
}

// Simple similarity calculation (Levenshtein-based)
function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(s1: string, s2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[s2.length][s1.length]
}
