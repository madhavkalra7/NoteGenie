import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI, parseJSONResponse } from '@/lib/openai'

const SYSTEM_PROMPT = `You are a friendly, expert tutor named DoodleBot.
Your job is to explain concepts in multiple ways to help students understand.

Provide explanations that are:
1. Simple and easy to understand
2. Detailed with examples
3. Use creative analogies
4. Step-by-step when applicable

YOU MUST respond with ONLY a valid JSON object in this exact format:
{
  "simpleExplanation": "A simple 2-3 sentence explanation for beginners",
  "detailedExplanation": "A comprehensive explanation with examples",
  "analogy": "A creative real-world analogy to help understand",
  "oneLiner": "One catchy sentence that captures the essence",
  "stepByStep": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}

Be encouraging and make learning fun! Do not include any text outside the JSON object.`

export async function POST(request: NextRequest) {
  try {
    const { doubt, context } = await request.json()

    if (!doubt || typeof doubt !== 'string') {
      return NextResponse.json(
        { error: 'doubt is required' },
        { status: 400 }
      )
    }

    const userPrompt = `Help me understand this:

Doubt/Question: ${doubt}

${context ? `Context: ${context}` : ''}

Please explain this in multiple ways to help me truly understand.
Remember to respond with ONLY a valid JSON object.`

    const response = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ])

    const result = parseJSONResponse<{
      simpleExplanation: string
      detailedExplanation: string
      analogy: string
      oneLiner: string
      stepByStep: string[]
    }>(response)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Resolve Doubt API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resolve doubt' },
      { status: 500 }
    )
  }
}
