import {
  DifficultyDetectorInput,
  DifficultyDetectorOutput,
  Concept,
} from './types'

/**
 * Difficulty Detector Agent
 * Tags concepts as Easy, Medium, or Hard
 */
export async function detectDifficulty(
  input: DifficultyDetectorInput
): Promise<DifficultyDetectorOutput> {
  // TODO: Call AI API to intelligently assess concept difficulty
  
  await new Promise(resolve => setTimeout(resolve, 700))

  // Mock difficulty detection based on definition complexity
  const taggedConcepts: Concept[] = input.concepts.map(concept => {
    const definitionLength = concept.definition.length
    const hasComplexWords = /advanced|complex|sophisticated|intricate/i.test(concept.definition)
    
    let difficulty: 'easy' | 'medium' | 'hard'
    
    if (hasComplexWords || definitionLength > 150) {
      difficulty = 'hard'
    } else if (definitionLength > 80) {
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
