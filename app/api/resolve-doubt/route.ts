import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI, parseJSONResponse } from '@/lib/openai'

// Smart prompt that handles both casual chat and study doubts
const SYSTEM_PROMPT = `You are DoodleBot 🤖, a friendly AI assistant.

IMPORTANT: First determine if the user is asking a STUDY/ACADEMIC doubt or just having CASUAL CHAT.

FOR CASUAL CHAT (greetings, general questions, chitchat):
Respond with this JSON:
{
  "type": "chat",
  "reply": "Your friendly short response here"
}

FOR STUDY/ACADEMIC DOUBTS (when they ask to explain concepts, solve problems, understand topics):
Respond with this JSON:
{
  "type": "doubt",
  "simpleExplanation": "2-3 sentence explanation",
  "detailedExplanation": "Comprehensive explanation with examples",
  "analogy": "Creative real-world analogy",
  "oneLiner": "One catchy sentence",
  "stepByStep": ["Step 1", "Step 2", "Step 3"]
}

Examples of CASUAL: "hi", "hello", "how are you", "what can you do", "thanks", "bye"
Examples of STUDY DOUBTS: "explain photosynthesis", "what is gravity", "how does recursion work"

YOU MUST respond with ONLY valid JSON. Be friendly and encouraging!`

export async function POST(request: NextRequest) {
  try {
    const { doubt, context } = await request.json()

    if (!doubt || typeof doubt !== 'string') {
      return NextResponse.json(
        { error: 'doubt is required' },
        { status: 400 }
      )
    }

    const userPrompt = context 
      ? `User message: ${doubt}\n\nContext from their notes:\n${context}\n\nRespond appropriately based on whether this is casual chat or a study doubt.`
      : `User message: ${doubt}\n\nRespond appropriately - if it's casual chat, keep it short and friendly. If it's a study question, provide detailed explanation.`

    const response = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ], { max_completion_tokens: 2000 })

    const result = parseJSONResponse<any>(response)

    // If it's casual chat, return simple format
    if (result.type === 'chat') {
      return NextResponse.json({
        type: 'chat',
        reply: result.reply
      })
    }

    // Otherwise return full doubt explanation
    return NextResponse.json({
      type: 'doubt',
      simpleExplanation: result.simpleExplanation,
      detailedExplanation: result.detailedExplanation,
      analogy: result.analogy,
      oneLiner: result.oneLiner,
      stepByStep: result.stepByStep
    })
  } catch (error) {
    console.error('Resolve Doubt API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resolve doubt' },
      { status: 500 }
    )
  }
}
