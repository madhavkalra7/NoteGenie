import {
  StudyPlanInput,
  StudyPlanOutput,
} from './types'

/**
 * Study Plan Agent
 * Creates personalized study schedules based on topics and time using OpenAI API
 */
export async function createStudyPlan(
  input: StudyPlanInput
): Promise<StudyPlanOutput> {
  console.log('[StudyPlanAgent] Creating study plan...')

  try {
    const response = await fetch('/api/study-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topics: input.topics,
        timePerDay: input.timePerDay,
        daysUntilExam: input.daysUntilExam,
        weakTopics: input.weakTopics,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create study plan')
    }

    const result = await response.json()
    return {
      plan: result.plan,
      totalHours: result.totalHours,
      recommendation: result.recommendation,
    }
  } catch (error) {
    console.error('[StudyPlanAgent] Error:', error)
    throw error
  }
}
