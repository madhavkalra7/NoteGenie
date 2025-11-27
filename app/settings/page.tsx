'use client'

import { useState } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'

export default function SettingsPage() {
  const { clearAll } = useApp()

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearAll()
      alert('All data cleared successfully!')
    }
  }

  const handleExportData = () => {
    alert('Data export feature coming soon!')
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
