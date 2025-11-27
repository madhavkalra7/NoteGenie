import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI, parseJSONResponse } from '@/lib/openai'

const SYSTEM_PROMPT = `Extract key concepts from educational text. Respond with ONLY valid JSON.

Format: {"concepts":[{"id":"1","term":"Name","definition":"Definition","difficulty":"easy|medium|hard","category":"Category"}]}

Extract 4-8 important concepts.`

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      )
    }

    const truncatedText = text.slice(0, 8000)

    const userPrompt = `Extract concepts from:\n\n${truncatedText}\n\nRespond with ONLY valid JSON.`

    const response = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ])

    const result = parseJSONResponse<{
      concepts: Array<{
        id: string
        term: string
        definition: string
        difficulty: 'easy' | 'medium' | 'hard'
        category: string
      }>
    }>(response)

    // Add unique IDs with timestamp
    result.concepts = result.concepts.map((concept, index) => ({
      ...concept,
      id: `concept-${Date.now()}-${index}`
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Extract Concepts API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract concepts' },
      { status: 500 }
    )
  }
}
