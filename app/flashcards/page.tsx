'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Flashcard from '@/components/Flashcard'
import { useApp } from '@/context/AppContext'
import { validateAnswer } from '@/agents/answerValidatorAgent'
import { generateFlashcards } from '@/agents/flashcardAgent'
import { generateQuestions } from '@/agents/questionMakerAgent'

export default function FlashcardsPage() {
  const router = useRouter()
  const { state, isReady, updateFlashcard, updateStats, addFlashcards, addQuestions, getSummaryWithData, refreshData } = useApp()
  const [view, setView] = useState<'select' | 'flashcards' | 'quiz'>('select')
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null)
  const [currentFlashcards, setCurrentFlashcards] = useState<any[]>([])
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState('')
  const [quizResult, setQuizResult] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [mode, setMode] = useState<'flashcards' | 'quiz'>('flashcards')

  // Debug log
  useEffect(() => {
    console.log('Flashcards Page - isReady:', isReady, 'User:', state.user?.email, 'Summaries:', state.summaries.length)
  }, [isReady, state.user, state.summaries])

  // Redirect to login if not authenticated (only after ready)
  useEffect(() => {
    if (isReady && !state.user) {
      router.push('/auth/login')
    }
  }, [isReady, state.user, router])

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

    try {
      // Get the summary with its concepts
      const data = await getSummaryWithData(summaryId)
      console.log('📚 Summary data:', data)
      
      // Check if flashcards already exist for this summary
      const existingFlashcards = state.flashcards.filter(f => f.summary_id === summaryId)
      const existingQuestions = state.questions.filter(q => q.summary_id === summaryId)

      console.log('🔖 Existing flashcards:', existingFlashcards.length, 'questions:', existingQuestions.length)

      if (existingFlashcards.length > 0 || existingQuestions.length > 0) {
        // Use existing
        setCurrentFlashcards(existingFlashcards)
        setCurrentQuestions(existingQuestions)
        setGenerating(false)
        setView('flashcards')
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
    if (!currentQuestion) return

    const result = await validateAnswer({
      question: currentQuestion.question,
      userAnswer: quizAnswer,
      correctAnswer: currentQuestion.correct_answer || currentQuestion.correctAnswer,
    })

    setQuizResult(result)
    if (result.wasCorrect) {
      updateStats({ quizzesTaken: state.stats.quizzesTaken + 1 })
    }
  }

  return (
    <PageLayout>
      <div className="flashcards-page">
        <h1 className="page-title">Flashcards & Quiz</h1>
        
        {/* Note Selection View */}
        {view === 'select' && (
          <div className="select-section">
            <p className="section-subtitle">Select notes to generate flashcards and quiz questions</p>
            
            {generating && (
              <div className="generating-state">
                <LoadingSpinner size="lg" />
                <p>Generating flashcards and questions... Please wait (this can take 30-60 seconds)</p>
              </div>
            )}

            {!generating && state.summaries.length > 0 ? (
              <div className="notes-grid">
                {state.summaries.map((summary) => (
                  <div 
                    key={summary.id} 
                    className="note-card"
                    onClick={() => handleSelectNote(summary.id)}
                  >
                    <h3 className="note-title">{summary.title}</h3>
                    <p className="note-preview">{summary.one_liner}</p>
                    <div className="note-meta">
                      <span className="note-date">
                        {new Date(summary.created_at).toLocaleDateString()}
                      </span>
                      {state.flashcards.filter(f => f.summary_id === summary.id).length > 0 && (
                        <span className="has-flashcards">🔖 Has flashcards</span>
                      )}
                    </div>
                  </div>
                ))}
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
        {view !== 'select' && (
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
                    <div className="progress-bar">
                      <div className="progress-text">
                        {currentIndex + 1} / {currentFlashcards.length}
                      </div>
                      <div className="progress-fill" style={{ width: `${((currentIndex + 1) / currentFlashcards.length) * 100}%` }} />
                    </div>

                    <Flashcard
                      question={currentFlashcards[currentIndex].question}
                      answer={currentFlashcards[currentIndex].answer}
                      onKnew={handleKnew}
                      onDidntKnow={handleDidntKnow}
                    />

                    <div className="navigation-buttons">
                      <Button variant="outline" onClick={handlePrevious}>
                        ← Previous
                      </Button>
                      <Button variant="outline" onClick={handleNext}>
                        Next →
                      </Button>
                    </div>
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
                                className={`option-btn ${quizAnswer === option ? 'selected' : ''}`}
                                onClick={() => setQuizAnswer(option)}
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
                          />
                        )}

                        <div className="quiz-actions">
                          <Button onClick={handleSubmitAnswer} disabled={!quizAnswer}>
                            Submit Answer
                          </Button>
                        </div>

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
                          </div>
                        )}
                      </div>
                    </Card>

                    <div className="navigation-buttons">
                      <Button variant="outline" onClick={handlePrevious}>
                        ← Previous
                      </Button>
                      <Button variant="outline" onClick={handleNext}>
                        Next →
                      </Button>
                    </div>
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

        .option-btn:hover {
          border-color: var(--color-accent);
          background: var(--color-accent-light);
        }

        .option-btn.selected {
          border-color: var(--color-accent);
          background: var(--color-accent-light);
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
