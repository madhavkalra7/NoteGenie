import {
  StudyPlanInput,
  StudyPlanOutput,
  StudyTask,
} from './types'

/**
 * Study Plan Agent
 * Creates personalized study schedules based on topics and time
 */
export async function createStudyPlan(
  input: StudyPlanInput
): Promise<StudyPlanOutput> {
  // TODO: Call AI API for intelligent study plan generation
  
  await new Promise(resolve => setTimeout(resolve, 1000))

  const { topics, timePerDay, daysUntilExam, weakTopics = [] } = input
  const plan: StudyTask[] = []
  
  const totalMinutes = timePerDay * daysUntilExam
  const minutesPerTopic = Math.floor(totalMinutes / topics.length)
  
  let currentDay = 0
  let currentDate = new Date()
  
  // Prioritize weak topics
  const prioritizedTopics = [
    ...weakTopics.filter(t => topics.includes(t)),
    ...topics.filter(t => !weakTopics.includes(t)),
  ]
  
  prioritizedTopics.forEach((topic, index) => {
    const sessionsNeeded = Math.ceil(minutesPerTopic / timePerDay)
    
    for (let session = 0; session < sessionsNeeded; session++) {
      plan.push({
        id: `task-${Date.now()}-${index}-${session}`,
        day: currentDay + 1,
        date: new Date(currentDate.getTime() + currentDay * 24 * 60 * 60 * 1000),
        topics: [topic],
        duration: Math.min(timePerDay, minutesPerTopic - (session * timePerDay)),
        priority: weakTopics.includes(topic) ? 'high' : 'medium',
        completed: false,
      })
      
      currentDay++
      if (currentDay >= daysUntilExam) break
    }
  })
  
  // Add revision days
  const revisionDays = Math.floor(daysUntilExam * 0.2)
  for (let i = 0; i < revisionDays && currentDay < daysUntilExam; i++) {
    plan.push({
      id: `task-revision-${Date.now()}-${i}`,
      day: currentDay + 1,
      date: new Date(currentDate.getTime() + currentDay * 24 * 60 * 60 * 1000),
      topics: prioritizedTopics.slice(0, 3),
      duration: timePerDay,
      priority: 'high',
      completed: false,
    })
    currentDay++
  }
  
  return {
    plan: plan.slice(0, daysUntilExam),
    totalHours: totalMinutes / 60,
    recommendation: `Focus on ${weakTopics.length > 0 ? 'weak topics first, then ' : ''}building a strong foundation. Allocate ${timePerDay} minutes daily with regular revision sessions.`,
  }
}
