import {
  HandwritingOCRInput,
  HandwritingOCROutput,
} from './types'

/**
 * Handwriting OCR Agent
 * Extracts text from handwritten note images using Google Gemini Vision API
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

function getMimeType(file: File): string {
  // Return the actual MIME type, or infer from extension
  if (file.type) return file.type
  
  const ext = file.name.toLowerCase().split('.').pop()
  const mimeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'txt': 'text/plain',
  }
  return mimeMap[ext || ''] || 'application/octet-stream'
}

export async function extractHandwriting(
  input: HandwritingOCRInput
): Promise<HandwritingOCROutput> {
  console.log('[HandwritingOCRAgent] Processing image with Gemini Vision...')

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    console.warn('[HandwritingOCRAgent] GEMINI_API_KEY not set, returning placeholder')
    return {
      extractedText: 'Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env file.\n\nGet your free API key from: https://makersuite.google.com/app/apikey',
      confidence: 0.0,
    }
  }

  try {
    let base64Data: string
    let mimeType: string

    if (input.imageFile instanceof File) {
      base64Data = await fileToBase64(input.imageFile)
      mimeType = getMimeType(input.imageFile)
    } else if (typeof input.imageFile === 'string') {
      // If it's already a base64 string or URL
      if (input.imageFile.startsWith('data:')) {
        const parts = input.imageFile.split(',')
        base64Data = parts[1]
        mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
      } else {
        base64Data = input.imageFile
        mimeType = 'image/jpeg'
      }
    } else {
      throw new Error('Invalid file input')
    }

    // Determine the prompt based on file type
    const isDocument = mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('document')
    const isImage = mimeType.startsWith('image/')

    const extractionPrompt = isDocument 
      ? `You are an expert document reader. Extract ALL text content from this document.

Instructions:
1. Read and transcribe every word visible in the document
2. Maintain the original structure, paragraphs, and formatting
3. If there are bullet points, numbers, headings, or sections, preserve them
4. Include all text from tables, lists, and any other elements
5. Return ONLY the extracted text, no explanations or commentary

Extracted text:`
      : `You are an expert OCR system. Extract ALL text from this ${isImage ? 'handwritten image' : 'file'}.

Instructions:
1. Read and transcribe every word visible in the image
2. Maintain the original structure and formatting
3. If there are bullet points, numbers, or headings, preserve them
4. If any text is unclear, make your best guess and mark it with [unclear]
5. Return ONLY the extracted text, no explanations

Extracted text:`

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
                  text: extractionPrompt,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    )

    console.log('[HandwritingOCRAgent] Gemini response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return {
      extractedText: extractedText.trim(),
      confidence: 0.9, // Gemini typically has high accuracy
    }
  } catch (error) {
    console.error('[HandwritingOCRAgent] Error:', error)
    return {
      extractedText: `Error extracting text: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0.0,
    }
  }
}
