'use client'

import { useState } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Flashcard from '@/components/Flashcard'
import { useApp } from '@/context/AppContext'
import { validateAnswer } from '@/agents/answerValidatorAgent'
import { generateQuestions } from '@/agents/questionMakerAgent'

export default function FlashcardsPage() {
  const { state, updateFlashcard, updateStats } = useApp()
  const [mode, setMode] = useState<'flashcards' | 'quiz'>('flashcards')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState('')
  const [quizResult, setQuizResult] = useState<any>(null)

  const flashcards = state.flashcards
  const questions = state.questions

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
    setQuizResult(null)
    setQuizAnswer('')
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    setQuizResult(null)
    setQuizAnswer('')
  }

  const handleKnew = () => {
    if (flashcards[currentIndex]) {
      updateFlashcard(flashcards[currentIndex].id, {
        lastReviewed: new Date(),
        timesReviewed: flashcards[currentIndex].timesReviewed + 1,
        wasCorrect: true,
      })
    }
    handleNext()
  }

  const handleDidntKnow = () => {
    if (flashcards[currentIndex]) {
      updateFlashcard(flashcards[currentIndex].id, {
        lastReviewed: new Date(),
        timesReviewed: flashcards[currentIndex].timesReviewed + 1,
        wasCorrect: false,
      })
    }
    handleNext()
  }

  const handleSubmitAnswer = async () => {
    const currentQuestion = questions[currentIndex]
    if (!currentQuestion) return

    const result = await validateAnswer({
      question: currentQuestion.question,
      userAnswer: quizAnswer,
      correctAnswer: currentQuestion.correctAnswer,
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
        
        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'flashcards' ? 'active' : ''}`}
            onClick={() => setMode('flashcards')}
          >
            🔖 Flashcards
          </button>
          <button
            className={`mode-btn ${mode === 'quiz' ? 'active' : ''}`}
            onClick={() => setMode('quiz')}
          >
            ❓ Quiz Mode
          </button>
        </div>

        {/* Flashcards Mode */}
        {mode === 'flashcards' && (
          <div className="flashcards-section">
            {flashcards.length > 0 ? (
              <>
                <div className="progress-bar">
                  <div className="progress-text">
                    {currentIndex + 1} / {flashcards.length}
                  </div>
                  <div className="progress-fill" style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }} />
                </div>

                <Flashcard
                  question={flashcards[currentIndex].question}
                  answer={flashcards[currentIndex].answer}
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
                  <p>No flashcards yet!</p>
                  <p>Upload and analyze notes to generate flashcards.</p>
                  <a href="/notes">Go to Notes →</a>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Quiz Mode */}
        {mode === 'quiz' && (
          <div className="quiz-section">
            {questions.length > 0 ? (
              <>
                <div className="progress-bar">
                  <div className="progress-text">
                    Question {currentIndex + 1} / {questions.length}
                  </div>
                  <div className="progress-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                </div>

                <Card>
                  <div className="quiz-question">
                    <div className="question-header">
                      <span className={`difficulty-badge ${questions[currentIndex].difficulty}`}>
                        {questions[currentIndex].difficulty}
                      </span>
                      <span className="question-type">{questions[currentIndex].type.toUpperCase()}</span>
                    </div>

                    <h3 className="question-text">{questions[currentIndex].question}</h3>

                    {questions[currentIndex].type === 'mcq' && questions[currentIndex].options && (
                      <div className="mcq-options">
                        {questions[currentIndex].options!.map((option, idx) => (
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

                    {(questions[currentIndex].type === 'short' || questions[currentIndex].type === 'truefalse') && (
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
                  <p>No questions yet!</p>
                  <p>Analyze your notes to generate quiz questions.</p>
                  <a href="/notes">Go to Notes →</a>
                </div>
              </Card>
            )}
          </div>
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
          margin-bottom: var(--spacing-2xl);
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
