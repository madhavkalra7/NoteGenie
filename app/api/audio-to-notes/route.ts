import { NextRequest, NextResponse } from 'next/server'
import { convertAudioToNotes } from '@/agents/audioToNotesAgent'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Convert File to format expected by Groq
    const result = await convertAudioToNotes({ audioFile })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[AudioToNotes API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process audio' },
      { status: 500 }
    )
  }
}
