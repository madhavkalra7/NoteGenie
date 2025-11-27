import {
  MemoryRetentionInput,
  MemoryRetentionOutput,
  Flashcard,
} from './types'

/**
 * Memory Retention Agent
 * Implements spaced repetition and suggests reviews
 */
export async function analyzeMemoryRetention(
  input: MemoryRetentionInput
): Promise<MemoryRetentionOutput> {
  // TODO: Call AI API for personalized retention analysis
  
  await new Promise(resolve => setTimeout(resolve, 900))

  const { flashcards, lastStudyDate } = input
  const now = new Date()
  const cardsToReview: Flashcard[] = []
  const weakConcepts: string[] = []
  
  flashcards.forEach(card => {
    const daysSinceReview = card.lastReviewed 
      ? Math.floor((now.getTime() - new Date(card.lastReviewed).getTime()) / (1000 * 60 * 60 * 24))
      : 999
    
    // Spaced repetition intervals: 1, 3, 7, 14, 30 days
    const shouldReview = 
      !card.lastReviewed ||
      (card.timesReviewed === 0 && daysSinceReview >= 1) ||
      (card.timesReviewed === 1 && daysSinceReview >= 3) ||
      (card.timesReviewed === 2 && daysSinceReview >= 7) ||
      (card.timesReviewed >= 3 && daysSinceReview >= 14)
    
    if (shouldReview) {
      cardsToReview.push(card)
    }
    
    if (card.wasCorrect === false) {
      weakConcepts.push(card.question)
    }
  })

  const suggestions = [
    cardsToReview.length > 0 
      ? `Review ${cardsToReview.length} flashcard${cardsToReview.length > 1 ? 's' : ''} today for optimal retention.`
      : 'Great job! You\'re up to date with your reviews.',
    weakConcepts.length > 0
      ? `Focus extra time on ${weakConcepts.length} concept${weakConcepts.length > 1 ? 's' : ''} you previously struggled with.`
      : 'Your understanding is solid across all concepts.',
    'Try active recall instead of passive reading for better retention.',
  ]

  return {
    cardsToReview,
    weakConcepts,
    suggestions,
  }
}
