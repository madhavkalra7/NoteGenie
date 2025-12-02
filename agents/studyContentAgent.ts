import { callOpenAI } from '@/lib/openai'

interface StudyContent {
  topics: {
    name: string
    explanation: string
    keyPoints: string[]
    examples: string[]
  }[]
  mcqs: {
    question: string
    options: string[]
    correctAnswer: number // 0-3 index
    explanation: string
  }[]
}

export async function generateStudyContent(topics: string[], day: number): Promise<StudyContent> {
  const prompt = `You are an expert tutor. Generate comprehensive study content for Day ${day} covering these topics: ${topics.join(', ')}

For each topic, provide:
1. A clear, detailed explanation (2-3 paragraphs)
2. 3-5 key points to remember
3. 1-2 real-world examples

After the content, generate exactly 3 MCQ questions to test understanding of ALL topics covered.

Respond in this exact JSON format:
{
  "topics": [
    {
      "name": "Topic Name",
      "explanation": "Detailed explanation here...",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "examples": ["Example 1", "Example 2"]
    }
  ],
  "mcqs": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct..."
    }
  ]
}

Make the content educational, engaging, and easy to understand. The MCQs should test real understanding, not just memorization. Return ONLY valid JSON, no additional text.`

  const response = await callOpenAI([
    { role: 'system', content: 'You are an expert educational content creator. Always respond with valid JSON only.' },
    { role: 'user', content: prompt }
  ])

  try {
    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = response.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7)
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3)
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3)
    }
    
    const content = JSON.parse(cleanedResponse.trim())
    
    // Validate structure
    if (!content.topics || !Array.isArray(content.topics)) {
      throw new Error('Invalid topics structure')
    }
    if (!content.mcqs || !Array.isArray(content.mcqs) || content.mcqs.length < 3) {
      throw new Error('Invalid MCQs structure')
    }
    
    return content
  } catch (parseError) {
    console.error('Failed to parse study content:', parseError)
    console.error('Raw response:', response)
    
    // Return fallback content
    return {
      topics: topics.map(topic => ({
        name: topic,
        explanation: `This section covers ${topic}. The AI is currently unable to generate detailed content. Please try again or use your own study materials for this topic.`,
        keyPoints: [
          `Understand the core concepts of ${topic}`,
          `Practice with examples related to ${topic}`,
          `Review and revise ${topic} regularly`
        ],
        examples: [`Real-world application of ${topic}`]
      })),
      mcqs: [
        {
          question: `What is the main focus of ${topics[0]}?`,
          options: [
            'Understanding core concepts',
            'Memorizing facts',
            'Skipping practice',
            'Ignoring examples'
          ],
          correctAnswer: 0,
          explanation: 'Understanding core concepts is essential for mastering any topic.'
        },
        {
          question: 'What is the best approach to studying?',
          options: [
            'Cramming before exams',
            'Regular practice and review',
            'Only reading notes',
            'Skipping difficult topics'
          ],
          correctAnswer: 1,
          explanation: 'Regular practice and review helps in long-term retention.'
        },
        {
          question: 'How can you test your understanding?',
          options: [
            'By explaining concepts to others',
            'By just reading passively',
            'By avoiding questions',
            'By memorizing without understanding'
          ],
          correctAnswer: 0,
          explanation: 'Explaining concepts to others helps identify gaps in understanding.'
        }
      ]
    }
  }
}
