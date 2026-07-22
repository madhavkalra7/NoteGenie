// Database Types for MongoDB integration
export interface DbUser {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
  user_metadata?: {
    name?: string | null
    avatar_url?: string | null
  }
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

async function apiCall(action: string, payload: any = {}) {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    })
    return await res.json()
  } catch (error: any) {
    console.error(`MongoDB API Call Error [${action}]:`, error)
    return { data: null, error: error.message }
  }
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve()
    if ((window as any).google?.accounts?.oauth2) {
      return resolve()
    }
    const existingScript = document.getElementById('google-gsi-script')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      return resolve()
    }
    const script = document.createElement('script')
    script.id = 'google-gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

// Database helper object
export const db = {
  // Auth helpers
  async getCurrentUser() {
    try {
      const res = await fetch('/api/auth/me')
      const json = await res.json()
      return json.user
    } catch (error) {
      console.error('Error fetching current user:', error)
      return null
    }
  },

  async signInWithEmail(email: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const json = await res.json()
      if (!res.ok) {
        return { data: null, error: { message: json.error || 'Failed to sign in' } }
      }
      return { data: json.user, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  async signUpWithEmail(email: string, password: string, name: string) {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      const json = await res.json()
      if (!res.ok) {
        return { data: null, error: { message: json.error || 'Failed to sign up' } }
      }
      return { data: json.user, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  async signInWithGoogle() {
    await loadGoogleScript()
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '146654699105-kgcjs1kr7b17qp7b0kcde3ku76bco5du.apps.googleusercontent.com'

    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      alert('Google Auth SDK could not be loaded. Please check your internet connection.')
      return
    }

    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile',
      callback: async (response: any) => {
        if (response.error) {
          console.error('Google Auth Error:', response)
          return
        }
        if (response.access_token) {
          try {
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: response.access_token })
            })
            const data = await res.json()
            if (res.ok && data.success) {
              window.location.href = '/dashboard'
            } else {
              alert('Google Sign-In failed: ' + (data.error || 'Server error'))
            }
          } catch (err: any) {
            alert('Google Sign-In error: ' + err.message)
          }
        }
      }
    })

    client.requestAccessToken()
  },

  async signOut(): Promise<{ error: any }> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    }
  },

  // Summaries
  async getSummaries(userId: string) {
    return apiCall('getSummaries', { userId })
  },

  async addSummary(summary: Omit<DbSummary, 'id' | 'created_at'>) {
    return apiCall('addSummary', { summary })
  },

  async deleteSummary(id: string) {
    return apiCall('deleteSummary', { id })
  },

  // Flashcards
  async getFlashcards(userId: string) {
    return apiCall('getFlashcards', { userId })
  },

  async getFlashcardsBySummary(summaryId: string) {
    return apiCall('getFlashcardsBySummary', { summaryId })
  },

  async addFlashcards(flashcards: Omit<DbFlashcard, 'id' | 'created_at'>[]) {
    return apiCall('addFlashcards', { flashcards })
  },

  async updateFlashcard(id: string, updates: Partial<DbFlashcard>) {
    return apiCall('updateFlashcard', { id, updates })
  },

  // Concepts
  async getConcepts(userId: string) {
    return apiCall('getConcepts', { userId })
  },

  async getConceptsBySummary(summaryId: string) {
    return apiCall('getConceptsBySummary', { summaryId })
  },

  async addConcepts(concepts: Omit<DbConcept, 'id' | 'created_at'>[]) {
    return apiCall('addConcepts', { concepts })
  },

  // Questions
  async getQuestions(userId: string) {
    return apiCall('getQuestions', { userId })
  },

  async getQuestionsBySummary(summaryId: string) {
    return apiCall('getQuestionsBySummary', { summaryId })
  },

  async addQuestions(questions: Omit<DbQuestion, 'id' | 'created_at'>[]) {
    return apiCall('addQuestions', { questions })
  },

  // Study Plan
  async getStudyPlan(userId: string) {
    return apiCall('getStudyPlan', { userId })
  },

  async setStudyPlan(userId: string, tasks: Omit<DbStudyTask, 'id' | 'created_at'>[]) {
    return apiCall('setStudyPlan', { userId, tasks })
  },

  async updateStudyTask(id: string, updates: Partial<DbStudyTask>) {
    return apiCall('updateStudyTask', { id, updates })
  },

  // Stats
  async getStats(userId: string) {
    return apiCall('getStats', { userId })
  },

  async updateStats(userId: string, updates: Partial<DbStats>) {
    return apiCall('updateStats', { userId, updates })
  },

  // Relations & History
  async getSummaryWithRelations(summaryId: string) {
    return apiCall('getSummaryWithRelations', { summaryId })
  },

  async getHistoryByDate(userId: string) {
    return apiCall('getHistoryByDate', { userId })
  }
}
