import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    console.log('[ExtractPDF] Processing file:', fileName, 'Type:', file.type, 'Size:', file.size)
    
    // Handle text files
    if (file.type === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      const text = await file.text()
      console.log('[ExtractPDF] Text file extracted, length:', text.length)
      return NextResponse.json({ text })
    }

    // Handle PDF files
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        console.log('[ExtractPDF] PDF buffer size:', arrayBuffer.byteLength)
        
        // Dynamic import unpdf
        const { extractText } = await import('unpdf')
        const result = await extractText(arrayBuffer)
        
        // Handle different result formats
        let extractedText = ''
        if (typeof result.text === 'string') {
          extractedText = result.text
        } else if (Array.isArray(result.text)) {
          extractedText = result.text.join('\n')
        } else if (result.pages && Array.isArray(result.pages)) {
          extractedText = result.pages.map((p: any) => p.text || '').join('\n')
        }
        
        console.log('[ExtractPDF] PDF extracted, text length:', extractedText.length)
        console.log('[ExtractPDF] First 200 chars:', extractedText.substring(0, 200))
        
        if (!extractedText || extractedText.trim().length < 10) {
          return NextResponse.json(
            { error: 'PDF appears to be empty or contains only images/scanned content.' },
            { status: 400 }
          )
        }
        
        return NextResponse.json({ text: extractedText })
      } catch (pdfError: any) {
        console.error('[ExtractPDF] PDF parse error:', pdfError?.message || pdfError)
        return NextResponse.json(
          { error: `PDF error: ${pdfError?.message || 'Unknown error'}` },
          { status: 400 }
        )
      }
    }

    // Try to read as text for other files
    try {
      const text = await file.text()
      if (text && text.trim()) {
        return NextResponse.json({ text })
      }
    } catch {
      // Not readable as text
    }

    return NextResponse.json({ error: 'Unsupported file format.' }, { status: 400 })
  } catch (error: any) {
    console.error('[ExtractPDF] Error:', error?.message || error)
    return NextResponse.json(
      { error: error?.message || 'Failed to extract text' },
      { status: 500 }
    )
  }
}
