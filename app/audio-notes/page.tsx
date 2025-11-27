'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { convertAudioToNotes } from '@/agents/audioToNotesAgent'
import { useApp } from '@/context/AppContext'

export default function AudioNotesPage() {
  const router = useRouter()
  const { addSummary, addConcepts, addFlashcards, state, isReady } = useApp()
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<any>(null)

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
      await new Promise(r => setTimeout(r, 1000))

      // Step 2: Cleaning
      setCurrentStep(2)
      await new Promise(r => setTimeout(r, 800))

      // Step 3: Summarizing
      setCurrentStep(3)
      const audioResult = await convertAudioToNotes({ audioFile })

      // Step 4: Generating resources
      setCurrentStep(4)
      await new Promise(r => setTimeout(r, 500))

      setResult(audioResult)
      
      // Save to context with correct field names (snake_case for DB)
      await addSummary({
        title: 'Lecture Notes from Audio',
        raw_text: audioResult.cleanedText,
        one_liner: audioResult.summary.oneLiner,
        short_summary: audioResult.summary.shortSummary,
        detailed_bullets: audioResult.summary.detailedBullets,
      })
    } catch (error) {
      console.error('Error processing audio:', error)
    } finally {
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
                <pre>{result.transcription}</pre>
              </div>
            </Card>

            <Card>
              <h2 className="section-title">✨ Cleaned Transcription</h2>
              <div className="cleaned-box">
                <p>{result.cleanedText}</p>
              </div>
            </Card>

            <Card>
              <h2 className="section-title">📝 Structured Notes</h2>
              <div className="structured-notes">
                <pre>{result.structuredNotes}</pre>
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

        .transcription-box,
        .cleaned-box,
        .structured-notes,
        .summary-box {
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
        }

        .transcription-box pre,
        .structured-notes pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: var(--font-family);
          font-size: var(--font-size-sm);
          line-height: var(--line-height-relaxed);
          color: var(--color-text-secondary);
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
