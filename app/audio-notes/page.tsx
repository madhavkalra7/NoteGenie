'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useApp } from '@/context/AppContext'
import Link from 'next/link'

export default function AudioNotesPage() {
  const router = useRouter()
  const { addSummary, addConcepts, addFlashcards, state, isReady } = useApp()
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [transcriptionExpanded, setTranscriptionExpanded] = useState(false)

  // Redirect to login if not authenticated (only after ready)
  useEffect(() => {
    if (isReady && !state.user) {
      router.push('/auth/login')
    }
  }, [isReady, state.user, router])

  const steps = [
    { label: 'Transcribing Audio', icon: '🎤' },
    { label: 'Cleaning Transcription', icon: '🧹' },
    { label: 'Summarizing Content', icon: '📝' },
    { label: 'Generating Resources', icon: '✨' },
  ]

  // Show loading until ready
  if (!isReady) {
    return (
      <PageLayout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAudioFile(file)
  }

  const handleProcess = async () => {
    if (!audioFile) return

    setProcessing(true)
    setCurrentStep(0)
    setResult(null)

    try {
      // Step 1: Transcribing
      setCurrentStep(1)
      
      // Upload audio to API for transcription
      const formData = new FormData()
      formData.append('audio', audioFile)

      console.log('Uploading audio file...')
      const response = await fetch('/api/audio-to-notes', {
        method: 'POST',
        body: formData,
      })

      console.log('Response status:', response.status)
      if (!response.ok) {
        throw new Error('Failed to process audio')
      }

      const audioResult = await response.json()
      console.log('Audio result:', audioResult)

      // Validate result structure
      if (!audioResult || !audioResult.summary) {
        throw new Error('Invalid response format')
      }

      // Step 2: Cleaning
      setCurrentStep(2)
      await new Promise(r => setTimeout(r, 500))

      // Step 3: Summarizing
      setCurrentStep(3)
      await new Promise(r => setTimeout(r, 500))

      // Step 4: Generating resources
      setCurrentStep(4)
      await new Promise(r => setTimeout(r, 500))

      // First stop processing, then set result
      setProcessing(false)
      
      // Small delay to ensure state updates properly
      await new Promise(r => setTimeout(r, 100))
      
      setResult(audioResult)
      console.log('Result set:', audioResult)
      
      // Save to database with all audio notes data
      await addSummary({
        title: 'Lecture Notes from Audio',
        raw_text: audioResult.transcription, // Original transcription
        one_liner: audioResult.summary.oneLiner,
        short_summary: audioResult.summary.shortSummary,
        detailed_bullets: audioResult.summary.detailedBullets,
      })
      
      console.log('Audio notes saved to database ✅')
      alert('🎉 Audio notes saved successfully!')
    } catch (error) {
      console.error('Error processing audio:', error)
      alert('Failed to process audio. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <PageLayout>
      <div className="audio-notes-page">
        <h1 className="page-title">Audio to Notes</h1>
        <p className="page-subtitle">Upload lecture recordings and convert them to clean, structured notes</p>

        {/* Upload Section */}
        <Card>
          <h2 className="section-title">Upload Audio</h2>
          <div className="upload-area">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="file-input"
            />
            {audioFile && (
              <div className="file-info">
                <span className="file-icon">🎵</span>
                <span className="file-name">{audioFile.name}</span>
                <span className="file-size">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
          </div>
          <Button onClick={handleProcess} disabled={!audioFile || processing} loading={processing}>
            {processing ? 'Processing...' : 'Process Audio'}
          </Button>
        </Card>

        {/* Stepper Progress */}
        {processing && (
          <div className="stepper-container animate-fade-in">
            {steps.map((step, idx) => (
              <div key={idx} className={`stepper-step ${idx < currentStep ? 'completed' : idx === currentStep ? 'active' : ''}`}>
                <div className="step-indicator">
                  {idx < currentStep ? '✓' : step.icon}
                </div>
                <div className="step-label">{step.label}</div>
                {idx < steps.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        )}

        {processing && <LoadingSpinner size="lg" />}

        {/* Results */}
        {result && !processing && (
          <div className="results-section animate-fade-in">
            <Card>
              <h2 className="section-title">📄 Original Transcription</h2>
              <div className="transcription-box">
                <p className={transcriptionExpanded ? 'expanded' : 'collapsed'}>
                  {result.transcription}
                </p>
                {!transcriptionExpanded && result.transcription.length > 200 && (
                  <button 
                    className="show-more-btn"
                    onClick={() => setTranscriptionExpanded(true)}
                  >
                    Show More ⋯
                  </button>
                )}
                {transcriptionExpanded && (
                  <button 
                    className="show-more-btn"
                    onClick={() => setTranscriptionExpanded(false)}
                  >
                    Show Less ↑
                  </button>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="section-title">📝 Structured Notes</h2>
              <div className="structured-notes">
                {result.structuredNotes.split('\n').map((line: string, idx: number) => {
                  if (line.startsWith('# ')) {
                    return <h3 key={idx} className="notes-heading">{line.replace('# ', '')}</h3>
                  } else if (line.startsWith('• ')) {
                    return (
                      <div key={idx} className="note-item">
                        <span className="bullet">•</span>
                        <p>{line.replace('• ', '')}</p>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </Card>

            <Card>
              <h2 className="section-title">📌 Summary</h2>
              <div className="summary-box">
                <div className="summary-item">
                  <strong>Quick Glance:</strong>
                  <p>{result.summary.oneLiner}</p>
                </div>
                <div className="summary-item">
                  <strong>Short Summary:</strong>
                  <p>{result.summary.shortSummary}</p>
                </div>
                <div className="summary-item">
                  <strong>Key Points:</strong>
                  <ul>
                    {result.summary.detailedBullets.map((bullet: string, idx: number) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Audio Notes History */}
        {!processing && (
          <div className="history-section animate-fade-in">
            <h2 className="section-title">🎤 Your Audio Notes History</h2>
            {state.summaries.filter(s => s.title === 'Lecture Notes from Audio').length > 0 ? (
              <div className="history-grid">
                {state.summaries
                  .filter(s => s.title === 'Lecture Notes from Audio')
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map(summary => (
                    <Link 
                      key={summary.id} 
                      href={`/summary/${summary.id}`}
                      className="history-card"
                    >
                      <div className="history-card-header">
                        <span className="audio-icon">🎤</span>
                        <span className="history-date">
                          {new Date(summary.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="history-card-content">
                        <p className="history-summary">{summary.one_liner}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <Card>
                <div className="empty-history">
                  <span className="empty-icon">📭</span>
                  <p>No audio notes yet</p>
                  <p className="empty-hint">Upload your first audio file to get started!</p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .audio-notes-page {
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

        .section-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-lg);
        }

        .upload-area {
          margin-bottom: var(--spacing-lg);
          padding: var(--spacing-xl);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          text-align: center;
        }

        .file-input {
          display: block;
          width: 100%;
          max-width: 400px;
          margin: 0 auto var(--spacing-md);
        }

        .file-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-card);
          border-radius: var(--radius-md);
          margin-top: var(--spacing-md);
        }

        .file-icon {
          font-size: var(--font-size-2xl);
        }

        .file-name {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .file-size {
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
        }

        .stepper-container {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: var(--spacing-2xl);
          margin: var(--spacing-xl) 0;
          background: var(--color-card);
          border-radius: var(--radius-lg);
          overflow-x: auto;
        }

        .stepper-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          min-width: 120px;
        }

        .step-indicator {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-2xl);
          background: var(--color-bg-secondary);
          border-radius: 50%;
          margin-bottom: var(--spacing-sm);
          transition: all var(--transition-base);
        }

        .stepper-step.active .step-indicator {
          background: var(--color-accent);
          color: white;
          animation: pulse 1.5s infinite;
        }

        .stepper-step.completed .step-indicator {
          background: var(--color-success);
          color: white;
        }

        .step-label {
          font-size: var(--font-size-sm);
          text-align: center;
          color: var(--color-text-secondary);
        }

        .stepper-step.active .step-label {
          color: var(--color-accent);
          font-weight: var(--font-weight-semibold);
        }

        .step-connector {
          position: absolute;
          top: 30px;
          left: 100%;
          width: 100%;
          height: 2px;
          background: var(--color-bg-secondary);
        }

        .stepper-step.completed .step-connector {
          background: var(--color-success);
        }

        .results-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          margin-top: var(--spacing-xl);
        }

        .transcription-box {
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          position: relative;
        }

        .transcription-box p {
          font-size: var(--font-size-sm);
          line-height: var(--line-height-relaxed);
          color: var(--color-text-secondary);
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .transcription-box p.collapsed {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .transcription-box p.expanded {
          display: block;
        }

        .show-more-btn {
          background: none;
          border: none;
          color: var(--color-accent);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          margin-top: var(--spacing-sm);
          padding: var(--spacing-xs) 0;
          font-size: var(--font-size-sm);
          transition: opacity 0.2s;
        }

        .show-more-btn:hover {
          opacity: 0.8;
        }

        .structured-notes {
          padding: var(--spacing-xl);
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: var(--radius-lg);
          border-left: 4px solid var(--color-accent);
        }

        .notes-heading {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-sm);
          border-bottom: 2px solid var(--color-accent);
        }

        .note-item {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
          padding: var(--spacing-md);
          background: white;
          border-radius: var(--radius-md);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .note-item:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .note-item .bullet {
          color: var(--color-accent);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          flex-shrink: 0;
        }

        .note-item p {
          margin: 0;
          line-height: var(--line-height-relaxed);
          color: var(--color-text-primary);
        }

        .summary-box {
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
        }

        .summary-item {
          margin-bottom: var(--spacing-lg);
        }

        .summary-item strong {
          display: block;
          color: var(--color-accent);
          margin-bottom: var(--spacing-xs);
        }

        .summary-item ul {
          list-style: none;
          padding: 0;
        }

        .summary-item li {
          padding: var(--spacing-sm);
          padding-left: var(--spacing-md);
          border-left: 3px solid var(--color-accent);
          margin-bottom: var(--spacing-xs);
          background: var(--color-card);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }

        /* History Section */
        .history-section {
          margin-top: var(--spacing-2xl);
          padding-top: var(--spacing-2xl);
          border-top: 2px solid var(--color-bg-secondary);
        }

        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-lg);
          margin-top: var(--spacing-lg);
        }

        .history-card {
          display: block;
          padding: var(--spacing-lg);
          background: white;
          border: 3px solid #000;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          box-shadow: 4px 4px 0 #000;
          transition: all 0.2s;
        }

        .history-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 #000;
        }

        .history-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
          padding-bottom: var(--spacing-sm);
          border-bottom: 2px solid #f0f0f0;
        }

        .audio-icon {
          font-size: 1.5rem;
          animation: pulse 2s infinite;
        }

        .history-date {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          font-weight: var(--font-weight-medium);
        }

        .history-card-content {
          line-height: 1.5;
        }

        .history-summary {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .empty-history {
          text-align: center;
          padding: var(--spacing-2xl);
        }

        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: var(--spacing-md);
        }

        .empty-history p {
          margin: var(--spacing-xs) 0;
          color: var(--color-text-secondary);
        }

        .empty-hint {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
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
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </PageLayout>
  )
}
