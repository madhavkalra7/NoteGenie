import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI, parseJSONResponse } from '@/lib/openai'

const SYSTEM_PROMPT = `You are DoodleBot, a fun AI study companion. Summarize notes in JSON format.

IMPORTANT: Respond with ONLY valid JSON, no other text.

Required format:
{"oneLiner":"Catchy summary with emoji 🎯","shortSummary":"2-3 sentence overview","detailedBullets":["Point 1 [Doodle: icon]","Point 2","Point 3"]}

Be friendly, use simple language and fun analogies.`

export async function POST(request: NextRequest) {
  try {
    const { rawText, title } = await request.json()

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'rawText is required' },
        { status: 400 }
      )
    }

    // Limit text length to avoid token issues
    const truncatedText = rawText.slice(0, 8000)

    const userPrompt = `Summarize these notes${title ? ` (${title})` : ''}:

${truncatedText}

Respond with ONLY valid JSON.`

    const response = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ])

    const result = parseJSONResponse<{
      oneLiner: string
      shortSummary: string
      detailedBullets: string[]
    }>(response)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Summarize API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to summarize notes' },
      { status: 500 }
    )
  }
}
