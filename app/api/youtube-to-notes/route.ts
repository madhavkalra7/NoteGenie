import { NextResponse } from 'next/server'
import { youtubeToNotes } from '@/agents/youtubeToNotesAgent'

export async function POST(request: Request) {
  try {
    const { youtubeUrl } = await request.json()

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      )
    }

    console.log('🎥 Processing YouTube URL:', youtubeUrl)

    const notes = await youtubeToNotes(youtubeUrl)

    console.log('✅ YouTube notes generated successfully')

    return NextResponse.json({ notes })
  } catch (error: any) {
    console.error('❌ YouTube to notes error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process YouTube video' },
      { status: 500 }
    )
  }
}
