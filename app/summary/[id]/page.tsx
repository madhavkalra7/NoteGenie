'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import { useApp } from '@/context/AppContext'
import Link from 'next/link'
import Flashcard from '@/components/Flashcard'
import ConceptTag from '@/components/ConceptTag'

export default function SummaryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { state, isReady, getSummaryWithData } = useApp()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'concepts' | 'questions'>('summary')

  const summaryId = params.id as string

  useEffect(() => {
    if (isReady && state.user) {
      loadData()
    }
  }, [isReady, state.user, summaryId])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await getSummaryWithData(summaryId)
      setData(result)
    } catch (error) {
      console.error('Error loading summary:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  if (!isReady) {
    return (
      <PageLayout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Initializing...</p>
        </div>
      </PageLayout>
    )
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading summary...</p>
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
              border-top: 4px solid #667eea;
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

  if (!data?.summary) {
    return (
      <PageLayout>
        <div className="not-found">
          <h2>Summary not found</h2>
          <Link href="/dashboard">← Back to Dashboard</Link>
        </div>
      </PageLayout>
    )
  }

  const { summary, flashcards, concepts, questions } = data

  return (
    <PageLayout>
      <div className="summary-page">
        {/* Header */}
        <div className="page-header">
          <Link href="/dashboard" className="back-btn">
            ← Back
          </Link>
          <div className="header-content">
            <h1>{summary.title || 'Untitled Note'}</h1>
            <p className="date">
              Created on {new Date(summary.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-icon">📝</span>
            <span className="stat-value">1</span>
            <span className="stat-label">Summary</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🔖</span>
            <span className="stat-value">{flashcards.length}</span>
            <span className="stat-label">Flashcards</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">💡</span>
            <span className="stat-value">{concepts.length}</span>
            <span className="stat-label">Concepts</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">❓</span>
            <span className="stat-value">{questions.length}</span>
            <span className="stat-label">Questions</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            📝 Summary
          </button>
          <button 
            className={`tab ${activeTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveTab('flashcards')}
          >
            🔖 Flashcards ({flashcards.length})
          </button>
          <button 
            className={`tab ${activeTab === 'concepts' ? 'active' : ''}`}
            onClick={() => setActiveTab('concepts')}
          >
            💡 Concepts ({concepts.length})
          </button>
          <button 
            className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            ❓ Questions ({questions.length})
          </button>
        </div>

        {/* Content */}
        <div className="tab-content">
          {activeTab === 'summary' && (
            <Card>
              <div className="summary-content">
                <div className="summary-section">
                  <h3>📌 One-Liner</h3>
                  <p className="one-liner">{summary.one_liner}</p>
                </div>

                <div className="summary-section">
                  <h3>📄 Short Summary</h3>
                  <p>{summary.short_summary}</p>
                </div>

                <div className="summary-section">
                  <h3>📋 Key Points</h3>
                  <ul className="bullet-list">
                    {summary.detailed_bullets?.map((bullet: string, idx: number) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </div>

                <div className="summary-section">
                  <h3>📖 Original Text</h3>
                  <div className="original-text">
                    {summary.raw_text}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'flashcards' && (
            <div className="flashcards-grid">
              {flashcards.length > 0 ? (
                flashcards.map((card: any, idx: number) => (
                  <Card key={card.id}>
                    <div className="flashcard-item">
                      <div className="card-number">#{idx + 1}</div>
                      <div className="card-question">{card.question}</div>
                      <div className="card-answer">{card.answer}</div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="empty">No flashcards generated</div>
              )}
            </div>
          )}

          {activeTab === 'concepts' && (
            <div className="concepts-grid">
              {concepts.length > 0 ? (
                concepts.map((concept: any) => (
                  <Card key={concept.id}>
                    <div className="concept-item">
                      <div className="concept-header">
                        <span className="concept-term">{concept.term}</span>
                        <span className={`difficulty-badge ${concept.difficulty}`}>
                          {concept.difficulty}
                        </span>
                      </div>
                      <p className="concept-definition">{concept.definition}</p>
                      {concept.category && (
                        <span className="concept-category">{concept.category}</span>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="empty">No concepts extracted</div>
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="questions-list">
              {questions.length > 0 ? (
                questions.map((q: any, idx: number) => (
                  <Card key={q.id}>
                    <div className="question-item">
                      <div className="question-header">
                        <span className="question-number">Q{idx + 1}</span>
                        <span className={`difficulty-badge ${q.difficulty}`}>{q.difficulty}</span>
                        <span className="question-type">{q.type.toUpperCase()}</span>
                      </div>
                      <p className="question-text">{q.question}</p>
                      {q.options && (
                        <ul className="options-list">
                          {q.options.map((opt: string, i: number) => (
                            <li key={i} className={opt === q.correct_answer ? 'correct' : ''}>
                              {String.fromCharCode(65 + i)}. {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="correct-answer">
                        <strong>Answer:</strong> {q.correct_answer}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="empty">No questions generated</div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .summary-page {
          max-width: 900px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .back-btn {
          display: inline-block;
          margin-bottom: 16px;
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .back-btn:hover {
          text-decoration: underline;
        }

        h1 {
          font-family: var(--font-heading);
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .date {
          color: #666;
        }

        .stats-row {
          display: flex;
          gap: 16px;
          margin-bottom: 30px;
        }

        .stat-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background: white;
          border: 2px solid #000;
          border-radius: 12px;
          box-shadow: 3px 3px 0 #000;
        }

        .stat-icon {
          font-size: 1.5rem;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #666;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .tab {
          padding: 12px 20px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab:hover {
          border-color: #667eea;
        }

        .tab.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .summary-content {
          padding: 20px;
        }

        .summary-section {
          margin-bottom: 30px;
        }

        .summary-section h3 {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          margin-bottom: 12px;
          color: #333;
        }

        .one-liner {
          font-size: 1.2rem;
          font-style: italic;
          color: #667eea;
          padding: 16px;
          background: #f8f9ff;
          border-radius: 10px;
          border-left: 4px solid #667eea;
        }

        .bullet-list {
          list-style: none;
          padding: 0;
        }

        .bullet-list li {
          padding: 12px 16px;
          margin-bottom: 8px;
          background: #f8f9fa;
          border-left: 3px solid #667eea;
          border-radius: 0 8px 8px 0;
        }

        .original-text {
          padding: 20px;
          background: #fafafa;
          border-radius: 10px;
          font-size: 0.95rem;
          line-height: 1.6;
          white-space: pre-wrap;
          max-height: 300px;
          overflow-y: auto;
        }

        .flashcards-grid,
        .concepts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .flashcard-item,
        .concept-item {
          padding: 20px;
        }

        .card-number {
          font-size: 0.8rem;
          color: #999;
          margin-bottom: 12px;
        }

        .card-question {
          font-weight: 600;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 2px dashed #eee;
        }

        .card-answer {
          color: #667eea;
        }

        .concept-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .concept-term {
          font-weight: 700;
          font-size: 1.1rem;
        }

        .difficulty-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .difficulty-badge.easy { background: #d1fae5; color: #059669; }
        .difficulty-badge.medium { background: #fef3c7; color: #d97706; }
        .difficulty-badge.hard { background: #fee2e2; color: #dc2626; }

        .concept-definition {
          color: #555;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .concept-category {
          display: inline-block;
          padding: 4px 10px;
          background: #f0f0ff;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #667eea;
        }

        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .question-item {
          padding: 20px;
        }

        .question-header {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        }

        .question-number {
          font-weight: 700;
          color: #667eea;
          font-size: 1.1rem;
        }

        .question-type {
          font-size: 0.75rem;
          color: #999;
          background: #f0f0f0;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .question-text {
          font-size: 1.1rem;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .options-list {
          list-style: none;
          padding: 0;
          margin-bottom: 16px;
        }

        .options-list li {
          padding: 12px 16px;
          margin-bottom: 8px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px solid transparent;
        }

        .options-list li.correct {
          background: #d1fae5;
          border-color: #059669;
        }

        .correct-answer {
          padding: 12px;
          background: #f0f0ff;
          border-radius: 8px;
          color: #667eea;
        }

        .empty {
          text-align: center;
          padding: 60px;
          color: #999;
          font-size: 1.1rem;
        }

        @media (max-width: 600px) {
          .stats-row {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
          }

          .tabs {
            flex-wrap: nowrap;
          }

          .tab {
            font-size: 0.85rem;
            padding: 10px 14px;
          }
        }
      `}</style>
    </PageLayout>
  )
}
