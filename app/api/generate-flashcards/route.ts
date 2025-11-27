import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI, parseJSONResponse } from '@/lib/openai'
import { Concept } from '@/agents/types'

const SYSTEM_PROMPT = `You are an expert flashcard creator for effective learning.
Create engaging, educational flashcards that help students learn and remember concepts.

For each concept, create:
1. A clear, specific question
2. A comprehensive but concise answer
3. Vary question types: "What is...", "Explain...", "How does...", "Why is...", etc.

Also create 1-2 additional flashcards that test understanding across multiple concepts.

YOU MUST respond with ONLY a valid JSON object in this exact format:
{
  "flashcards": [
    {
      "id": "flashcard-1",
      "question": "Clear question about the concept",
      "answer": "Comprehensive answer",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Do not include any text outside the JSON object.`

export async function POST(request: NextRequest) {
  try {
    const { concepts, additionalContext } = await request.json()

    if (!concepts || !Array.isArray(concepts)) {
      return NextResponse.json(
        { error: 'concepts array is required' },
        { status: 400 }
      )
    }

    const conceptsText = concepts.map((c: Concept) => 
      `- ${c.term}: ${c.definition} (Difficulty: ${c.difficulty})`
    ).join('\n')

    const userPrompt = `Create flashcards for these concepts:

${conceptsText}

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Create engaging questions that test understanding. Remember to respond with ONLY a valid JSON object.`

    const response = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ])

    const result = parseJSONResponse<{
      flashcards: Array<{
        id: string
        question: string
        answer: string
        difficulty: 'easy' | 'medium' | 'hard'
      }>
    }>(response)

    // Add unique IDs and default values
    result.flashcards = result.flashcards.map((card, index) => ({
      ...card,
      id: `flashcard-${Date.now()}-${index}`,
      timesReviewed: 0
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Generate Flashcards API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate flashcards' },
      { status: 500 }
    )
  }
}
