'use client'

import { useState } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { createStudyPlan } from '@/agents/studyPlanAgent'

export default function StudyPlanPage() {
  const { state, setStudyPlan } = useApp()
  const [topics, setTopics] = useState('')
  const [timePerDay, setTimePerDay] = useState('60')
  const [daysUntilExam, setDaysUntilExam] = useState('14')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    const topicsList = topics.split(',').map(t => t.trim()).filter(t => t)
    if (topicsList.length === 0) return

    setGenerating(true)
    try {
      const planResult = await createStudyPlan({
        topics: topicsList,
        timePerDay: parseInt(timePerDay),
        daysUntilExam: parseInt(daysUntilExam),
      })
      setStudyPlan(planResult.plan)
    } catch (error) {
      console.error('Error generating study plan:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <PageLayout>
      <div className="study-plan-page">
        <h1 className="page-title">Study Plan & Progress</h1>
        <p className="page-subtitle">Create a personalized study schedule based on your topics and available time</p>

        {/* Input Form */}
        <Card>
          <h2 className="section-title">Generate Study Plan</h2>
          
          <div className="form-group">
            <label>Topics (comma-separated):</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Machine Learning, Neural Networks, Python"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Study Time Per Day (minutes):</label>
              <input
                type="number"
                className="input"
                value={timePerDay}
                onChange={(e) => setTimePerDay(e.target.value)}
                min="30"
                max="480"
              />
            </div>

            <div className="form-group">
              <label>Days Until Exam:</label>
              <input
                type="number"
                className="input"
                value={daysUntilExam}
                onChange={(e) => setDaysUntilExam(e.target.value)}
                min="1"
                max="365"
              />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={!topics.trim() || generating} loading={generating}>
            {generating ? 'Generating...' : 'Generate Study Plan'}
          </Button>
        </Card>

        {/* Study Plan Display */}
        {state.studyPlan.length > 0 && (
          <div className="plan-section animate-fade-in">
            <Card>
              <h2 className="section-title">📅 Your Study Schedule</h2>
              <div className="plan-grid">
                {state.studyPlan.map((task) => (
                  <div key={task.id} className={`plan-card priority-${task.priority}`}>
                    <div className="plan-header">
                      <span className="day-badge">Day {task.day}</span>
                      <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                    </div>
                    <div className="plan-topics">
                      {task.topics.join(', ')}
                    </div>
                    <div className="plan-duration">{task.duration} minutes</div>
                    <div className="plan-date">
                      {new Date(task.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Progress Overview */}
            <Card>
              <h2 className="section-title">📊 Progress Overview</h2>
              <div className="progress-stats">
                <div className="stat-item">
                  <div className="stat-value">{state.studyPlan.length}</div>
                  <div className="stat-label">Total Tasks</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{state.studyPlan.filter(t => t.completed).length}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{state.studyPlan.filter(t => !t.completed).length}</div>
                  <div className="stat-label">Remaining</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {Math.round((state.studyPlan.filter(t => t.completed).length / state.studyPlan.length) * 100)}%
                  </div>
                  <div className="stat-label">Complete</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <style jsx>{`
        .study-plan-page {
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-title {
          font-size: var(--font-size-3xl);
          margin-bottom: var(--spacing-sm);
        }

        .page-subtitle {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-2xl);
        }

        .section-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-lg);
        }

        .form-group {
          margin-bottom: var(--spacing-lg);
        }

        .form-group label {
          display: block;
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-primary);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-lg);
        }

        .plan-section {
          margin-top: var(--spacing-2xl);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .plan-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: var(--spacing-md);
        }

        .plan-card {
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          border-left: 4px solid;
          transition: all var(--transition-fast);
        }

        .plan-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .plan-card.priority-high {
          border-color: var(--color-error);
        }

        .plan-card.priority-medium {
          border-color: var(--color-warning);
        }

        .plan-card.priority-low {
          border-color: var(--color-info);
        }

        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .day-badge {
          font-weight: var(--font-weight-bold);
          color: var(--color-accent);
          font-size: var(--font-size-lg);
        }

        .priority-badge {
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
        }

        .priority-badge.high {
          background: var(--color-error);
          color: white;
        }

        .priority-badge.medium {
          background: var(--color-warning);
          color: white;
        }

        .priority-badge.low {
          background: var(--color-info);
          color: white;
        }

        .plan-topics {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-sm);
          font-size: var(--font-size-base);
        }

        .plan-duration {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-xs);
        }

        .plan-date {
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
        }

        .progress-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-lg);
        }

        .stat-item {
          text-align: center;
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
        }

        .stat-value {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-accent);
          margin-bottom: var(--spacing-sm);
        }

        .stat-label {
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageLayout>
  )
}
