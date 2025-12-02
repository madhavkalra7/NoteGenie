'use client'

import { useState, useEffect } from 'react'

interface AnimatedFlashcardProps {
  question: string
  answer: string
  index: number
  total: number
  onKnew?: () => void
  onDidntKnow?: () => void
}

// Colorful gradient backgrounds - DARK colors for better text visibility
const cardColors = [
  'linear-gradient(135deg, #1e3a8a 0%, #581c87 100%)',   // Deep blue to purple
  'linear-gradient(135deg, #7c2d12 0%, #9f1239 100%)',   // Dark orange to rose
  'linear-gradient(135deg, #0c4a6e 0%, #164e63 100%)',   // Deep cyan
  'linear-gradient(135deg, #14532d 0%, #065f46 100%)',   // Deep green
  'linear-gradient(135deg, #4c1d95 0%, #6b21a8 100%)',   // Deep violet
  'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',   // Dark indigo
  'linear-gradient(135deg, #3f0f3f 0%, #701a75 100%)',   // Deep fuchsia
  'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',   // Slate to blue
  'linear-gradient(135deg, #422006 0%, #854d0e 100%)',   // Deep amber
  'linear-gradient(135deg, #831843 0%, #9d174d 100%)',   // Deep pink
]

export default function AnimatedFlashcard({ 
  question, 
  answer, 
  index,
  total,
  onKnew, 
  onDidntKnow 
}: AnimatedFlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isEntering, setIsEntering] = useState(true)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)

  const cardColor = cardColors[index % cardColors.length]
  const backColor = cardColors[(index + 5) % cardColors.length]

  useEffect(() => {
    setIsFlipped(false)
    setIsEntering(true)
    setSwipeDirection(null)
    const timer = setTimeout(() => setIsEntering(false), 500)
    return () => clearTimeout(timer)
  }, [index])

  const handleKnew = () => {
    setSwipeDirection('right')
    setTimeout(() => {
      onKnew?.()
    }, 300)
  }

  const handleDidntKnow = () => {
    setSwipeDirection('left')
    setTimeout(() => {
      onDidntKnow?.()
    }, 300)
  }

  return (
    <div className="animated-flashcard-wrapper">
      {/* Card Stack Effect */}
      <div className="card-stack">
        {[...Array(Math.min(3, total - index - 1))].map((_, i) => (
          <div 
            key={i} 
            className="stack-card"
            style={{
              background: cardColors[(index + i + 1) % cardColors.length],
              transform: `translateY(${(i + 1) * 8}px) scale(${1 - (i + 1) * 0.05})`,
              zIndex: -i - 1,
            }}
          />
        ))}
      </div>

      <div 
        className={`flashcard-3d ${isFlipped ? 'flipped' : ''} ${isEntering ? 'entering' : ''} ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="card-inner">
          {/* Front */}
          <div className="card-face card-front" style={{ background: cardColor }}>
            <div className="card-decoration">
              <span className="card-number">{index + 1}/{total}</span>
              <span className="card-icon">💡</span>
            </div>
            <div className="card-label">QUESTION</div>
            <div className="card-content">{question}</div>
            <div className="card-footer">
              <span className="tap-hint">👆 Tap to flip</span>
            </div>
          </div>

          {/* Back */}
          <div className="card-face card-back" style={{ background: backColor }}>
            <div className="card-decoration">
              <span className="card-number">{index + 1}/{total}</span>
              <span className="card-icon">✨</span>
            </div>
            <div className="card-label">ANSWER</div>
            <div className="card-content">{answer}</div>
            <div className="card-footer">
              <span className="tap-hint">👆 Tap to flip back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isFlipped && (onKnew || onDidntKnow) && (
        <div className="action-buttons">
          {onDidntKnow && (
            <button className="action-btn btn-wrong" onClick={handleDidntKnow}>
              <span className="btn-icon">❌</span>
              <span className="btn-text">Still Learning</span>
            </button>
          )}
          {onKnew && (
            <button className="action-btn btn-correct" onClick={handleKnew}>
              <span className="btn-icon">✅</span>
              <span className="btn-text">Got It!</span>
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .animated-flashcard-wrapper {
          perspective: 1500px;
          width: 100%;
          max-width: 450px;
          margin: 0 auto;
          position: relative;
        }

        .card-stack {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 320px;
          pointer-events: none;
        }

        .stack-card {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 24px;
          opacity: 0.5;
        }

        .flashcard-3d {
          width: 100%;
          height: 320px;
          cursor: pointer;
          position: relative;
          z-index: 1;
        }

        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-style: preserve-3d;
        }

        .flashcard-3d.flipped .card-inner {
          transform: rotateY(180deg);
        }

        .flashcard-3d.entering {
          animation: cardEnter 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .flashcard-3d.swipe-left {
          animation: swipeLeft 0.3s ease-out forwards;
        }

        .flashcard-3d.swipe-right {
          animation: swipeRight 0.3s ease-out forwards;
        }

        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(-50px) rotateX(20deg) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) rotateX(0) scale(1);
          }
        }

        @keyframes swipeLeft {
          to {
            opacity: 0;
            transform: translateX(-150%) rotate(-20deg);
          }
        }

        @keyframes swipeRight {
          to {
            opacity: 0;
            transform: translateX(150%) rotate(20deg);
          }
        }

        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 24px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 
            0 20px 40px rgba(0,0,0,0.2),
            0 0 0 1px rgba(255,255,255,0.1) inset;
          overflow: hidden;
        }

        .card-face::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.3) 0%,
            transparent 50%,
            rgba(0,0,0,0.1) 100%
          );
          pointer-events: none;
        }

        .card-back {
          transform: rotateY(180deg);
        }

        .card-decoration {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .card-number {
          background: rgba(255,255,255,0.3);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .card-icon {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .card-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          margin-bottom: 12px;
        }

        .card-content {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          font-size: 18px;
          font-weight: 600;
          color: white;
          text-align: left;
          line-height: 1.6;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          padding: 8px 12px;
          overflow-y: auto;
          overflow-x: hidden;
          word-wrap: break-word;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.3) transparent;
        }

        .card-content::-webkit-scrollbar {
          width: 6px;
        }

        .card-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .card-content::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.4);
          border-radius: 10px;
        }

        .card-footer {
          text-align: center;
        }

        .tap-hint {
          font-size: 12px;
          color: rgba(255,255,255,0.8);
          background: rgba(0,0,0,0.1);
          padding: 6px 16px;
          border-radius: 20px;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 24px;
          animation: fadeInUp 0.3s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 16px 32px;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-family: inherit;
        }

        .action-btn:hover {
          transform: translateY(-4px) scale(1.05);
        }

        .action-btn:active {
          transform: translateY(0) scale(0.98);
        }

        .btn-wrong {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
          box-shadow: 0 8px 24px rgba(238,90,90,0.4);
        }

        .btn-correct {
          background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
          box-shadow: 0 8px 24px rgba(64,192,87,0.4);
        }

        .btn-icon {
          font-size: 24px;
        }

        .btn-text {
          font-size: 14px;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}
