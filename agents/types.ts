// ============================================
// Shared Types for All AI Agents
// ============================================

export interface Concept {
  id: string;
  term: string;
  definition: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  timesReviewed: number;
  wasCorrect?: boolean;
}

export interface Question {
  id: string;
  type: 'mcq' | 'short' | 'truefalse';
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Summary {
  id: string;
  title: string;
  shortSummary: string;
  detailedBullets: string[];
  oneLiner: string;
  rawText: string;
  createdAt: Date;
}

export interface StudyTask {
  id: string;
  day: number;
  date: string; // ISO date string for DB compatibility
  topics: string[];
  duration: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface ConceptRelation {
  from: string;
  to: string;
  relationship: string;
}

// ============================================
// Agent Input/Output Interfaces
// ============================================

// Summarizer Agent
export interface SummarizerInput {
  rawText: string;
  title?: string;
}

export interface SummarizerOutput {
  shortSummary: string;
  detailedBullets: string[];
  oneLiner: string;
}

// Concept Extractor Agent
export interface ConceptExtractorInput {
  text: string;
}

export interface ConceptExtractorOutput {
  concepts: Concept[];
}

// Flashcard Agent
export interface FlashcardAgentInput {
  concepts: Concept[];
  additionalContext?: string;
}

export interface FlashcardAgentOutput {
  flashcards: Flashcard[];
}

// Question Maker Agent
export interface QuestionMakerInput {
  concepts: Concept[];
  summary: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
}

export interface QuestionMakerOutput {
  questions: Question[];
}

// Answer Validator Agent
export interface AnswerValidatorInput {
  question: string;
  userAnswer: string;
  correctAnswer: string;
}

export interface AnswerValidatorOutput {
  score: number; // 0-10
  feedback: string;
  modelAnswer: string;
  wasCorrect: boolean;
}

// Study Plan Agent
export interface StudyPlanInput {
  topics: string[];
  timePerDay: number; // minutes
  daysUntilExam: number;
  weakTopics?: string[];
}

export interface StudyPlanOutput {
  plan: StudyTask[];
  totalHours: number;
  recommendation: string;
}

// Memory Retention Agent
export interface MemoryRetentionInput {
  flashcards: Flashcard[];
  lastStudyDate?: Date;
}

export interface MemoryRetentionOutput {
  cardsToReview: Flashcard[];
  weakConcepts: string[];
  suggestions: string[];
}

// Doubt Resolver Agent
export interface DoubtResolverInput {
  doubt: string;
  context?: string;
}

export interface DoubtResolverOutput {
  type: 'chat' | 'doubt';
  // For casual chat
  reply?: string;
  // For study doubts
  simpleExplanation?: string;
  detailedExplanation?: string;
  analogy?: string;
  oneLiner?: string;
  stepByStep?: string[];
}

// Audio to Notes Agent
export interface AudioToNotesInput {
  audioFile: File;
}

export interface AudioToNotesOutput {
  transcription: string;
  cleanedText: string;
  structuredNotes: string;
  summary: SummarizerOutput;
}

// Difficulty Detector Agent
export interface DifficultyDetectorInput {
  concepts: Concept[];
}

export interface DifficultyDetectorOutput {
  taggedConcepts: Concept[];
}

// Concept Graph Agent
export interface ConceptGraphInput {
  concepts: Concept[];
}

export interface ConceptGraphOutput {
  nodes: { id: string; label: string; level: number }[];
  edges: ConceptRelation[];
}

// Handwriting OCR Agent
export interface HandwritingOCRInput {
  imageFile: File | string;
}

export interface HandwritingOCROutput {
  extractedText: string;
  confidence: number;
}

// Highlight Analyzer Agent
export interface HighlightAnalyzerInput {
  imageFile: File | string;
}

export interface HighlightAnalyzerOutput {
  highlightedLines: string[];
  summary: string;
}
