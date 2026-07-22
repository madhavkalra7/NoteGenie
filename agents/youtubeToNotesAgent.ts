import Groq from 'groq-sdk'
import { YoutubeTranscript } from 'youtube-transcript'
import { Innertube } from 'youtubei.js'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export interface YouTubeTranscript {
  text: string
  timestampedText: string
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
 * Format milliseconds to mm:ss timestamp string
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Fetch video title via YouTube oEmbed API
 */
async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
    if (res.ok) {
      const data = await res.json()
      if (data.title) return data.title
    }
  } catch (err) {
    console.warn('Could not fetch video title via oEmbed:', err)
  }
  return 'YouTube Video'
}

/**
 * Fetch YouTube video transcript using multi-strategy fallback
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<YouTubeTranscript> {
  const title = await fetchVideoTitle(videoId)

  // Strategy 1: youtube-transcript package with timestamp metadata
  try {
    console.log('📥 Strategy 1: Fetching captions using YoutubeTranscript for video:', videoId)
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId)
    
    if (transcriptItems && transcriptItems.length > 0) {
      const fullText = transcriptItems.map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim()
      
      // Build timestamped transcript text
      const timestampedText = transcriptItems
        .map((item) => `[${formatTime(item.offset || 0)}] ${item.text}`)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (fullText) {
        console.log('✅ Captions found via Strategy 1 with timestamps! Length:', fullText.length)
        return {
          text: fullText,
          timestampedText: timestampedText,
          duration: Math.ceil((transcriptItems[transcriptItems.length - 1]?.offset || 0) / 1000),
          title
        }
      }
    }
  } catch (err: any) {
    console.warn('Strategy 1 failed, trying Strategy 2 (youtubei.js):', err.message)
  }

  // Strategy 2: youtubei.js
  try {
    console.log('📥 Strategy 2: Fetching captions using Innertube for video:', videoId)
    const youtube = await Innertube.create()
    const info = await youtube.getInfo(videoId)
    const videoTitle = info.basic_info.title || title

    const transcriptData = await info.getTranscript()
    const segments = transcriptData?.transcript?.content?.body?.initial_segments || []
    
    const fullText = segments
      .map((segment: any) => segment.snippet.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    const timestampedText = segments
      .map((segment: any) => `[${formatTime(segment.start_ms || 0)}] ${segment.snippet.text}`)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (fullText) {
      console.log('✅ Captions found via Strategy 2! Length:', fullText.length)
      return {
        text: fullText,
        timestampedText: timestampedText || fullText,
        duration: Math.floor(info.basic_info.duration || 0),
        title: videoTitle
      }
    }
  } catch (err: any) {
    console.warn('Strategy 2 failed:', err.message)
  }

  throw new Error('This video does not have captions/subtitles available or is private. Please try another YouTube video with CC enabled.')
}

/**
 * Generate structured notes from YouTube transcript using Groq
 */
export async function generateYouTubeNotes(
  timestampedTranscript: string,
  videoTitle: string
): Promise<YouTubeSummary> {
  const prompt = `You are an expert note-taker and study assistant. Analyze this YouTube video transcript (which includes [mm:ss] timestamp markers) and create comprehensive study notes.

Video Title: ${videoTitle}

Timestamped Transcript:
${timestampedTranscript}

Create structured notes with:
1. A catchy one-liner summary (max 15 words)
2. A short summary (2-3 sentences)
3. Detailed bullet points covering all main concepts
4. List of main topics covered
5. Key timestamps with topics: IMPORTANT - Extract exact timestamps from the [mm:ss] markers in the transcript corresponding to when each major section or topic begins (e.g. "0:12", "1:45", "3:20"). Do NOT estimate or guess rounded timestamps.

Respond in JSON format:
{
  "title": "Improved title for notes",
  "oneLiner": "One sentence summary",
  "shortSummary": "2-3 sentence overview",
  "detailedBullets": ["bullet 1", "bullet 2", ...],
  "mainTopics": ["topic1", "topic2", ...],
  "keyTimestamps": [{"time": "0:12", "topic": "Real-life HR Assistant Example"}, ...]
}

Make it student-friendly and easy to review for exams.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const result = completion.choices[0]?.message?.content
    if (!result) throw new Error('No response from Groq')

    const summary: YouTubeSummary = JSON.parse(result)
    return summary
  } catch (error) {
    console.error('YouTube notes generation error:', error)
    throw new Error('Failed to generate notes from video transcript')
  }
}

/**
 * Main agent: YouTube URL to summarized notes
 */
export async function youtubeToNotes(youtubeUrl: string): Promise<YouTubeSummary> {
  const videoId = extractVideoId(youtubeUrl)
  if (!videoId) {
    throw new Error('Invalid YouTube URL. Please provide a valid YouTube video link.')
  }

  const transcript = await fetchYouTubeTranscript(videoId)
  const notes = await generateYouTubeNotes(transcript.timestampedText || transcript.text, transcript.title)

  return notes
}
