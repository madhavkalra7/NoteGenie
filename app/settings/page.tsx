'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'

export default function SettingsPage() {
  const router = useRouter()
  const { clearAll, state, isReady, signOut } = useApp()

  // Redirect to login if not authenticated (only after ready)
  useEffect(() => {
    if (isReady && !state.user) {
      router.push('/auth/login')
    }
  }, [isReady, state.user, router])

  // Show loading until ready
  if (!isReady) {
    return (
      <PageLayout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
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

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearAll()
      alert('All data cleared successfully!')
    }
  }

  const handleExportData = () => {
    // Export data as JSON
    const data = {
      summaries: state.summaries,
      flashcards: state.flashcards,
      concepts: state.concepts,
      questions: state.questions,
      studyPlan: state.studyPlan,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notegenie-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <PageLayout>
      <div className="settings-page">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your NoteGenie preferences</p>

        <div className="settings-grid">
          {/* Data Management */}
          <Card title="Data Management">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Export Data</h3>
                <p>Download all your notes and flashcards as JSON.</p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                Export Data 📥
              </Button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Clear All Data</h3>
                <p>Delete all stored data. This cannot be undone.</p>
              </div>
              <Button variant="danger" onClick={handleClearData}>
                Clear Everything 🗑️
              </Button>
            </div>
          </Card>

          {/* Account */}
          <Card title="Account">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Email</h3>
                <p>{state.user?.email}</p>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Log Out</h3>
                <p>Sign out of your account on this device.</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Log Out 🚪
              </Button>
            </div>
          </Card>

          {/* About */}
          <Card title="About NoteGenie">
            <div className="about-content">
              <p>
                <strong>Version:</strong> 1.0.0
              </p>
              <p>
                <strong>Multi-Agent Architecture:</strong> 14 specialized AI agents
              </p>
              <p>
                NoteGenie uses cutting-edge AI technology to help students learn more effectively.
                Our multi-agent system breaks down complex studying tasks into specialized operations,
                providing you with summaries, flashcards, quizzes, and personalized study plans.
              </p>
              <div className="agent-list">
                <div className="agent-badge">📝 Summarizer</div>
                <div className="agent-badge">🔍 Concept Extractor</div>
                <div className="agent-badge">🔖 Flashcard Generator</div>
                <div className="agent-badge">❓ Question Maker</div>
                <div className="agent-badge">✅ Answer Validator</div>
                <div className="agent-badge">📅 Study Planner</div>
                <div className="agent-badge">🧠 Memory Retention</div>
                <div className="agent-badge">💡 Doubt Resolver</div>
                <div className="agent-badge">🎤 Audio to Notes</div>
                <div className="agent-badge">🎯 Difficulty Detector</div>
                <div className="agent-badge">🗺️ Concept Graph</div>
                <div className="agent-badge">✍️ OCR</div>
                <div className="agent-badge">🖍️ Highlight Analyzer</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .settings-page {
          max-width: 900px;
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

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) 0;
          border-bottom: 1px dashed #ccc;
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-info h3 {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-xs);
        }

        .setting-info p {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .about-content {
          line-height: 1.8;
        }

        .about-content p {
          margin-bottom: var(--spacing-md);
          color: var(--color-text-secondary);
        }

        .about-content strong {
          color: var(--color-text-primary);
        }

        .agent-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-lg);
        }

        .agent-badge {
          padding: var(--spacing-xs) var(--spacing-md);
          background: var(--color-highlight-yellow);
          color: black;
          border: 2px solid black;
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          transform: rotate(-1deg);
        }

        .agent-badge:nth-child(even) {
          transform: rotate(1deg);
        }

        @media (max-width: 768px) {
          .setting-item {
            flex-direction: column;
            text-align: center;
            gap: var(--spacing-md);
          }
        }
      `}</style>
    </PageLayout>
  )
}
