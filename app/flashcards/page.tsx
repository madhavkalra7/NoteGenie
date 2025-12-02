'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AnimatedFlashcard from '@/components/AnimatedFlashcard'
import { useApp } from '@/context/AppContext'
import { validateAnswer } from '@/agents/answerValidatorAgent'
import { generateFlashcards } from '@/agents/flashcardAgent'
import { generateQuestions } from '@/agents/questionMakerAgent'

export default function FlashcardsPage() {
  const router = useRouter()
  const { state, isReady, updateFlashcard, updateStats, addFlashcards, addQuestions, getSummaryWithData, refreshData } = useApp()
  const [view, setView] = useState<'select' | 'flashcards' | 'quiz' | 'score' | 'all'>('select')
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null)
  const [currentFlashcards, setCurrentFlashcards] = useState<any[]>([])
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState('')
  const [quizResult, setQuizResult] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [mode, setMode] = useState<'flashcards' | 'quiz'>('flashcards')
  const [quizAnswers, setQuizAnswers] = useState<{questionId: string, answer: string, isCorrect: boolean, score: number}[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Debug log
  useEffect(() => {
    console.log('Flashcards Page - isReady:', isReady, 'User:', state.user?.email, 'Summaries:', state.summaries.length, 'Flashcards:', state.flashcards.length)
  }, [isReady, state.user, state.summaries, state.flashcards])

  // Redirect to login if not authenticated (only after ready)
  useEffect(() => {
    if (isReady && !state.user) {
      router.push('/auth/login')
    }
  }, [isReady, state.user, router])

  // View all flashcards function
  const handleViewAllFlashcards = () => {
    if (state.flashcards.length === 0) return
    
    const allFlashcards = state.flashcards.map(f => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      times_reviewed: f.times_reviewed,
      was_correct: f.was_correct,
      summary_id: f.summary_id,
    }))
    const allQuestions = state.questions.map(q => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswer: q.correct_answer,
      correct_answer: q.correct_answer,
      difficulty: q.difficulty,
    }))
    
    setCurrentFlashcards(allFlashcards)
    setCurrentQuestions(allQuestions)
    setCurrentIndex(0)
    setView('all')
  }

  // Show loading until ready (hydrated + data loaded)
  if (!isReady) {
    return (
      <PageLayout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your flashcards...</p>
          <style jsx>{`
            .loading-state {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              gap: 20px;
            }
            .loading-spinner {
              width: 50px;
              height: 50px;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #000;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </PageLayout>
    )
  }

  // Handle selecting a note and generating flashcards/questions
  const handleSelectNote = async (summaryId: string) => {
    setSelectedSummaryId(summaryId)
    setGenerating(true)
    setCurrentIndex(0)
    setQuizResult(null)
    setQuizAnswer('')
    setQuizAnswers([])

    try {
      // Get the summary with its concepts
      const data = await getSummaryWithData(summaryId)
      console.log('📚 Summary data:', data)
      
      // Check if flashcards already exist for this summary from the fetched data
      const existingFlashcards = data.flashcards || []
      const existingQuestions = data.questions || []

      console.log('🔖 Existing flashcards:', existingFlashcards.length, 'questions:', existingQuestions.length)

      if (existingFlashcards.length > 0) {
        // Use existing - map to correct format
        const mappedFlashcards = existingFlashcards.map((f: any) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          times_reviewed: f.times_reviewed,
          was_correct: f.was_correct,
        }))
        const mappedQuestions = existingQuestions.map((q: any) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswer: q.correct_answer,
          correct_answer: q.correct_answer,
          difficulty: q.difficulty,
        }))
        setCurrentFlashcards(mappedFlashcards)
        setCurrentQuestions(mappedQuestions.length > 0 ? mappedQuestions : [])
        setGenerating(false)
        setView('flashcards')
        console.log('✅ Using existing flashcards and questions from database')
        
        // Refresh data in background
        refreshData()
        return
      }

      // Generate new flashcards and questions from concepts
      const concepts = data.concepts || []
      console.log('🧠 Concepts to generate from:', concepts.length)
      
      if (concepts.length === 0) {
        alert('No concepts found for this note. Please try a different note.')
        setGenerating(false)
        return
      }

      console.log('⏳ Generating flashcards...')
      // Generate flashcards
      const { flashcards: newFlashcards } = await generateFlashcards({ concepts })
      console.log('✅ Flashcards generated:', newFlashcards?.length)
      
      console.log('⏳ Generating questions...')
      // Generate questions
      const { questions: newQuestions } = await generateQuestions({ 
        concepts, 
        summary: data.summary?.short_summary || '' 
      })
      console.log('✅ Questions generated:', newQuestions?.length)

      // Save to database
      console.log('💾 Saving flashcards to database...')
      const dbFlashcards = newFlashcards.map((f: any) => ({
        summary_id: summaryId,
        concept_id: null,
        question: f.question,
        answer: f.answer,
        times_reviewed: 0,
        was_correct: null,
        last_reviewed: null,
      }))
      await addFlashcards(dbFlashcards, summaryId)
      console.log('✅ Flashcards saved')

      console.log('💾 Saving questions to database...')
      const dbQuestions = newQuestions.map((q: any) => ({
        summary_id: summaryId,
        question: q.question,
        type: q.type || 'short',
        options: q.options || null,
        correct_answer: q.correctAnswer || q.answer || '',
        difficulty: q.difficulty || 'medium',
      }))
      await addQuestions(dbQuestions, summaryId)
      console.log('✅ Questions saved')

      // Set state and switch view
      setCurrentFlashcards(newFlashcards)
      setCurrentQuestions(newQuestions)
      setGenerating(false)
      setView('flashcards')
      
      console.log('🎉 Done! Switching to flashcards view')
    } catch (error) {
      console.error('Error generating flashcards:', error)
      alert('Error generating flashcards. Please try again.')
      setGenerating(false)
    }
  }

  const handleBackToSelect = () => {
    setView('select')
    setSelectedSummaryId(null)
    setCurrentFlashcards([])
    setCurrentQuestions([])
    setCurrentIndex(0)
    setQuizResult(null)
    setQuizAnswer('')
  }

  const handleNext = () => {
    if (mode === 'flashcards') {
      setCurrentIndex((prev) => (prev + 1) % currentFlashcards.length)
    } else {
      setCurrentIndex((prev) => (prev + 1) % currentQuestions.length)
    }
    setQuizResult(null)
    setQuizAnswer('')
  }

  const handlePrevious = () => {
    if (mode === 'flashcards') {
      setCurrentIndex((prev) => (prev - 1 + currentFlashcards.length) % currentFlashcards.length)
    } else {
      setCurrentIndex((prev) => (prev - 1 + currentQuestions.length) % currentQuestions.length)
    }
    setQuizResult(null)
    setQuizAnswer('')
  }

  const handleKnew = () => {
    if (currentFlashcards[currentIndex]?.id) {
      updateFlashcard(currentFlashcards[currentIndex].id, {
        last_reviewed: new Date().toISOString(),
        times_reviewed: (currentFlashcards[currentIndex].times_reviewed || 0) + 1,
        was_correct: true,
      })
    }
    handleNext()
  }

  const handleDidntKnow = () => {
    if (currentFlashcards[currentIndex]?.id) {
      updateFlashcard(currentFlashcards[currentIndex].id, {
        last_reviewed: new Date().toISOString(),
        times_reviewed: (currentFlashcards[currentIndex].times_reviewed || 0) + 1,
        was_correct: false,
      })
    }
    handleNext()
  }

  const handleSubmitAnswer = async () => {
    const currentQuestion = currentQuestions[currentIndex]
    if (!currentQuestion || submitting) return

    setSubmitting(true)
    
    try {
      const result = await validateAnswer({
        question: currentQuestion.question,
        userAnswer: quizAnswer,
        correctAnswer: currentQuestion.correct_answer || currentQuestion.correctAnswer,
      })

      setQuizResult(result)
      
      // Save this answer
      setQuizAnswers(prev => [...prev, {
        questionId: currentQuestion.id || `q-${currentIndex}`,
        answer: quizAnswer,
        isCorrect: result.wasCorrect,
        score: result.score || 0,
      }])
    } catch (error) {
      console.error('Error validating answer:', error)
      alert('Error checking answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Move to next question after viewing result
  const handleNextQuestion = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setQuizResult(null)
      setQuizAnswer('')
    } else {
      // Quiz complete - show score
      setView('score')
      updateStats({ quizzesTaken: state.stats.quizzesTaken + 1 })
    }
  }

  // Calculate final score
  const calculateFinalScore = () => {
    if (quizAnswers.length === 0) return { correct: 0, total: 0, percentage: 0 }
    const correct = quizAnswers.filter(a => a.isCorrect).length
    const total = quizAnswers.length
    const percentage = Math.round((correct / total) * 100)
    return { correct, total, percentage }
  }

  // Restart quiz
  const handleRestartQuiz = () => {
    setQuizAnswers([])
    setCurrentIndex(0)
    setQuizResult(null)
    setQuizAnswer('')
    setView('flashcards')
    setMode('quiz')
  }

  return (
    <PageLayout>
      <div className="flashcards-page">
        <h1 className="page-title">Flashcards & Quiz</h1>
        
        {/* Score View */}
        {view === 'score' && (
          <div className="score-section">
            <div className="score-card">
              <h2>🎉 Quiz Complete!</h2>
              <div className="final-score">
                <div className="score-circle" style={{
                  background: `conic-gradient(${calculateFinalScore().percentage >= 70 ? '#22c55e' : calculateFinalScore().percentage >= 40 ? '#eab308' : '#ef4444'} ${calculateFinalScore().percentage}%, #e5e7eb ${calculateFinalScore().percentage}%)`
                }}>
                  <span className="score-number">{calculateFinalScore().percentage}%</span>
                </div>
                <p className="score-text">
                  You got <strong>{calculateFinalScore().correct}</strong> out of <strong>{calculateFinalScore().total}</strong> questions correct!
                </p>
              </div>
              <div className="score-breakdown">
                <h3>Question Breakdown:</h3>
                {quizAnswers.map((ans, idx) => (
                  <div key={idx} className={`breakdown-item ${ans.isCorrect ? 'correct' : 'incorrect'}`}>
                    <span className="breakdown-icon">{ans.isCorrect ? '✅' : '❌'}</span>
                    <span>Question {idx + 1}</span>
                    <span className="breakdown-score">Score: {ans.score}/10</span>
                  </div>
                ))}
              </div>
              <div className="score-actions">
                <Button onClick={handleRestartQuiz}>Try Again</Button>
                <Button variant="outline" onClick={handleBackToSelect}>Back to Notes</Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Note Selection View */}
        {view === 'select' && (
          <div className="select-section">
            <p className="section-subtitle">Select notes to practice flashcards and quiz</p>
            
            {/* Quick Stats */}
            {state.flashcards.length > 0 && (
              <div className="quick-stats">
                <div className="stat-box">
                  <span className="stat-num">{state.flashcards.length}</span>
                  <span className="stat-label">Total Flashcards</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">{state.questions.length}</span>
                  <span className="stat-label">Quiz Questions</span>
                </div>
                <button className="view-all-btn" onClick={handleViewAllFlashcards}>
                  🎴 View All Flashcards
                </button>
              </div>
            )}
            
            {generating && (
              <div className="generating-state">
                <LoadingSpinner size="lg" />
                <p>Generating flashcards and questions... Please wait (this can take 30-60 seconds)</p>
              </div>
            )}

            {!generating && state.summaries.length > 0 ? (
              <div className="notes-grid">
                {state.summaries.map((summary) => {
                  const noteFlashcards = state.flashcards.filter(f => f.summary_id === summary.id)
                  const noteQuestions = state.questions.filter(q => q.summary_id === summary.id)
                  const hasContent = noteFlashcards.length > 0 || noteQuestions.length > 0
                  
                  return (
                    <div 
                      key={summary.id} 
                      className={`note-card ${hasContent ? 'has-content' : ''}`}
                      onClick={() => handleSelectNote(summary.id)}
                    >
                      <h3 className="note-title">{summary.title}</h3>
                      <p className="note-preview">{summary.one_liner}</p>
                      <div className="note-meta">
                        <span className="note-date">
                          {new Date(summary.created_at).toLocaleDateString()}
                        </span>
                        {hasContent ? (
                          <div className="content-badges">
                            {noteFlashcards.length > 0 && (
                              <span className="badge flashcard-badge">🔖 {noteFlashcards.length} cards</span>
                            )}
                            {noteQuestions.length > 0 && (
                              <span className="badge question-badge">❓ {noteQuestions.length} questions</span>
                            )}
                          </div>
                        ) : (
                          <span className="generate-hint">Click to generate</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : !generating && (
              <Card>
                <div className="empty-state">
                  <p>No notes yet!</p>
                  <p>Upload notes first to generate flashcards.</p>
                  <a href="/notes">Go to Notes →</a>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Flashcards/Quiz View */}
        {(view === 'flashcards' || view === 'all') && (
          <>
            <Button variant="outline" onClick={handleBackToSelect} className="back-btn">
              ← Back to Notes
            </Button>

            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button
                className={`mode-btn ${mode === 'flashcards' ? 'active' : ''}`}
                onClick={() => { setMode('flashcards'); setCurrentIndex(0); }}
              >
                🔖 Flashcards ({currentFlashcards.length})
              </button>
              <button
                className={`mode-btn ${mode === 'quiz' ? 'active' : ''}`}
                onClick={() => { setMode('quiz'); setCurrentIndex(0); }}
              >
                ❓ Quiz ({currentQuestions.length})
              </button>
            </div>

            {/* Flashcards Mode */}
            {mode === 'flashcards' && (
              <div className="flashcards-section">
                {currentFlashcards.length > 0 ? (
                  <>
                    <AnimatedFlashcard
                      question={currentFlashcards[currentIndex].question}
                      answer={currentFlashcards[currentIndex].answer}
                      index={currentIndex}
                      total={currentFlashcards.length}
                      onKnew={handleKnew}
                      onDidntKnow={handleDidntKnow}
                    />
                  </>
                ) : (
                  <Card>
                    <div className="empty-state">
                      <p>No flashcards generated yet!</p>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Quiz Mode */}
            {mode === 'quiz' && (
              <div className="quiz-section">
                {currentQuestions.length > 0 ? (
                  <>
                    <div className="progress-bar">
                      <div className="progress-text">
                        Question {currentIndex + 1} / {currentQuestions.length}
                      </div>
                      <div className="progress-fill" style={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }} />
                    </div>

                    <Card>
                      <div className="quiz-question">
                        <div className="question-header">
                          <span className={`difficulty-badge ${currentQuestions[currentIndex].difficulty}`}>
                            {currentQuestions[currentIndex].difficulty}
                          </span>
                          <span className="question-type">{(currentQuestions[currentIndex].type || 'short').toUpperCase()}</span>
                        </div>

                        <h3 className="question-text">{currentQuestions[currentIndex].question}</h3>

                        {currentQuestions[currentIndex].type === 'mcq' && currentQuestions[currentIndex].options && (
                          <div className="mcq-options">
                            {currentQuestions[currentIndex].options!.map((option: string, idx: number) => (
                              <button
                                key={idx}
                                className={`option-btn ${quizAnswer === option ? 'selected' : ''} ${quizResult ? 'disabled' : ''}`}
                                onClick={() => !quizResult && setQuizAnswer(option)}
                                disabled={quizResult !== null}
                              >
                                {String.fromCharCode(65 + idx)}. {option}
                              </button>
                            ))}
                          </div>
                        )}

                        {(currentQuestions[currentIndex].type !== 'mcq') && (
                          <textarea
                            className="input textarea"
                            placeholder="Type your answer here..."
                            value={quizAnswer}
                            onChange={(e) => setQuizAnswer(e.target.value)}
                            rows={4}
                            disabled={quizResult !== null}
                          />
                        )}

                        {/* Show submit button only when no result yet */}
                        {!quizResult && (
                          <div className="quiz-actions">
                            <Button onClick={handleSubmitAnswer} disabled={!quizAnswer || submitting} loading={submitting}>
                              {submitting ? 'Checking...' : 'Submit Answer'}
                            </Button>
                          </div>
                        )}

                        {/* Show result and next button after submission */}
                        {quizResult && (
                          <div className={`answer-result ${quizResult.wasCorrect ? 'correct' : 'incorrect'}`}>
                            <div className="result-header">
                              <span className="result-icon">{quizResult.wasCorrect ? '✅' : '❌'}</span>
                              <span className="result-score">Score: {quizResult.score}/10</span>
                            </div>
                            <div className="result-feedback">
                              <strong>Feedback:</strong> {quizResult.feedback}
                            </div>
                            <div className="result-answer">
                              <strong>Model Answer:</strong>
                              <p>{quizResult.modelAnswer}</p>
                            </div>
                            <Button onClick={handleNextQuestion} className="next-question-btn">
                              {currentIndex < currentQuestions.length - 1 ? 'Next Question →' : 'See Results 🎯'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <div className="empty-state">
                      <p>No questions generated yet!</p>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .flashcards-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-title {
          font-size: var(--font-size-3xl);
          text-align: center;
          margin-bottom: var(--spacing-md);
        }

        .section-subtitle {
          text-align: center;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-2xl);
        }

        .back-btn {
          margin-bottom: var(--spacing-lg);
        }

        .generating-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-2xl);
        }

        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--spacing-lg);
        }

        .note-card {
          padding: var(--spacing-lg);
          background: var(--color-card);
          border: 3px solid #000;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 3px 3px 0px 0px black;
        }

        .note-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 5px 5px 0px 0px black;
        }

        .note-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-sm);
        }

        .note-preview {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-md);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .note-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--font-size-xs);
        }

        .note-date {
          color: var(--color-text-muted);
        }

        .has-flashcards {
          color: var(--color-accent);
          font-weight: var(--font-weight-medium);
        }

        .quick-stats {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
          align-items: center;
          flex-wrap: wrap;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-md) var(--spacing-lg);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: var(--radius-md);
          min-width: 100px;
        }

        .stat-num {
          font-size: 24px;
          font-weight: bold;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.9;
        }

        .view-all-btn {
          padding: var(--spacing-md) var(--spacing-xl);
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .view-all-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
        }

        .note-card.has-content {
          border-color: #667eea;
          background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
        }

        .content-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .flashcard-badge {
          background: #667eea22;
          color: #667eea;
        }

        .question-badge {
          background: #f59e0b22;
          color: #d97706;
        }

        .generate-hint {
          color: var(--color-text-muted);
          font-style: italic;
        }

        .mode-toggle {
          display: flex;
          gap: var(--spacing-md);
          justify-content: center;
          margin-bottom: var(--spacing-2xl);
        }

        .mode-btn {
          padding: var(--spacing-md) var(--spacing-xl);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          border: 2px solid var(--color-accent);
          background: transparent;
          color: var(--color-accent);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .mode-btn:hover {
          background: var(--color-accent-light);
        }

        .mode-btn.active {
          background: var(--color-accent);
          color: white;
        }

        .progress-bar {
          position: relative;
          height: 40px;
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-xl);
          overflow: hidden;
        }

        .progress-text {
          position: relative;
          z-index: 2;
          text-align: center;
          line-height: 40px;
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: var(--color-accent-light);
          transition: width var(--transition-base);
          z-index: 1;
        }

        .navigation-buttons {
          display: flex;
          gap: var(--spacing-md);
          justify-content: center;
          margin-top: var(--spacing-xl);
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-2xl);
          color: var(--color-text-muted);
        }

        .empty-state p {
          margin-bottom: var(--spacing-md);
        }

        .empty-state a {
          color: var(--color-accent);
          font-weight: var(--font-weight-medium);
        }

        .quiz-question {
          padding: var(--spacing-lg);
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .difficulty-badge {
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
        }

        .difficulty-badge.easy {
          background: rgba(123, 198, 126, 0.2);
          color: var(--color-easy);
        }

        .difficulty-badge.medium {
          background: rgba(255, 183, 77, 0.2);
          color: var(--color-medium);
        }

        .difficulty-badge.hard {
          background: rgba(229, 115, 115, 0.2);
          color: var(--color-hard);
        }

        .question-type {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          font-weight: var(--font-weight-medium);
        }

        .question-text {
          font-size: var(--font-size-xl);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-lg);
          line-height: var(--line-height-relaxed);
        }

        .mcq-options {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .option-btn {
          padding: var(--spacing-md);
          text-align: left;
          background: var(--color-bg-secondary);
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--font-size-base);
        }

        .option-btn:hover:not(.disabled) {
          border-color: var(--color-accent);
          background: var(--color-accent-light);
        }

        .option-btn.selected {
          border-color: var(--color-accent);
          background: var(--color-accent-light);
        }

        .option-btn.disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .quiz-actions {
          margin-top: var(--spacing-lg);
        }

        .answer-result {
          margin-top: var(--spacing-xl);
          padding: var(--spacing-lg);
          border-radius: var(--radius-md);
          animation: slideUp 0.3s ease-out;
        }

        .answer-result.correct {
          background: rgba(123, 198, 126, 0.1);
          border: 2px solid var(--color-success);
        }

        .answer-result.incorrect {
          background: rgba(229, 115, 115, 0.1);
          border: 2px solid var(--color-error);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .result-icon {
          font-size: var(--font-size-2xl);
        }

        .result-score {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
        }

        .result-feedback,
        .result-answer {
          margin-bottom: var(--spacing-md);
        }

        .result-feedback strong,
        .result-answer strong {
          display: block;
          color: var(--color-accent);
          margin-bottom: var(--spacing-xs);
        }

        .next-question-btn {
          margin-top: var(--spacing-lg);
          width: 100%;
        }

        /* Score Section */
        .score-section {
          display: flex;
          justify-content: center;
          padding: var(--spacing-2xl) 0;
        }

        .score-card {
          background: var(--color-card);
          border: 3px solid #000;
          border-radius: var(--radius-lg);
          padding: var(--spacing-2xl);
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 5px 5px 0px 0px black;
        }

        .score-card h2 {
          font-size: var(--font-size-2xl);
          margin-bottom: var(--spacing-xl);
        }

        .final-score {
          margin-bottom: var(--spacing-xl);
        }

        .score-circle {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--spacing-lg);
          position: relative;
        }

        .score-circle::before {
          content: '';
          position: absolute;
          width: 120px;
          height: 120px;
          background: white;
          border-radius: 50%;
        }

        .score-number {
          position: relative;
          z-index: 1;
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
        }

        .score-text {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
        }

        .score-breakdown {
          text-align: left;
          margin-bottom: var(--spacing-xl);
          background: var(--color-background);
          padding: var(--spacing-lg);
          border-radius: var(--radius-md);
        }

        .score-breakdown h3 {
          margin-bottom: var(--spacing-md);
          font-size: var(--font-size-base);
        }

        .breakdown-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-sm) 0;
          border-bottom: 1px solid var(--color-border);
        }

        .breakdown-item:last-child {
          border-bottom: none;
        }

        .breakdown-item.correct {
          color: var(--color-success);
        }

        .breakdown-item.incorrect {
          color: var(--color-error);
        }

        .breakdown-score {
          margin-left: auto;
          font-weight: var(--font-weight-medium);
        }

        .score-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: center;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </PageLayout>
  )
}
