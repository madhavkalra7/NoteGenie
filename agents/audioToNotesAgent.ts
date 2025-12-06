import {
  AudioToNotesInput,
  AudioToNotesOutput,
} from './types'
import Groq from 'groq-sdk'
import { toFile } from 'groq-sdk/uploads'
import { callGroq, parseJSONResponse } from '@/lib/groq'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const SUMMARIZER_PROMPT = `You are DoodleBot, a fun AI study companion. Summarize notes in JSON format.

IMPORTANT: Respond with ONLY valid JSON, no other text.

Required format:
{"oneLiner":"Catchy summary with emoji 🎯","shortSummary":"2-3 sentence overview","detailedBullets":["Point 1 [Doodle: icon]","Point 2","Point 3"]}

Be friendly, use simple language and fun analogies.`

/**
 * Audio to Notes Agent
 * Transcribes audio using Groq's Whisper API, cleans it, and structures into notes
 * 
 * Uses Groq's whisper-large-v3 model (FREE) for fast and accurate transcription
 */
export async function convertAudioToNotes(
  input: AudioToNotesInput
): Promise<AudioToNotesOutput> {
  console.log('[AudioToNotesAgent] Processing audio file...')

  try {
    // Transcribe audio using Groq's Whisper API
    console.log('[AudioToNotesAgent] Sending audio to Groq Whisper API...')
    
    // Convert File to the format Groq expects
    const audioFile = await toFile(input.audioFile, input.audioFile.name)
    
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'en', // Can be changed or auto-detected
      response_format: 'text',
    })

    const transcribedText = typeof transcription === 'string' ? transcription : transcription.text
    console.log('[AudioToNotesAgent] Transcription complete!')

    // Clean filler words from transcription
    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'okay', 'right', 'so,']
    let cleanedText = transcribedText
    fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b,?\\s*`, 'gi')
      cleanedText = cleanedText.replace(regex, '')
      })
  
    // Structure into proper notes
    const structuredNotes = cleanedText
      .split('.')
      .filter(s => s.trim().length > 10)
      .map(sentence => `• ${sentence.trim()}.`)
      .join('\n')

    // Generate summary using Groq (FREE)
    console.log('[AudioToNotesAgent] Generating summary with Groq...')
    const truncatedText = cleanedText.slice(0, 8000)
    const summaryPrompt = `Summarize these notes (Audio Notes):

${truncatedText}

Respond with ONLY valid JSON.`

    const summaryResponse = await callGroq([
      { role: 'system', content: SUMMARIZER_PROMPT },
      { role: 'user', content: summaryPrompt }
    ])

    const summary = parseJSONResponse<{
      oneLiner: string
      shortSummary: string
      detailedBullets: string[]
    }>(summaryResponse)

    return {
      transcription: transcribedText,
      cleanedText,
      structuredNotes: `# Lecture Notes from Audio\n\n${structuredNotes}`,
      summary: {
        oneLiner: summary.oneLiner,
        shortSummary: summary.shortSummary,
        detailedBullets: summary.detailedBullets,
      },
    }
  } catch (error) {
    console.error('[AudioToNotesAgent] Error:', error)
    throw new Error('Failed to transcribe audio. Please try again.')
  }
}
