'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AgentTimeline from '@/components/AgentTimeline'
import { useApp } from '@/context/AppContext'
import { summarizeNotes } from '@/agents/summarizerAgent'
import { extractConcepts } from '@/agents/conceptExtractorAgent'
import { detectDifficulty } from '@/agents/difficultyDetectorAgent'

export default function NotesPage() {
  const router = useRouter()
  const { addSummary, addConcepts, state, isReady } = useApp()
  
  const [noteText, setNoteText] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [agentSteps, setAgentSteps] = useState<any[]>([])

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
          <p>Loading...</p>
          <style jsx>{`
            .loading-state {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              gap: 20px;
              font-family: var(--font-heading);
              font-size: 1.5rem;
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

  const handleSummarize = async () => {
    if (!noteText.trim()) return

    setProcessing(true)
    setResult(null)

    // Initialize agent timeline - Only summarize and extract concepts
    const steps: { agent: string; status: 'pending' | 'processing' | 'completed'; icon: string }[] = [
      { agent: 'Summarizer', status: 'processing', icon: '📝' },
      { agent: 'Concept Extractor', status: 'pending', icon: '🔍' },
      { agent: 'Difficulty Detector', status: 'pending', icon: '🎯' },
    ]
    setAgentSteps([...steps])

    try {
      // Step 1: Summarize
      const summary = await summarizeNotes({ rawText: noteText, title: 'My Notes' })
      steps[0].status = 'completed'
      steps[1].status = 'processing'
      setAgentSteps([...steps])

      // Step 2: Extract Concepts
      const { concepts: rawConcepts } = await extractConcepts({ text: noteText })
      steps[1].status = 'completed'
      steps[2].status = 'processing'
      setAgentSteps([...steps])

      // Step 3: Detect Difficulty
      const { taggedConcepts } = await detectDifficulty({ concepts: rawConcepts })
      steps[2].status = 'completed'
      setAgentSteps([...steps])

      // Save to database with correct field names
      const title = noteTitle.trim() || 'My Notes'
      
      console.log('💾 Saving summary to database...')
      
      // Add summary first to get the ID
      const savedSummary = await addSummary({
        title: title,
        raw_text: noteText,
        one_liner: summary.oneLiner,
        short_summary: summary.shortSummary,
        detailed_bullets: summary.detailedBullets,
      })

      console.log('💾 Saved summary result:', savedSummary)

      if (!savedSummary) {
        console.error('❌ Failed to save summary to database')
      }

      const summaryId = savedSummary?.id

      // Add concepts with correct format
      const dbConcepts = taggedConcepts.map((c: any) => ({
        summary_id: summaryId || null,
        term: c.term,
        definition: c.definition,
        category: c.category || null,
        difficulty: c.difficulty || 'medium',
      }))
      await addConcepts(dbConcepts, summaryId || undefined)

      setResult({
        summary,
        concepts: taggedConcepts,
        summaryId: savedSummary?.id,
      })
    } catch (error) {
      console.error('Error processing notes:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    try {
      // Send file to server for extraction
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract text')
      }

      if (data.text && data.text.trim()) {
        setNoteText(data.text)
      } else {
        alert('Could not extract text from file. The file might be empty or image-based.')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Error processing file: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <PageLayout>
      <div className="notes-page">
        <h1 className="page-title">Summarize & Analyze Notes</h1>
        <p className="page-subtitle">Upload PDF or text files, or paste your notes to extract summaries, concepts, flashcards, and quiz questions</p>

        {/* Input Section */}
        <Card className="input-card">
          <h2 className="section-title">Input Your Notes</h2>
          
          <div className="input-options">
            <div className="input-group">
              <label htmlFor="note-title">Note Title:</label>
              <input
                id="note-title"
                type="text"
                className="input title-input"
                placeholder="Give your notes a name..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
            </div>

            <div className="upload-section">
              <label className="upload-label">📁 Upload File:</label>
              <input
                type="file"
                accept=".pdf,.txt,.md,.rtf,text/plain,application/pdf"
                onChange={handleFileUpload}
                className="file-input"
              />
              <p className="upload-hint">Supports PDF, TXT, MD files</p>
            </div>

            <div className="divider">
              <span>OR</span>
            </div>

            <div className="input-group">
              <label htmlFor="note-text">Paste Text:</label>
              <textarea
                id="note-text"
                className="input textarea"
                placeholder="Paste your notes here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={10}
              />
            </div>
          </div>

          <Button 
            onClick={handleSummarize} 
            disabled={!noteText.trim() || processing}
            loading={processing}
            size="lg"
          >
            {processing ? 'Processing...' : 'Analyze Notes with AI Agents'}
          </Button>
        </Card>

        {/* Agent Timeline */}
        {agentSteps.length > 0 && (
          <div className="timeline-section">
            <AgentTimeline steps={agentSteps} />
          </div>
        )}

        {/* Processing State */}
        {processing && <LoadingSpinner size="lg" />}

        {/* Results Section */}
        {result && !processing && (
          <div className="results-section animate-fade-in">
            {/* Summary */}
            <Card>
              <h2 className="section-title">📝 Summary</h2>
              <div className="summary-content">
                <div className="summary-item">
                  <h3>Quick Glance:</h3>
                  <p className="one-liner">{result.summary.oneLiner}</p>
                </div>
                <div className="summary-item">
                  <h3>Short Summary:</h3>
                  <p>{result.summary.shortSummary}</p>
                </div>
                <div className="summary-item">
                  <h3>Key Points:</h3>
                  <ul className="bullet-list">
                    {result.summary.detailedBullets.map((bullet: string, idx: number) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Concepts */}
            <Card>
              <h2 className="section-title">🔍 Extracted Concepts ({result.concepts.length})</h2>
              <div className="concepts-list">
                {result.concepts.map((concept: any, idx: number) => (
                  <div key={idx} className="concept-item">
                    <span className={`difficulty-dot ${concept.difficulty}`}></span>
                    <strong>{concept.term}</strong>: {concept.definition}
                  </div>
                ))}
              </div>
            </Card>

            {/* Next Steps */}
            <Card>
              <h2 className="section-title">🚀 What's Next?</h2>
              <p className="next-steps-intro">Your notes have been saved! Now you can:</p>
              <div className="next-steps-grid">
                <a href="/flashcards" className="next-step-card">
                  <span className="next-step-icon">🔖</span>
                  <span className="next-step-title">Generate Flashcards</span>
                  <span className="next-step-desc">Create flashcards from these notes</span>
                </a>
                <a href="/study-plan" className="next-step-card">
                  <span className="next-step-icon">📅</span>
                  <span className="next-step-title">Study Plan</span>
                  <span className="next-step-desc">Plan your study schedule</span>
                </a>
                <a href="/concept-graph" className="next-step-card">
                  <span className="next-step-icon">🕸️</span>
                  <span className="next-step-title">Concept Graph</span>
                  <span className="next-step-desc">Visualize concept relationships</span>
                </a>
              </div>
            </Card>
          </div>
        )}
      </div>

      <style jsx>{`
        .notes-page {
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-title {
          font-size: var(--font-size-3xl);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-sm);
        }

        .page-subtitle {
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-2xl);
          line-height: var(--line-height-relaxed);
        }

        .section-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-lg);
        }

        .input-card {
          margin-bottom: var(--spacing-xl);
        }

        .input-options {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .input-group label {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          font-family: var(--font-heading);
          font-size: 1.2rem;
        }

        .title-input {
          font-family: var(--font-heading);
          font-size: 1.3rem;
          padding: 12px 16px;
          border: 3px solid #000;
          border-radius: 8px;
          box-shadow: 3px 3px 0px 0px black;
        }

        .title-input:focus {
          outline: none;
          box-shadow: 5px 5px 0px 0px black;
          transform: translate(-2px, -2px);
        }

        .upload-section {
          padding: var(--spacing-xl);
          background: #fffef0;
          border-radius: var(--radius-md);
          text-align: center;
          border: 3px dashed #000;
        }

        .upload-label {
          font-weight: var(--font-weight-bold);
          display: block;
          margin-bottom: var(--spacing-md);
          font-family: var(--font-heading);
          font-size: 1.3rem;
        }

        .file-input {
          display: block;
          width: 100%;
          max-width: 300px;
          margin: 0 auto var(--spacing-sm);
          padding: 10px;
          border: 2px solid #000;
          border-radius: 8px;
          cursor: pointer;
        }

        .upload-hint {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          font-family: var(--font-heading);
        }

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: var(--spacing-md) 0;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 2px dashed #ccc;
        }

        .divider span {
          padding: 0 var(--spacing-md);
          font-family: var(--font-heading);
          font-size: 1.2rem;
          color: #999;
        }

        .timeline-section {
          margin: var(--spacing-xl) 0;
        }

        .results-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .summary-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .summary-item h3 {
          font-size: var(--font-size-base);
          color: var(--color-accent);
          margin-bottom: var(--spacing-sm);
          font-weight: var(--font-weight-semibold);
        }

        .one-liner {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          font-style: italic;
        }

        .bullet-list {
          list-style: none;
          padding: 0;
        }

        .bullet-list li {
          padding: var(--spacing-sm) 0;
          padding-left: var(--spacing-md);
          border-left: 3px solid var(--color-accent);
          margin-bottom: var(--spacing-sm);
          background: var(--color-bg-secondary);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }

        .concepts-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .concept-item {
          padding: var(--spacing-md);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-sm);
        }

        .difficulty-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .difficulty-dot.easy {
          background: var(--color-easy);
        }

        .difficulty-dot.medium {
          background: var(--color-medium);
        }

        .difficulty-dot.hard {
          background: var(--color-hard);
        }

        .next-steps-intro {
          margin-bottom: var(--spacing-lg);
          color: var(--color-text-secondary);
        }

        .next-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }

        .next-step-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-xl);
          background: var(--color-bg-secondary);
          border: 3px solid #000;
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: all var(--transition-fast);
          box-shadow: 3px 3px 0px 0px black;
        }

        .next-step-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 5px 5px 0px 0px black;
        }

        .next-step-icon {
          font-size: 2rem;
          margin-bottom: var(--spacing-sm);
        }

        .next-step-title {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .next-step-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          text-align: center;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </PageLayout>
  )
}
