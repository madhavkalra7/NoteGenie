import {
  AudioToNotesInput,
  AudioToNotesOutput,
} from './types'
import { summarizeNotes } from './summarizerAgent'

/**
 * Audio to Notes Agent
 * Transcribes audio, cleans it, and structures into notes
 */
export async function convertAudioToNotes(
  input: AudioToNotesInput
): Promise<AudioToNotesOutput> {
  // TODO: Call speech-to-text API (Whisper, Google Speech, etc.)
  
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Mock transcription
  const mockTranscription = `Um, so today we're going to talk about, like, machine learning, okay? 
  So basically, um, machine learning is, you know, a subset of AI. 
  It's like, basically the computer learns from data without being explicitly programmed, right? 
  So, um, there are different types, like supervised learning where you have labeled data, 
  and unsupervised learning where, um, the data isn't labeled. 
  Neural networks are, like, inspired by the human brain and, um, they're really powerful for complex tasks.`

  // Clean filler words
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'okay', 'right', 'so,']
  let cleanedText = mockTranscription
  fillerWords.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b,?\\s*`, 'gi')
    cleanedText = cleanedText.replace(regex, '')
  })
  
  // Structure into proper notes
  const structuredNotes = cleanedText
    .split('.')
    .filter(s => s.trim().length > 0)
    .map(sentence => `• ${sentence.trim()}.`)
    .join('\n')

  // Generate summary using summarizer agent
  const summary = await summarizeNotes({ rawText: cleanedText })

  return {
    transcription: mockTranscription,
    cleanedText,
    structuredNotes: `# Lecture Notes\n\n${structuredNotes}`,
    summary,
  }
}
