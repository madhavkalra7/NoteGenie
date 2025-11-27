'use client'

import { useState } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AgentTimeline from '@/components/AgentTimeline'
import ConceptTag from '@/components/ConceptTag'
import Flashcard from '@/components/Flashcard'
import { useApp } from '@/context/AppContext'
import { summarizeNotes } from '@/agents/summarizerAgent'
import { extractConcepts } from '@/agents/conceptExtractorAgent'
import { generateFlashcards } from '@/agents/flashcardAgent'
import { generateQuestions } from '@/agents/questionMakerAgent'
import { detectDifficulty } from '@/agents/difficultyDetectorAgent'
import { extractHandwriting } from '@/agents/handwritingOCRAgent'

export default function NotesPage() {
  const { addSummary, addConcepts, addFlashcards, addQuestions } = useApp()
  
  const [noteText, setNoteText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [agentSteps, setAgentSteps] = useState<any[]>([])

  const handleSummarize = async () => {
    if (!noteText.trim()) return

    setProcessing(true)
    setResult(null)

    // Initialize agent timeline
    const steps: { agent: string; status: 'pending' | 'processing' | 'completed'; icon: string }[] = [
      { agent: 'Summarizer', status: 'processing', icon: '📝' },
      { agent: 'Concept Extractor', status: 'pending', icon: '🔍' },
      { agent: 'Flashcard Generator', status: 'pending', icon: '🔖' },
      { agent: 'Question Maker', status: 'pending', icon: '❓' },
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
      steps[4].status = 'completed'
      setAgentSteps([...steps])

      // Step 4: Generate Flashcards
      const { flashcards } = await generateFlashcards({ concepts: taggedConcepts })
      steps[2].status = 'completed'
      steps[3].status = 'processing'
      setAgentSteps([...steps])

      // Step 5: Generate Questions
      const { questions } = await generateQuestions({ 
        concepts: taggedConcepts, 
        summary: summary.shortSummary 
      })
      steps[3].status = 'completed'
      setAgentSteps([...steps])

      // Save to context
      const newSummary = {
        id: `summary-${Date.now()}`,
        title: 'My Notes',
        ...summary,
        rawText: noteText,
        createdAt: new Date(),
      }
      addSummary(newSummary)
      addConcepts(taggedConcepts)
      addFlashcards(flashcards)
      addQuestions(questions)

      setResult({
        summary,
        concepts: taggedConcepts,
        flashcards,
        questions,
      })
    } catch (error) {
      console.error('Error processing notes:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    try {
      const { extractedText } = await extractHandwriting({ imageFile: file })
      setNoteText(extractedText)
    } catch (error) {
      console.error('Error extracting handwriting:', error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <PageLayout>
      <div className="notes-page">
        <h1 className="page-title">Summarize & Analyze Notes</h1>
        <p className="page-subtitle">Upload or paste your notes to extract summaries, concepts, flashcards, and quiz questions</p>

        {/* Input Section */}
        <Card className="input-card">
          <h2 className="section-title">Input Your Notes</h2>
          
          <div className="input-options">
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

            <div className="upload-section">
              <label className="upload-label">Or Upload Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
              <p className="upload-hint">📸 Upload handwritten notes for OCR extraction</p>
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
              <h2 className="section-title">🔍 Extracted Concepts</h2>
              <div className="concepts-grid">
                {result.concepts.map((concept: any) => (
                  <ConceptTag key={concept.id} concept={concept} />
                ))}
              </div>
            </Card>

            {/* Flashcards Preview */}
            <Card>
              <h2 className="section-title">🔖 Generated Flashcards ({result.flashcards.length})</h2>
              {result.flashcards.length > 0 && (
                <div className="flashcard-preview">
                  <Flashcard 
                    question={result.flashcards[0].question}
                    answer={result.flashcards[0].answer}
                  />
                  <p className="preview-note">
                    Showing 1 of {result.flashcards.length} flashcards. 
                    <a href="/flashcards"> View all →</a>
                  </p>
                </div>
              )}
            </Card>

            {/* Questions Preview */}
            <Card>
              <h2 className="section-title">❓ Practice Questions ({result.questions.length})</h2>
              <div className="questions-preview">
                {result.questions.slice(0, 2).map((q: any, idx: number) => (
                  <div key={q.id} className="question-item">
                    <div className="question-header">
                      <span className="question-number">Q{idx + 1}</span>
                      <span className={`difficulty-badge ${q.difficulty}`}>{q.difficulty}</span>
                    </div>
                    <p className="question-text">{q.question}</p>
                    {q.type === 'mcq' && q.options && (
                      <ul className="options-list">
                        {q.options.map((opt: string, i: number) => (
                          <li key={i}>{String.fromCharCode(65 + i)}. {opt}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <p className="preview-note">
                  <a href="/flashcards">Go to Quiz Mode →</a>
                </p>
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
        }

        .upload-section {
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          text-align: center;
        }

        .upload-label {
          font-weight: var(--font-weight-medium);
          display: block;
          margin-bottom: var(--spacing-md);
        }

        .file-input {
          display: block;
          width: 100%;
          max-width: 300px;
          margin: 0 auto var(--spacing-sm);
        }

        .upload-hint {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
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

        .concepts-grid {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .flashcard-preview,
        .questions-preview {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .preview-note {
          text-align: center;
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
        }

        .preview-note a {
          color: var(--color-accent);
          font-weight: var(--font-weight-medium);
        }

        .question-item {
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .question-number {
          font-weight: var(--font-weight-bold);
          color: var(--color-accent);
          font-size: var(--font-size-lg);
        }

        .difficulty-badge {
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
        }

        .difficulty-badge.easy {
          background: rgba(123, 198, 126, 0.2);
          color: var(--color-easy);
        }

        .difficulty-badge.medium {
          background: rgba(255, 183, 77, 0.2);
          color: var(--color-medium);
        }

        .difficulty-badge.hard {
          background: rgba(229, 115, 115, 0.2);
          color: var(--color-hard);
        }

        .question-text {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-md);
        }

        .options-list {
          list-style: none;
          padding: 0;
        }

        .options-list li {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-card);
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-xs);
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
