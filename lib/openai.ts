// OpenAI API Client Utility
// This is a server-side only module for making OpenAI API calls

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  model?: string
  max_completion_tokens?: number
}

const DEFAULT_MODEL = 'gpt-5-mini-2025-08-07'

export async function callOpenAI(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }

  const model = options.model || process.env.NEXT_PUBLIC_AI_MODEL || DEFAULT_MODEL
  
  console.log('[OpenAI] Calling model:', model)

  // Reasoning models need higher token limits (reasoning + output)
  const requestBody = {
    model,
    messages,
    max_completion_tokens: options.max_completion_tokens ?? 8000,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  const data = await response.json()
  
  if (!response.ok) {
    console.error('[OpenAI] API Error:', data)
    throw new Error(
      `OpenAI API error: ${response.status} - ${data.error?.message || response.statusText}`
    )
  }

  // Check finish reason
  const finishReason = data.choices?.[0]?.finish_reason
  if (finishReason === 'length') {
    console.warn('[OpenAI] Response truncated due to token limit')
  }

  const content = data.choices?.[0]?.message?.content || ''
  
  if (!content) {
    console.error('[OpenAI] Empty response. Full data:', JSON.stringify(data, null, 2))
    // For reasoning models, all tokens might be used for reasoning
    throw new Error(`Model used all tokens for reasoning. Try with shorter input.`)
  }
  
  console.log('[OpenAI] Response received, length:', content.length)
  return content
}

export function parseJSONResponse<T>(content: string): T {
  if (!content || content.trim() === '') {
    throw new Error('Empty response from AI')
  }

  // Try to extract JSON from markdown code blocks
  let jsonString = content.trim()
  
  // Check for ```json ... ``` blocks
  const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    jsonString = jsonBlockMatch[1].trim()
  }
  
  // Try to find JSON object or array pattern
  const jsonObjectMatch = jsonString.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (jsonObjectMatch) {
    jsonString = jsonObjectMatch[1]
  }
  
  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error('Failed to parse JSON response. Raw content:', content)
    console.error('Attempted to parse:', jsonString)
    throw new Error('Failed to parse AI response as JSON')
  }
}
