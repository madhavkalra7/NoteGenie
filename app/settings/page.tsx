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
  const [nickname, setNickname] = useState('')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    if (state.user) {
      setNickname(state.user.user_metadata?.name || '')
    }
  }, [state.user])

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

  const handleSaveName = async () => {
    if (!nickname.trim()) return

    setSavingName(true)
    try {
      // Call API to update profile
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.user!.id,
          email: state.user!.email,
          name: nickname.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      alert('✅ Name updated successfully!')
      window.location.reload()
    } catch (error) {
      console.error('Error saving name:', error)
      alert('Failed to save name. Please try again.')
    } finally {
      setSavingName(false)
    }
  }

  return (
    <PageLayout>
      <div className="settings-page">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your NoteGenie preferences</p>

        <div className="settings-grid">
          {/* Profile Settings */}
          <Card title="Profile Settings">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Display Name</h3>
                <p>This name will be displayed instead of your email.</p>
              </div>
              <div className="name-input-group">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your name..."
                  className="name-input"
                  maxLength={50}
                />
                <Button 
                  onClick={handleSaveName} 
                  disabled={!nickname.trim() || savingName}
                  loading={savingName}
                >
                  {savingName ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </Card>

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
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-info {
          flex: 1;
          min-width: 200px;
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

        .name-input-group {
          display: flex;
          gap: var(--spacing-sm);
          flex: 1;
          min-width: 300px;
        }

        .name-input {
          flex: 1;
          padding: var(--spacing-md);
          font-size: var(--font-size-md);
          border: 3px solid #000;
          border-radius: var(--radius-md);
          font-family: var(--font-body);
          transition: all 0.2s;
        }

        .name-input:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
