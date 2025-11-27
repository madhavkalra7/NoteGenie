import {
  QuestionMakerInput,
  QuestionMakerOutput,
  Question,
} from './types'

/**
 * Question Maker Agent
 * Generates MCQs, short answer, and true/false questions
 */
export async function generateQuestions(
  input: QuestionMakerInput
): Promise<QuestionMakerOutput> {
  // TODO: Call AI API to generate diverse questions
  
  await new Promise(resolve => setTimeout(resolve, 1300))

  const questions: Question[] = []
  const targetDifficulty = input.difficulty || 'medium'
  const count = input.count || 5

  // Generate MCQs
  input.concepts.slice(0, 2).forEach((concept, index) => {
    questions.push({
      id: `q-mcq-${Date.now()}-${index}`,
      type: 'mcq',
      question: `What best describes ${concept.term}?`,
      options: [
        concept.definition,
        'An unrelated concept from another field',
        'A type of programming language',
        'A hardware component',
      ],
      correctAnswer: concept.definition,
      explanation: `${concept.term} is defined as: ${concept.definition}`,
      difficulty: concept.difficulty,
    })
  })

  // Generate True/False
  if (input.concepts.length > 0) {
    questions.push({
      id: `q-tf-${Date.now()}`,
      type: 'truefalse',
      question: `${input.concepts[0]?.term} is a fundamental concept in this domain.`,
      correctAnswer: 'true',
      explanation: 'This is a key concept discussed in the notes.',
      difficulty: 'easy',
    })
  }

  // Generate Short Answer
  if (input.concepts.length > 1) {
    questions.push({
      id: `q-short-${Date.now()}`,
      type: 'short',
      question: `Explain how ${input.concepts[0]?.term} relates to ${input.concepts[1]?.term}`,
      correctAnswer: `${input.concepts[0]?.term} and ${input.concepts[1]?.term} are related concepts where the former provides foundational understanding for the latter.`,
      difficulty: targetDifficulty,
    })
  }

  return {
    questions: questions.slice(0, count),
  }
}
