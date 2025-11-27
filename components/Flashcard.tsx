'use client'

import { useState } from 'react'

interface FlashcardProps {
  question: string
  answer: string
  onKnew?: () => void
  onDidntKnow?: () => void
}

export default function Flashcard({ question, answer, onKnew, onDidntKnow }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="flashcard-container">
      <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
        <div className="flashcard-front">
          <div className="flashcard-label">Question</div>
          <div className="flashcard-content">{question}</div>
          <div className="flashcard-hint">Click to reveal answer</div>
        </div>
        <div className="flashcard-back">
          <div className="flashcard-label">Answer</div>
          <div className="flashcard-content">{answer}</div>
          <div className="flashcard-hint">Click to see question</div>
        </div>
      </div>

      {isFlipped && (onKnew || onDidntKnow) && (
        <div className="flashcard-actions animate-fade-in">
          {onDidntKnow && (
            <button className="action-btn btn-didnt-know" onClick={onDidntKnow}>
              ❌ Didn't Know
            </button>
          )}
          {onKnew && (
            <button className="action-btn btn-knew" onClick={onKnew}>
              ✅ I Knew This
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .flashcard-container {
          perspective: 1000px;
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }

        .flashcard {
          position: relative;
          width: 100%;
          height: 300px;
          cursor: pointer;
          transform-style: preserve-3d;
          transition: transform 0.6s;
        }

        .flashcard.flipped {
          transform: rotateY(180deg);
        }

        .flashcard-front,
        .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          background: var(--color-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }

        .flashcard-back {
          transform: rotateY(180deg);
          background: var(--color-accent-light);
        }

        .flashcard-label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-accent);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: var(--spacing-md);
        }

        .flashcard-content {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          text-align: center;
          line-height: var(--line-height-relaxed);
          flex: 1;
          display: flex;
          align-items: center;
        }

        .flashcard-hint {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-top: var(--spacing-md);
        }

        .flashcard-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: center;
          margin-top: var(--spacing-lg);
        }

        .action-btn {
          padding: var(--spacing-sm) var(--spacing-lg);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-knew {
          background: var(--color-success);
          color: white;
        }

        .btn-knew:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .btn-didnt-know {
          background: var(--color-error);
          color: white;
        }

        .btn-didnt-know:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
