import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI, parseJSONResponse } from '@/lib/openai'

const SYSTEM_PROMPT = `You are an expert educational assessor.
Evaluate the user's answer compared to the correct answer.

Consider:
1. Semantic similarity (same meaning even if different words)
2. Key concepts coverage
3. Accuracy of understanding
4. Completeness of response

YOU MUST respond with ONLY a valid JSON object in this exact format:
{
  "score": 8,
  "feedback": "Detailed feedback on the answer",
  "wasCorrect": true,
  "modelAnswer": "An ideal answer for reference"
}

Score should be 0-10:
- 9-10: Excellent, fully correct
- 7-8: Good, mostly correct with minor gaps
- 5-6: Partial understanding, significant gaps
- 3-4: Limited understanding
- 0-2: Incorrect or off-topic

wasCorrect should be true if score >= 7.
Do not include any text outside the JSON object.`

export async function POST(request: NextRequest) {
  try {
    const { question, userAnswer, correctAnswer } = await request.json()

    if (!question || !userAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: 'question, userAnswer, and correctAnswer are required' },
        { status: 400 }
      )
    }

    const userPrompt = `Evaluate this answer:

Question: ${question}

User's Answer: ${userAnswer}

Correct Answer: ${correctAnswer}

Provide a fair assessment considering semantic similarity and understanding demonstrated.
Remember to respond with ONLY a valid JSON object.`

    const response = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ])

    const result = parseJSONResponse<{
      score: number
      feedback: string
      wasCorrect: boolean
      modelAnswer: string
    }>(response)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Validate Answer API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to validate answer' },
      { status: 500 }
    )
  }
}
