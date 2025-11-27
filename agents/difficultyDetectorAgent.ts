import {
  DifficultyDetectorInput,
  DifficultyDetectorOutput,
} from './types'

/**
 * Difficulty Detector Agent
 * Tags concepts as Easy, Medium, or Hard
 * Note: This runs client-side using simple heuristics as difficulty
 * is already provided by the concept extraction API
 */
export async function detectDifficulty(
  input: DifficultyDetectorInput
): Promise<DifficultyDetectorOutput> {
  console.log('[DifficultyDetectorAgent] Analyzing difficulty...')

  // The concepts already have difficulty from the extraction API
  // This agent can refine or validate those assessments
  const taggedConcepts = input.concepts.map(concept => {
    // If difficulty is already set, keep it
    if (concept.difficulty) {
      return concept
    }

    // Fallback heuristics for missing difficulty
    const definitionLength = concept.definition.length
    const hasComplexWords = /advanced|complex|sophisticated|intricate|algorithm|recursive|derivative|integral|quantum/i.test(concept.definition)
    
    let difficulty: 'easy' | 'medium' | 'hard'
    
    if (hasComplexWords || definitionLength > 200) {
      difficulty = 'hard'
    } else if (definitionLength > 100) {
      difficulty = 'medium'
    } else {
      difficulty = 'easy'
    }
    
    return {
      ...concept,
      difficulty,
    }
  })

  return {
    taggedConcepts,
  }
}
