import {
  SummarizerInput,
  SummarizerOutput,
} from './types'

/**
 * Summarizer Agent
 * Takes raw text and generates structured summaries
 */
const AI_CONFIG = {
  model: process.env.NEXT_PUBLIC_AI_MODEL,
  apiKey: process.env.OPENAI_API_KEY
}

const SYSTEM_PERSONA = `
You are 'DoodleBot', a highly intelligent, creative, and visual-thinking AI study companion.
Your goal is to break down complex academic documents into fun, digestible, and visually descriptive 'Flashcards'.

CORE INSTRUCTIONS:
1.  **Tone**: Explain things like you're a cool, smart friend. Use analogies, simple language, and a touch of humor.
2.  **Structure**: Organize content strictly by "Topic" or "Chapter".
3.  **Visuals**: Since you are text-based, DESCRIBE the doodles that should go with the concepts (e.g., "[Doodle: A cat in a box]").
4.  **Format**: Output MUST be structured for card generation.

YOU ARE NOT A BORING ACADEMIC. YOU ARE A FUN TEACHER.
`

export async function summarizeNotes(input: SummarizerInput): Promise<SummarizerOutput> {
  console.log(`[SummarizerAgent] Using Model: ${AI_CONFIG.model}`)
  console.log(`[SummarizerAgent] System Persona: ${SYSTEM_PERSONA.substring(0, 50)}...`)
  console.log(`[SummarizerAgent] Processing file: ${input.title}`)

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2500))

  // In a real implementation, the API call would look like this:
  /*
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages: [
        { role: "system", content: SYSTEM_PERSONA },
        { role: "user", content: `Summarize this text: ${input.rawText}` }
      ]
    })
  })
  */

  // Dynamic Mock Logic: Process the actual input text
  // This simulates the AI "reading" the file by extracting real content
  
  const cleanText = input.rawText.replace(/\s+/g, ' ').trim()
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.length > 10)
  
  // Fallback if text is too short
  if (sentences.length < 3) {
    return {
      oneLiner: "This file seems a bit short, but I'll do my best! 📝",
      shortSummary: `I found a document titled "${input.title}". It's brief, but every word counts!`,
      detailedBullets: [
        `Content: "${cleanText.substring(0, 100)}..."`,
        "Tip: Try uploading a longer document for a full summary!",
        "Doodle Idea: A magnifying glass looking at a crumb [Doodle: 🔍]"
      ]
    }
  }

  // Generate dynamic content based on the file
  const oneLiner = sentences[0].substring(0, 80) + (sentences[0].length > 80 ? "..." : "") + " 🚀"
  
  const shortSummary = `This document ("${input.title}") dives into key topics. It starts by discussing how ${sentences[0].toLowerCase()}. Then it moves on to explain that ${sentences[1]?.toLowerCase() || '...'}.`

  // Create "Chapters" from chunks of sentences
  const detailedBullets = []
  const chunkSize = Math.ceil(sentences.length / 4)
  
  for (let i = 0; i < 4; i++) {
    const sentenceIndex = i * chunkSize
    if (sentenceIndex < sentences.length) {
      const topicSentence = sentences[sentenceIndex].trim()
      // Add a random doodle description based on keywords (simulated)
      const doodle = i % 2 === 0 ? "[Doodle: A lightbulb moment 💡]" : "[Doodle: A complex gear system ⚙️]"
      
      detailedBullets.push(`Chapter ${i + 1}: ${topicSentence.substring(0, 60)}... ${doodle}`)
    }
  }
  
  // Add a conclusion if we have enough content
  if (sentences.length > 4) {
    detailedBullets.push(`Takeaway: ${sentences[sentences.length - 1].trim()} [Doodle: A checkered flag 🏁]`)
  }

  return {
    oneLiner,
    shortSummary,
    detailedBullets
  }
}
