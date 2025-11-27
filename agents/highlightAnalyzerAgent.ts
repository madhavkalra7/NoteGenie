import {
  HighlightAnalyzerInput,
  HighlightAnalyzerOutput,
} from './types'

/**
 * Highlight Analyzer Agent
 * Detects and extracts highlighted portions from images using Google Gemini Vision API
 */

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function analyzeHighlights(
  input: HighlightAnalyzerInput
): Promise<HighlightAnalyzerOutput> {
  console.log('[HighlightAnalyzerAgent] Analyzing highlights with Gemini Vision...')

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    console.warn('[HighlightAnalyzerAgent] GEMINI_API_KEY not set, returning placeholder')
    return {
      highlightedLines: ['Gemini API key not configured.', 'Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env file.', 'Get your free API key from: https://makersuite.google.com/app/apikey'],
      summary: 'API key required for highlight detection.',
    }
  }

  try {
    let base64Image: string
    let mimeType: string = 'image/jpeg'

    if (input.imageFile instanceof File) {
      base64Image = await fileToBase64(input.imageFile)
      mimeType = input.imageFile.type || 'image/jpeg'
    } else if (typeof input.imageFile === 'string') {
      if (input.imageFile.startsWith('data:')) {
        const parts = input.imageFile.split(',')
        base64Image = parts[1]
        mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
      } else {
        base64Image = input.imageFile
      }
    } else {
      throw new Error('Invalid image input')
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this image and identify all highlighted text (text marked with highlighter, underlined, circled, or otherwise emphasized).

Instructions:
1. Look for text that appears highlighted (yellow, pink, green, or any color highlighting)
2. Look for underlined or circled text
3. Look for text with boxes around it or arrows pointing to it
4. Extract ONLY the emphasized/highlighted portions

Respond in this exact JSON format:
{
  "highlightedLines": ["line 1", "line 2", ...],
  "summary": "Brief summary of the key highlighted points"
}

If no highlights are found, return empty highlightedLines array with appropriate summary.`,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          highlightedLines: parsed.highlightedLines || [],
          summary: parsed.summary || 'No summary available',
        }
      }
    } catch {
      // If JSON parsing fails, extract lines manually
      const lines = responseText.split('\n').filter((line: string) => line.trim())
      return {
        highlightedLines: lines.slice(0, -1),
        summary: lines[lines.length - 1] || 'Highlights extracted from image',
      }
    }

    return {
      highlightedLines: [],
      summary: 'No highlighted text detected in the image.',
    }
  } catch (error) {
    console.error('[HighlightAnalyzerAgent] Error:', error)
    return {
      highlightedLines: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      summary: 'Failed to analyze highlights.',
    }
  }
}
