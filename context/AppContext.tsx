'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, db, DbSummary, DbFlashcard, DbConcept, DbQuestion, DbStudyTask } from '@/lib/supabase'

interface AppState {
  user: User | null
  summaries: DbSummary[]
  flashcards: DbFlashcard[]
  concepts: DbConcept[]
  questions: DbQuestion[]
  studyPlan: DbStudyTask[]
  stats: {
    notesProcessed: number
    flashcardsGenerated: number
    quizzesTaken: number
  }
  historyByDate: Record<string, { id: string; title: string; one_liner: string; created_at: string }[]>
}

interface AppContextType {
  state: AppState
  isHydrated: boolean
  isLoading: boolean
  isReady: boolean  // True when auth checked AND data loaded
  // Auth
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  // Data operations
  addSummary: (summary: Omit<DbSummary, 'id' | 'created_at' | 'user_id'>) => Promise<DbSummary | null>
  addFlashcards: (flashcards: Omit<DbFlashcard, 'id' | 'created_at' | 'user_id'>[], summaryId?: string) => Promise<void>
  addConcepts: (concepts: Omit<DbConcept, 'id' | 'created_at' | 'user_id'>[], summaryId?: string) => Promise<void>
  addQuestions: (questions: Omit<DbQuestion, 'id' | 'created_at' | 'user_id'>[], summaryId?: string) => Promise<void>
  setStudyPlan: (plan: Omit<DbStudyTask, 'id' | 'created_at' | 'user_id'>[]) => Promise<void>
  updateStudyTask: (id: string, updates: Partial<DbStudyTask>) => Promise<void>
  updateFlashcard: (id: string, updates: Partial<DbFlashcard>) => Promise<void>
  updateStats: (updates: Partial<AppState['stats']>) => Promise<void>
  getSummaryWithData: (summaryId: string) => Promise<any>
  refreshData: () => Promise<void>
  clearAll: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const initialState: AppState = {
  user: null,
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
  historyByDate: {},
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState)
  const [isReady, setIsReady] = useState(false)

  // Load user data from Supabase
  const loadUserData = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Loading data for user:', userId)
      
      const [summariesRes, flashcardsRes, conceptsRes, questionsRes, studyPlanRes, statsRes, historyRes, profileRes] = await Promise.all([
        db.getSummaries(userId),
        db.getFlashcards(userId),
        db.getConcepts(userId),
        db.getQuestions(userId),
        db.getStudyPlan(userId),
        db.getStats(userId),
        db.getHistoryByDate(userId),
        supabase.from('profiles').select('name').eq('id', userId).single(),
      ])

      // Log any errors
      if (summariesRes.error) console.error('❌ Error loading summaries:', summariesRes.error.message)
      if (flashcardsRes.error) console.error('❌ Error loading flashcards:', flashcardsRes.error.message)
      if (conceptsRes.error) console.error('❌ Error loading concepts:', conceptsRes.error.message)
      if (profileRes.error) console.error('❌ Error loading profile:', profileRes.error.message)

      console.log('✅ Data loaded - Summaries:', summariesRes.data?.length || 0, 'Flashcards:', flashcardsRes.data?.length || 0, 'Profile:', profileRes.data?.name || 'No name')

      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, user_metadata: { ...prev.user.user_metadata, name: profileRes.data?.name || prev.user.email } } : prev.user,
        summaries: summariesRes.data || [],
        flashcards: flashcardsRes.data || [],
        concepts: conceptsRes.data || [],
        questions: questionsRes.data || [],
        studyPlan: studyPlanRes.data || [],
        stats: statsRes.data ? {
          notesProcessed: statsRes.data.notes_processed || 0,
          flashcardsGenerated: statsRes.data.flashcards_generated || 0,
          quizzesTaken: statsRes.data.quizzes_taken || 0,
        } : initialState.stats,
        historyByDate: historyRes.data || {},
      }))
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }, [])

  // Initialize auth state - simple version
  useEffect(() => {
    let mounted = true
    
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (session?.user) {
          setState(prev => ({ ...prev, user: session.user }))
          await loadUserData(session.user.id)
        }
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        if (mounted) setIsReady(true)
      }
    }

    init()

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      if (event === 'SIGNED_IN' && session?.user) {
        setState(prev => ({ ...prev, user: session.user }))
        await loadUserData(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setState(initialState)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setState(prev => ({ ...prev, user: session.user }))
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserData])

  // Auth functions
  const signIn = async (email: string, password: string) => {
    const { error } = await db.signInWithEmail(email, password)
    return { error }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await db.signUpWithEmail(email, password, name)
    return { error }
  }

  const signInWithGoogle = async () => {
    await db.signInWithGoogle()
  }

  const signOut = async () => {
    console.log('🟡 AppContext signOut called')
    try {
      console.log('🟡 Calling db.signOut()')
      const result = await db.signOut()
      if (result && 'error' in result && result.error) {
        console.error('❌ DB Logout error:', result.error)
      } else {
        console.log('✅ DB signOut successful')
      }
    } catch (err) {
      console.error('❌ Logout exception:', err)
    } finally {
      console.log('🟡 Resetting state')
      setState(initialState)
    }
  }

  // Data operations
  const addSummary = async (summary: Omit<DbSummary, 'id' | 'created_at' | 'user_id'>): Promise<DbSummary | null> => {
    if (!state.user) {
      console.error('❌ Cannot add summary: No user logged in')
      return null
    }

    console.log('📝 Adding summary to Supabase...', { title: summary.title, userId: state.user.id })

    const { data, error } = await db.addSummary({
      ...summary,
      user_id: state.user.id,
    })

    if (error) {
      console.error('❌ Supabase Error adding summary:', error.message, error.details, error.hint)
      alert('Failed to save summary: ' + error.message)
      return null
    }

    console.log('✅ Summary saved successfully:', data?.id)

    if (data) {
      setState(prev => ({
        ...prev,
        summaries: [data, ...prev.summaries],
        stats: {
          ...prev.stats,
          notesProcessed: prev.stats.notesProcessed + 1,
        },
      }))

      // Update stats in DB
      await db.updateStats(state.user.id, {
        notes_processed: state.stats.notesProcessed + 1,
      })

      // Refresh history
      const historyRes = await db.getHistoryByDate(state.user.id)
      if (historyRes.data) {
        setState(prev => ({ ...prev, historyByDate: historyRes.data! }))
      }
    }

    return data
  }

  const addFlashcards = async (flashcards: Omit<DbFlashcard, 'id' | 'created_at' | 'user_id'>[], summaryId?: string) => {
    if (!state.user) {
      console.error('❌ Cannot add flashcards: No user')
      return
    }

    console.log('📝 Adding', flashcards.length, 'flashcards to Supabase...')

    const flashcardsWithUser = flashcards.map(f => ({
      ...f,
      user_id: state.user!.id,
      summary_id: summaryId || null,
    }))

    const { data, error } = await db.addFlashcards(flashcardsWithUser as any)

    if (error) {
      console.error('❌ Error adding flashcards:', error.message)
      return
    }

    console.log('✅ Flashcards added to DB:', data?.length)

    if (data) {
      setState(prev => ({
        ...prev,
        flashcards: [...data, ...prev.flashcards],
        stats: {
          ...prev.stats,
          flashcardsGenerated: prev.stats.flashcardsGenerated + data.length,
        },
      }))

      await db.updateStats(state.user.id, {
        flashcards_generated: state.stats.flashcardsGenerated + data.length,
      })
    }
  }

  const addConcepts = async (concepts: Omit<DbConcept, 'id' | 'created_at' | 'user_id'>[], summaryId?: string) => {
    if (!state.user) return

    const conceptsWithUser = concepts.map(c => ({
      ...c,
      user_id: state.user!.id,
      summary_id: summaryId || null,
    }))

    const { data, error } = await db.addConcepts(conceptsWithUser as any)

    if (error) {
      console.error('Error adding concepts:', error)
      return
    }

    if (data) {
      setState(prev => ({
        ...prev,
        concepts: [...data, ...prev.concepts],
      }))
    }
  }

  const addQuestions = async (questions: Omit<DbQuestion, 'id' | 'created_at' | 'user_id'>[], summaryId?: string) => {
    if (!state.user) return

    const questionsWithUser = questions.map(q => ({
      ...q,
      user_id: state.user!.id,
      summary_id: summaryId || null,
    }))

    const { data, error } = await db.addQuestions(questionsWithUser as any)

    if (error) {
      console.error('Error adding questions:', error)
      return
    }

    if (data) {
      setState(prev => ({
        ...prev,
        questions: [...data, ...prev.questions],
      }))
    }
  }

  const setStudyPlan = async (plan: Omit<DbStudyTask, 'id' | 'created_at' | 'user_id'>[]) => {
    if (!state.user) return

    const planWithUser = plan.map(t => ({
      ...t,
      user_id: state.user!.id,
    }))

    const { data, error } = await db.setStudyPlan(state.user.id, planWithUser as any)

    if (error) {
      console.error('Error setting study plan:', error)
      return
    }

    if (data) {
      setState(prev => ({
        ...prev,
        studyPlan: data,
      }))
    }
  }

  const updateStudyTask = async (id: string, updates: Partial<DbStudyTask>) => {
    const { data, error } = await db.updateStudyTask(id, updates)

    if (error) {
      console.error('Error updating study task:', error)
      return
    }

    if (data) {
      setState(prev => ({
        ...prev,
        studyPlan: prev.studyPlan.map(t => t.id === id ? data : t),
      }))
    }
  }

  const updateFlashcard = async (id: string, updates: Partial<DbFlashcard>) => {
    const { data, error } = await db.updateFlashcard(id, updates)

    if (error) {
      console.error('Error updating flashcard:', error)
      return
    }

    if (data) {
      setState(prev => ({
        ...prev,
        flashcards: prev.flashcards.map(f => f.id === id ? data : f),
      }))
    }
  }

  const updateStats = async (updates: Partial<AppState['stats']>) => {
    if (!state.user) return

    setState(prev => ({
      ...prev,
      stats: { ...prev.stats, ...updates },
    }))

    await db.updateStats(state.user.id, {
      notes_processed: updates.notesProcessed ?? state.stats.notesProcessed,
      flashcards_generated: updates.flashcardsGenerated ?? state.stats.flashcardsGenerated,
      quizzes_taken: updates.quizzesTaken ?? state.stats.quizzesTaken,
    })
  }

  const getSummaryWithData = async (summaryId: string) => {
    return db.getSummaryWithRelations(summaryId)
  }

  const refreshData = async () => {
    if (state.user) {
      await loadUserData(state.user.id)
    }
  }

  const clearAll = () => {
    setState(prev => ({ ...prev, ...initialState, user: prev.user }))
  }

  return (
    <AppContext.Provider
      value={{
        state,
        isHydrated: isReady,
        isLoading: !isReady,
        isReady,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        addSummary,
        addFlashcards,
        addConcepts,
        addQuestions,
        setStudyPlan,
        updateStudyTask,
        updateFlashcard,
        updateStats,
        getSummaryWithData,
        refreshData,
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
