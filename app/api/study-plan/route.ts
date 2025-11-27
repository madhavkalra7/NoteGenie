import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI, parseJSONResponse } from '@/lib/openai'

const SYSTEM_PROMPT = `You are an expert study planner. Create study schedules in JSON format.

IMPORTANT: Your response must be ONLY a valid JSON object, nothing else. No explanations, no markdown, just pure JSON.

Required JSON structure:
{"plan":[{"id":"task-1","day":1,"topics":["Topic"],"duration":60,"priority":"high","description":"Focus area"}],"totalHours":10,"recommendation":"Study advice"}

Rules:
- priority must be "high", "medium", or "low"
- duration is in minutes
- day starts from 1
- Include 1 task per day minimum`

export async function POST(request: NextRequest) {
  try {
    const { topics, timePerDay, daysUntilExam, weakTopics } = await request.json()

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: 'topics array is required' },
        { status: 400 }
      )
    }

    const days = Math.min(daysUntilExam || 14, 30) // Limit to 30 days max
    const time = timePerDay || 60

    const userPrompt = `Create a ${days}-day study plan for: ${topics.join(', ')}
Daily study time: ${time} minutes
${weakTopics?.length > 0 ? `Weak topics (prioritize): ${weakTopics.join(', ')}` : ''}

Respond with ONLY valid JSON. No other text.`

    const response = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ], { max_completion_tokens: 3000 })

    const result = parseJSONResponse<{
      plan: Array<{
        id: string
        day: number
        topics: string[]
        duration: number
        priority: 'high' | 'medium' | 'low'
        description?: string
      }>
      totalHours: number
      recommendation: string
    }>(response)

    // Add dates and unique IDs
    const today = new Date()
    result.plan = result.plan.map((task, index) => ({
      ...task,
      id: `task-${Date.now()}-${index}`,
      date: new Date(today.getTime() + (task.day - 1) * 24 * 60 * 60 * 1000),
      completed: false
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Study Plan API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create study plan' },
      { status: 500 }
    )
  }
}
