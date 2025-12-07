import Groq from 'groq-sdk'
import { Innertube } from 'youtubei.js'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export interface YouTubeTranscript {
  text: string
  duration: number
  title: string
}

export interface YouTubeSummary {
  title: string
  oneLiner: string
  shortSummary: string
  detailedBullets: string[]
  keyTimestamps?: Array<{ time: string; topic: string }>
  mainTopics: string[]
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Fetch YouTube video transcript using youtubei.js
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<YouTubeTranscript> {
  try {
    console.log('📥 Fetching captions for video:', videoId)
    
    const youtube = await Innertube.create()
    const info = await youtube.getInfo(videoId)
    
    const title = info.basic_info.title || 'YouTube Video'
    
    // Get transcript
    const transcriptData = await info.getTranscript()
    
    if (!transcriptData || !transcriptData.transcript || !transcriptData.transcript.content) {
      throw new Error('NO_CAPTIONS')
    }

    console.log('✅ Captions found!')

    // Combine all text segments
    const content = transcriptData.transcript.content
    const fullText = content?.body?.initial_segments
      ?.map((segment: any) => segment.snippet.text)
      .join(' ') || ''

    if (!fullText) {
      throw new Error('NO_CAPTIONS')
    }

    const duration = Math.floor((info.basic_info.duration || 0))

    return {
      text: fullText,
      duration: duration,
      title: title
    }
  } catch (error: any) {
    console.error('❌ Caption fetch error:', error)
    
    if (error.message === 'NO_CAPTIONS' || error.message.includes('Transcript') || error.message.includes('captions')) {
      throw new Error('This video does not have captions/subtitles available. Please try a video with CC enabled.')
    }
    
    if (error.message.includes('Video unavailable')) {
      throw new Error('Video not found or unavailable. Please check the URL and try again.')
    }
    
    throw new Error('Failed to fetch video data. Please ensure the video is public and accessible.')
  }
}

/**
 * Generate structured notes from YouTube transcript using Groq
 */
export async function generateYouTubeNotes(
  transcript: string,
  videoTitle: string
): Promise<YouTubeSummary> {
  const prompt = `You are an expert note-taker. Analyze this YouTube video transcript and create comprehensive study notes.

Video Title: ${videoTitle}

Transcript:
${transcript}

Create structured notes with:
1. A catchy one-liner summary (max 15 words)
2. A short summary (2-3 sentences)
3. Detailed bullet points covering all main concepts
4. List of main topics covered
5. Key timestamps with topics (if you can identify time references)

Respond in JSON format:
{
  "title": "Improved title for notes",
  "oneLiner": "One sentence summary",
  "shortSummary": "2-3 sentence overview",
  "detailedBullets": ["bullet 1", "bullet 2", ...],
  "mainTopics": ["topic1", "topic2", ...],
  "keyTimestamps": [{"time": "0:00", "topic": "Introduction"}, ...]
}

Make it student-friendly and easy to review for exams.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const result = completion.choices[0]?.message?.content
    if (!result) throw new Error('No response from Groq')

    const summary: YouTubeSummary = JSON.parse(result)
    return summary
  } catch (error) {
    console.error('YouTube notes generation error:', error)
    throw new Error('Failed to generate notes from video')
  }
}

/**
 * Main agent: YouTube URL to summarized notes
 */
export async function youtubeToNotes(youtubeUrl: string): Promise<YouTubeSummary> {
  // Extract video ID
  const videoId = extractVideoId(youtubeUrl)
  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  // Fetch transcript
  const transcript = await fetchYouTubeTranscript(videoId)

  // Generate notes
  const notes = await generateYouTubeNotes(transcript.text, transcript.title)

  return notes
}
