import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'notegenie-app',
    },
  },
})

// Database Types
export interface DbUser {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export interface DbSummary {
  id: string
  user_id: string
  title: string
  raw_text: string
  one_liner: string
  short_summary: string
  detailed_bullets: string[]
  created_at: string
  source_type?: 'text' | 'audio' | 'youtube'
}

export interface DbFlashcard {
  id: string
  user_id: string
  summary_id: string | null
  question: string
  answer: string
  concept_id: string | null
  times_reviewed: number
  was_correct: boolean | null
  last_reviewed: string | null
  created_at: string
}

export interface DbConcept {
  id: string
  user_id: string
  summary_id: string | null
  term: string
  definition: string
  category: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
}

export interface DbQuestion {
  id: string
  user_id: string
  summary_id: string | null
  question: string
  type: 'mcq' | 'short' | 'truefalse'
  options: string[] | null
  correct_answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
}

export interface DbStudyTask {
  id: string
  user_id: string
  day: number
  topics: string[]
  duration: number
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  date: string
  created_at: string
}

export interface DbStats {
  id: string
  user_id: string
  notes_processed: number
  flashcards_generated: number
  quizzes_taken: number
  updated_at: string
}

// Helper functions for database operations
export const db = {
  // Auth
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async signInWithEmail(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  },

  async signUpWithEmail(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { name }
      }
    })
    return { data, error }
  },

  async signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  },

  async signOut(): Promise<{ error: any } | any> {
    console.log('🟢 Supabase signOut called')
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('SignOut timeout')), 5000)
      )
      const signOutPromise = supabase.auth.signOut()
      const result = await Promise.race([signOutPromise, timeoutPromise])
      console.log('🟢 Supabase signOut result:', result)
      return result
    } catch (error) {
      console.error('🟢 Supabase signOut error:', error)
      // Return success anyway to allow logout to proceed
      return { error: null }
    }
  },

  // Summaries
  async getSummaries(userId: string) {
    console.log('🔵 Supabase SELECT summaries for user:', userId)
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      console.log('🔵 Supabase SELECT result:', { count: data?.length, error: error?.message })
      return { data, error }
    } catch (e: any) {
      console.error('🔴 Supabase SELECT exception:', e.message)
      return { data: null, error: e }
    }
  },

  async addSummary(summary: Omit<DbSummary, 'id' | 'created_at'>) {
    console.log('🔵 Supabase INSERT starting...', summary.title)
    try {
      const { data, error } = await supabase
        .from('summaries')
        .insert(summary)
        .select()
        .single()
      
      console.log('🔵 Supabase INSERT result:', { data: data?.id, error: error?.message })
      
      if (error) {
        console.error('🔴 Supabase INSERT error details:', error)
      }
      
      return { data, error }
    } catch (e: any) {
      console.error('🔴 Supabase INSERT exception:', e.message)
      return { data: null, error: e }
    }
  },

  async deleteSummary(id: string) {
    return supabase.from('summaries').delete().eq('id', id)
  },

  // Flashcards
  async getFlashcards(userId: string) {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async getFlashcardsBySummary(summaryId: string) {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('summary_id', summaryId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async addFlashcards(flashcards: Omit<DbFlashcard, 'id' | 'created_at'>[]) {
    console.log('🔵 Supabase INSERT flashcards starting...', flashcards.length)
    
    // Split into smaller batches to avoid timeout
    const batchSize = 50
    const batches = []
    for (let i = 0; i < flashcards.length; i += batchSize) {
      batches.push(flashcards.slice(i, i + batchSize))
    }
    
    try {
      const results = []
      for (const batch of batches) {
        const { data, error } = await supabase
          .from('flashcards')
          .insert(batch)
          .select()
        
        if (error) {
          console.error('🔴 Batch insert error:', error)
        }
        results.push(...(data || []))
      }
      
      console.log('🔵 Supabase INSERT flashcards result:', { count: results.length })
      return { data: results, error: null }
    } catch (e: any) {
      console.error('🔴 Supabase INSERT flashcards exception:', e.message)
      return { data: null, error: e }
    }
  },

  async updateFlashcard(id: string, updates: Partial<DbFlashcard>) {
    const { data, error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  // Concepts
  async getConcepts(userId: string) {
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async getConceptsBySummary(summaryId: string) {
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('summary_id', summaryId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async addConcepts(concepts: Omit<DbConcept, 'id' | 'created_at'>[]) {
    // Split into batches of 50 to avoid timeout
    const batchSize = 50
    const allData: any[] = []
    let lastError = null

    for (let i = 0; i < concepts.length; i += batchSize) {
      const batch = concepts.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('concepts')
        .insert(batch)
        .select()
      
      if (error) {
        lastError = error
      } else if (data) {
        allData.push(...data)
      }
    }

    return { data: allData.length > 0 ? allData : null, error: lastError }
  },

  // Questions
  async getQuestions(userId: string) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async getQuestionsBySummary(summaryId: string) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('summary_id', summaryId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async addQuestions(questions: Omit<DbQuestion, 'id' | 'created_at'>[]) {
    // Split into batches of 50 to avoid timeout
    const batchSize = 50
    const allData: any[] = []
    let lastError = null

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('questions')
        .insert(batch)
        .select()
      
      if (error) {
        lastError = error
      } else if (data) {
        allData.push(...data)
      }
    }

    return { data: allData.length > 0 ? allData : null, error: lastError }
  },

  // Study Plan
  async getStudyPlan(userId: string) {
    const { data, error } = await supabase
      .from('study_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('day', { ascending: true })
    return { data, error }
  },

  async setStudyPlan(userId: string, tasks: Omit<DbStudyTask, 'id' | 'created_at'>[]) {
    // Delete existing tasks
    await supabase.from('study_tasks').delete().eq('user_id', userId)
    
    // Split into batches of 50 to avoid timeout
    const batchSize = 50
    const allData: any[] = []
    let lastError = null

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('study_tasks')
        .insert(batch)
        .select()
      
      if (error) {
        lastError = error
      } else if (data) {
        allData.push(...data)
      }
    }

    return { data: allData.length > 0 ? allData : null, error: lastError }
  },

  async updateStudyTask(id: string, updates: Partial<DbStudyTask>) {
    const { data, error } = await supabase
      .from('study_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  // Stats
  async getStats(userId: string) {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()  // Use maybeSingle to handle no rows gracefully
    return { data, error }
  },

  async updateStats(userId: string, updates: Partial<DbStats>) {
    const { data, error } = await supabase
      .from('user_stats')
      .upsert({ 
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    return { data, error }
  },

  // Get summary with all related data
  async getSummaryWithRelations(summaryId: string) {
    const [summaryRes, flashcardsRes, conceptsRes, questionsRes] = await Promise.all([
      supabase.from('summaries').select('*').eq('id', summaryId).single(),
      supabase.from('flashcards').select('*').eq('summary_id', summaryId),
      supabase.from('concepts').select('*').eq('summary_id', summaryId),
      supabase.from('questions').select('*').eq('summary_id', summaryId),
    ])

    return {
      summary: summaryRes.data,
      flashcards: flashcardsRes.data || [],
      concepts: conceptsRes.data || [],
      questions: questionsRes.data || [],
    }
  },

  // Get history grouped by date
  async getHistoryByDate(userId: string) {
    const { data, error } = await supabase
      .from('summaries')
      .select('id, title, one_liner, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error || !data) return { data: null, error }

    // Group by date
    const grouped: Record<string, typeof data> = {}
    data.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(item)
    })

    return { data: grouped, error: null }
  }
}
