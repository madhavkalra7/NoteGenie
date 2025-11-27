import {
  MemoryRetentionInput,
  MemoryRetentionOutput,
  Flashcard,
} from './types'

/**
 * Memory Retention Agent
 * Implements spaced repetition and suggests reviews
 * This runs client-side using established spaced repetition algorithms
 */
export async function analyzeMemoryRetention(
  input: MemoryRetentionInput
): Promise<MemoryRetentionOutput> {
  console.log('[MemoryRetentionAgent] Analyzing retention...')

  const { flashcards } = input
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

  // Sort cards by priority (least reviewed first, then by last review date)
  cardsToReview.sort((a, b) => {
    if (a.timesReviewed !== b.timesReviewed) {
      return a.timesReviewed - b.timesReviewed
    }
    const aDate = a.lastReviewed ? new Date(a.lastReviewed).getTime() : 0
    const bDate = b.lastReviewed ? new Date(b.lastReviewed).getTime() : 0
    return aDate - bDate
  })

  const suggestions = [
    cardsToReview.length > 0 
      ? `Review ${cardsToReview.length} flashcard${cardsToReview.length > 1 ? 's' : ''} today for optimal retention.`
      : 'Great job! You\'re up to date with your reviews.',
    weakConcepts.length > 0
      ? `Focus extra time on ${weakConcepts.length} concept${weakConcepts.length > 1 ? 's' : ''} you previously struggled with.`
      : 'Your understanding is solid across all concepts.',
    'Try active recall instead of passive reading for better retention.',
    'Consider studying in 25-minute focused sessions (Pomodoro technique).',
  ]

  return {
    cardsToReview,
    weakConcepts,
    suggestions,
  }
}
