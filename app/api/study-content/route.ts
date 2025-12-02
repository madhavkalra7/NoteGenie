import { NextRequest, NextResponse } from 'next/server'
import { generateStudyContent } from '@/agents/studyContentAgent'

export async function POST(request: NextRequest) {
  try {
    const { topics, day } = await request.json()

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ error: 'Topics array required' }, { status: 400 })
    }

    const content = await generateStudyContent(topics, day)
    
    return NextResponse.json({ 
      success: true, 
      content
    })

  } catch (error) {
    console.error('Study content generation error:', error)
    return NextResponse.json({ error: 'Failed to generate study content' }, { status: 500 })
  }
}
