'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import { useApp } from '@/context/AppContext'
import Link from 'next/link'
import ConceptTag from '@/components/ConceptTag'

export default function DashboardPage() {
  const router = useRouter()
  const { state, isReady, getSummaryWithData } = useApp()

  // Redirect to login if not authenticated (only after ready)
  useEffect(() => {
    if (isReady && !state.user) {
      router.push('/auth/login')
    }
  }, [isReady, state.user, router])

  if (!isReady) {
    return (
      <PageLayout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
          <style jsx>{`
            .loading-state {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              gap: 20px;
              font-family: var(--font-body);
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

  if (!state.user) {
    return null
  }

  const historyDates = Object.keys(state.historyByDate)

  return (
    <PageLayout>
      <div className="dashboard-page">
        {/* Welcome Header */}
        <div className="welcome-header animate-fade-in">
          <div className="welcome-text">
            <h1 className="page-title">Welcome back! 👋</h1>
            <p className="page-subtitle">{state.user.email}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid animate-slide-up">
          <StatCard
            icon="📝"
            label="Notes Processed"
            value={state.stats.notesProcessed}
            color="#667eea"
          />
          <StatCard
            icon="🔖"
            label="Flashcards Generated"
            value={state.stats.flashcardsGenerated}
            color="#10b981"
          />
          <StatCard
            icon="❓"
            label="Quizzes Taken"
            value={state.stats.quizzesTaken}
            color="#3b82f6"
          />
          <StatCard
            icon="🎯"
            label="Study Tasks"
            value={state.studyPlan.filter(t => !t.completed).length}
            color="#f59e0b"
          />
        </div>

        {/* Quick Actions */}
        <div className="quick-actions animate-slide-up">
          <Link href="/notes" className="action-card">
            <span className="action-icon">✏️</span>
            <span className="action-text">New Note</span>
          </Link>
          <Link href="/flashcards" className="action-card">
            <span className="action-icon">⚡</span>
            <span className="action-text">Practice</span>
          </Link>
          <Link href="/study-plan" className="action-card">
            <span className="action-icon">📅</span>
            <span className="action-text">Study Plan</span>
          </Link>
        </div>

        {/* Main Dashboard Content */}
        <div className="dashboard-grid">
          {/* Today's Focus */}
          <Card className="focus-card">
            <h2 className="card-title">🎯 Today's Focus</h2>
            {state.studyPlan.length > 0 ? (
              <div className="focus-content">
                {state.studyPlan.slice(0, 3).map(task => (
                  <div key={task.id} className="focus-item">
                    <span className={`priority-badge priority-${task.priority}`}>
                      {task.priority}
                    </span>
                    <div className="focus-topics">
                      {task.topics.join(', ')}
                    </div>
                    <div className="focus-duration">{task.duration} min</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No study plan yet</p>
                <Link href="/study-plan">Create Study Plan →</Link>
              </div>
            )}
          </Card>

          {/* Flashcard Review */}
          <Card className="flashcard-review-card">
            <h2 className="card-title">📚 Quick Review</h2>
            {state.flashcards.length > 0 ? (
              <div className="review-content">
                <div className="review-stat">
                  <span className="stat-number">{state.flashcards.length}</span>
                  <span className="stat-label">Flashcards Ready</span>
                </div>
                <Link href="/flashcards" className="review-btn">
                  Start Reviewing →
                </Link>
              </div>
            ) : (
              <div className="empty-state">
                <p>No flashcards yet!</p>
                <Link href="/notes">Generate from notes →</Link>
              </div>
            )}
          </Card>
        </div>

        {/* History Section */}
        <div className="history-section">
          <h2 className="section-title">📅 Your Study History</h2>
          
          {historyDates.length > 0 ? (
            <div className="history-timeline">
              {historyDates.map(date => (
                <div key={date} className="history-day">
                  <div className="history-date">
                    <span className="date-icon">📆</span>
                    <span className="date-text">{date}</span>
                  </div>
                  <div className="history-items">
                    {state.historyByDate[date].map(item => (
                      <Link 
                        href={`/summary/${item.id}`} 
                        key={item.id} 
                        className="history-item"
                      >
                        <div className="item-title">{item.title || 'Untitled Note'}</div>
                        <div className="item-summary">{item.one_liner}</div>
                        <div className="item-time">
                          {new Date(item.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p>No study history yet</p>
                <p className="empty-hint">Start by uploading and analyzing some notes!</p>
                <Link href="/notes" className="empty-btn">
                  Upload First Note →
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          animation: fadeIn 0.5s ease-out;
          max-width: 1200px;
          margin: 0 auto;
        }

        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-2xl);
        }

        .page-title {
          font-size: 2.5rem;
          color: var(--color-text-primary);
          margin-bottom: 4px;
          font-family: var(--font-heading);
        }

        .page-subtitle {
          font-size: 1rem;
          color: var(--color-text-muted);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }

        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 500px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .quick-actions {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }

        .action-card {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px solid #000;
          border-radius: 16px;
          color: white;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
          box-shadow: 4px 4px 0 #000;
        }

        .action-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 #000;
        }

        .action-icon {
          font-size: 1.5rem;
        }

        .action-text {
          font-size: 1.1rem;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
        }

        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .card-title {
          font-size: 1.3rem;
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-lg);
          font-weight: 600;
          font-family: var(--font-heading);
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--color-text-muted);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: var(--spacing-md);
        }

        .empty-hint {
          font-size: 0.9rem;
          margin-top: 8px;
        }

        .empty-btn {
          display: inline-block;
          margin-top: var(--spacing-md);
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
        }

        .empty-state a {
          color: #667eea;
          font-weight: 600;
        }

        .focus-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .focus-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: 14px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px solid #eee;
        }

        .priority-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .priority-high { background: #fee2e2; color: #dc2626; }
        .priority-medium { background: #fef3c7; color: #d97706; }
        .priority-low { background: #d1fae5; color: #059669; }

        .focus-topics {
          flex: 1;
          font-weight: 500;
        }

        .focus-duration {
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }

        .review-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-lg) 0;
        }

        .review-stat {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 3rem;
          font-weight: 700;
          color: #667eea;
        }

        .stat-label {
          color: var(--color-text-muted);
        }

        .review-btn {
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
        }

        .review-btn:hover {
          transform: scale(1.05);
        }

        /* History Section */
        .history-section {
          margin-top: var(--spacing-xl);
        }

        .section-title {
          font-size: 1.5rem;
          font-family: var(--font-heading);
          margin-bottom: var(--spacing-lg);
        }

        .history-timeline {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .history-day {
          background: white;
          border: 3px solid #000;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 4px 4px 0 #000;
        }

        .history-date {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f8f9fa, #eef0f2);
          border-bottom: 2px solid #000;
          font-weight: 600;
        }

        .date-icon {
          font-size: 1.2rem;
        }

        .date-text {
          font-family: var(--font-heading);
          font-size: 1.1rem;
        }

        .history-items {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-item {
          display: block;
          padding: 16px;
          background: #fafafa;
          border: 2px solid #eee;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }

        .history-item:hover {
          background: #f0f0ff;
          border-color: #667eea;
          transform: translateX(4px);
        }

        .item-title {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 6px;
          color: #333;
        }

        .item-summary {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .item-time {
          font-size: 0.8rem;
          color: #999;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
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

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>

      <style jsx>{`
        .stat-card {
          text-align: center;
          padding: 24px 16px;
          background: white;
          border: 3px solid #000;
          border-radius: 16px;
          box-shadow: 4px 4px 0 #000;
          transition: all 0.2s;
        }

        .stat-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 #000;
        }

        .stat-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
