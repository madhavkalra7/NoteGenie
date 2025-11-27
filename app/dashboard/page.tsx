'use client'

import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import { useApp } from '@/context/AppContext'
import Link from 'next/link'
import ConceptTag from '@/components/ConceptTag'

export default function DashboardPage() {
  const { state } = useApp()

  return (
    <PageLayout>
      <div className="dashboard-page">
        <h1 className="page-title animate-fade-in">Dashboard</h1>
        <p className="page-subtitle animate-fade-in">Your learning progress at a glance</p>

        {/* Stats Cards */}
        <div className="stats-grid animate-slide-up">
          <StatCard
            icon="📝"
            label="Notes Processed"
            value={state.stats.notesProcessed}
            color="var(--color-accent)"
          />
          <StatCard
            icon="🔖"
            label="Flashcards Generated"
            value={state.stats.flashcardsGenerated}
            color="var(--color-success)"
          />
          <StatCard
            icon="❓"
            label="Quizzes Taken"
            value={state.stats.quizzesTaken}
            color="var(--color-info)"
          />
          <StatCard
            icon="🎯"
            label="Study Tasks"
            value={state.studyPlan.filter(t => !t.completed).length}
            color="var(--color-warning)"
          />
        </div>

        {/* Main Dashboard Content */}
        <div className="dashboard-grid">
          {/* Today's Focus */}
          <Card className="focus-card">
            <h2 className="card-title">Today's Focus</h2>
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

          {/* Recent Notes */}
          <Card className="recent-card">
            <h2 className="card-title">Recently Summarized</h2>
            {state.summaries.length > 0 ? (
              <div className="recent-list">
                {state.summaries.slice(0, 3).map(summary => (
                  <div key={summary.id} className="recent-item">
                    <div className="recent-title">{summary.title || 'Untitled Note'}</div>
                    <div className="recent-summary">{summary.oneLiner}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No notes yet</p>
                <Link href="/notes">Upload Notes →</Link>
              </div>
            )}
          </Card>

          {/* Weak Topics */}
          <Card className="weak-topics-card">
            <h2 className="card-title">Concepts to Review</h2>
            {state.concepts.length > 0 ? (
              <div className="concepts-list">
                {state.concepts.slice(0, 6).map(concept => (
                  <ConceptTag key={concept.id} concept={concept} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No concepts extracted yet</p>
              </div>
            )}
          </Card>

          {/* Flashcard Review */}
          <Card className="flashcard-review-card">
            <h2 className="card-title">Revision Recommendations</h2>
            {state.flashcards.length > 0 ? (
              <div className="review-content">
                <div className="review-stat">
                  <span className="stat-number">{state.flashcards.length}</span>
                  <span className="stat-label">Total Flashcards</span>
                </div>
                <Link href="/flashcards">
                  <button className="btn btn-primary">Start Reviewing →</button>
                </Link>
              </div>
            ) : (
              <div className="empty-state">
                <p>No flashcards yet! Generate some from your notes!</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          animation: fadeIn 0.5s ease-out;
        }

        .page-title {
          font-size: var(--font-size-4xl);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-sm);
        }

        .page-subtitle {
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-2xl);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--spacing-lg);
        }

        .card-title {
          font-size: var(--font-size-xl);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-lg);
          font-weight: var(--font-weight-semibold);
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--color-text-muted);
        }

        .empty-state a {
          color: var(--color-accent);
          font-weight: var(--font-weight-medium);
          margin-top: var(--spacing-md);
          display: inline-block;
        }

        .focus-content,
        .recent-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .focus-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
        }

        .priority-badge {
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
        }

        .priority-high {
          background: var(--color-error);
          color: white;
        }

        .priority-medium {
          background: var(--color-warning);
          color: white;
        }

        .priority-low {
          background: var(--color-info);
          color: white;
        }

        .focus-topics {
          flex: 1;
          font-weight: var(--font-weight-medium);
        }

        .focus-duration {
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
        }

        .recent-item {
          padding: var(--spacing-md);
          border-left: 3px solid var(--color-accent);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-sm);
        }

        .recent-title {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .recent-summary {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .concepts-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .review-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-xl) 0;
        }

        .review-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-number {
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-accent);
        }

        .stat-label {
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
        }

        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
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
    <Card hover={true}>
      <div className="stat-card">
        <div className="stat-icon">{icon}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>

        <style jsx>{`
          .stat-card {
            text-align: center;
          }

          .stat-icon {
            font-size: 2.5rem;
            margin-bottom: var(--spacing-sm);
          }

          .stat-value {
            font-size: var(--font-size-3xl);
            font-weight: var(--font-weight-bold);
            margin-bottom: var(--spacing-xs);
          }

          .stat-label {
            font-size: var(--font-size-base);
            color: var(--color-text-secondary);
            font-weight: var(--font-weight-medium);
          }
        `}</style>
      </div>
    </Card>
  )
}
