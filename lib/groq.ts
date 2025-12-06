// Groq API Client Utility
// FREE API for audio transcription and text generation

import Groq from 'groq-sdk'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function callGroq(
  messages: ChatMessage[],
  model: string = 'llama-3.3-70b-versatile' // Fast and free model
): Promise<string> {
  console.log('[Groq] Calling model:', model)

  try {
    const completion = await groq.chat.completions.create({
      messages: messages as any,
      model: model,
      temperature: 0.7,
      max_tokens: 2048,
    })

    const content = completion.choices[0]?.message?.content || ''
    return content
  } catch (error) {
    console.error('[Groq] API Error:', error)
    throw new Error('Groq API call failed')
  }
}

export function parseJSONResponse<T>(response: string): T {
  try {
    // Remove markdown code blocks if present
    let cleaned = response.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('[Groq] JSON Parse Error:', error)
    console.error('Response:', response)
    throw new Error('Failed to parse Groq response as JSON')
  }
}
