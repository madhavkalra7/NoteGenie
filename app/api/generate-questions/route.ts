import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI, parseJSONResponse } from '@/lib/openai'
import { Concept } from '@/agents/types'

const SYSTEM_PROMPT = `You are an expert quiz question creator for educational assessment.
Create diverse, challenging questions that test understanding of concepts.

Create a mix of:
1. MCQ (Multiple Choice) - with 4 options, one correct
2. Short Answer - requiring brief written response
3. True/False - statement to evaluate

For each question provide:
- Clear question text
- Correct answer
- Brief explanation
- Difficulty level

YOU MUST respond with ONLY a valid JSON object in this exact format:
{
  "questions": [
    {
      "id": "q-1",
      "type": "mcq|short|truefalse",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The correct answer",
      "explanation": "Why this is correct",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Note: "options" field is only for MCQ type questions.
Do not include any text outside the JSON object.`

export async function POST(request: NextRequest) {
  try {
    const { concepts, summary, difficulty, count } = await request.json()

    if (!concepts || !Array.isArray(concepts)) {
      return NextResponse.json(
        { error: 'concepts array is required' },
        { status: 400 }
      )
    }

    const questionCount = count || 5
    const targetDifficulty = difficulty || 'mixed'

    const conceptsText = concepts.map((c: Concept) => 
      `- ${c.term}: ${c.definition}`
    ).join('\n')

    const userPrompt = `Create ${questionCount} quiz questions based on these concepts:

${conceptsText}

${summary ? `Summary context: ${summary}` : ''}

Target difficulty: ${targetDifficulty}
Include at least: 2 MCQs, 1 True/False, and rest can be short answer.

Remember to respond with ONLY a valid JSON object.`

    const response = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ])

    const result = parseJSONResponse<{
      questions: Array<{
        id: string
        type: 'mcq' | 'short' | 'truefalse'
        question: string
        options?: string[]
        correctAnswer: string
        explanation: string
        difficulty: 'easy' | 'medium' | 'hard'
      }>
    }>(response)

    // Add unique IDs
    result.questions = result.questions.map((q, index) => ({
      ...q,
      id: `q-${q.type}-${Date.now()}-${index}`
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Generate Questions API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions' },
      { status: 500 }
    )
  }
}
