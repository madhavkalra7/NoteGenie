'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Summary, Flashcard, Concept, Question, StudyTask } from '@/agents/types'

interface AppState {
  summaries: Summary[];
  flashcards: Flashcard[];
  concepts: Concept[];
  questions: Question[];
  studyPlan: StudyTask[];
  stats: {
    notesProcessed: number;
    flashcardsGenerated: number;
    quizzesTaken: number;
  };
}

interface AppContextType {
  state: AppState;
  addSummary: (summary: Summary) => void;
  addFlashcards: (flashcards: Flashcard[]) => void;
  addConcepts: (concepts: Concept[]) => void;
  addQuestions: (questions: Question[]) => void;
  setStudyPlan: (plan: StudyTask[]) => void;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void;
  updateStats: (updates: Partial<AppState['stats']>) => void;
  clearAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const initialState: AppState = {
  summaries: [],
  flashcards: [],
  concepts: [],
  questions: [],
  studyPlan: [],
  stats: {
    notesProcessed: 0,
    flashcardsGenerated: 0,
    quizzesTaken: 0,
  },
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('notegenie-state')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setState(parsed)
      } catch (error) {
        console.error('Failed to parse stored state:', error)
      }
    }
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('notegenie-state', JSON.stringify(state))
  }, [state])

  const addSummary = (summary: Summary) => {
    setState(prev => ({
      ...prev,
      summaries: [summary, ...prev.summaries],
      stats: {
        ...prev.stats,
        notesProcessed: prev.stats.notesProcessed + 1,
      },
    }))
  }

  const addFlashcards = (flashcards: Flashcard[]) => {
    setState(prev => ({
      ...prev,
      flashcards: [...prev.flashcards, ...flashcards],
      stats: {
        ...prev.stats,
        flashcardsGenerated: prev.stats.flashcardsGenerated + flashcards.length,
      },
    }))
  }

  const addConcepts = (concepts: Concept[]) => {
    setState(prev => ({
      ...prev,
      concepts: [...prev.concepts, ...concepts],
    }))
  }

  const addQuestions = (questions: Question[]) => {
    setState(prev => ({
      ...prev,
      questions: [...prev.questions, ...questions],
    }))
  }

  const setStudyPlan = (plan: StudyTask[]) => {
    setState(prev => ({
      ...prev,
      studyPlan: plan,
    }))
  }

  const updateFlashcard = (id: string, updates: Partial<Flashcard>) => {
    setState(prev => ({
      ...prev,
      flashcards: prev.flashcards.map(card =>
        card.id === id ? { ...card, ...updates } : card
      ),
    }))
  }

  const updateStats = (updates: Partial<AppState['stats']>) => {
    setState(prev => ({
      ...prev,
      stats: { ...prev.stats, ...updates },
    }))
  }

  const clearAll = () => {
    setState(initialState)
    localStorage.removeItem('notegenie-state')
  }

  return (
    <AppContext.Provider
      value={{
        state,
        addSummary,
        addFlashcards,
        addConcepts,
        addQuestions,
        setStudyPlan,
        updateFlashcard,
        updateStats,
        clearAll,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
