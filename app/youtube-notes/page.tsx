'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useApp } from '@/context/AppContext'

export default function YouTubeNotesPage() {
  const router = useRouter()
  const { addSummary, addConcepts, state, isReady } = useApp()
  
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated
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
              border-top: 4px solid #ff6b9d;
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

  const handleSubmit = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    // Basic URL validation
    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setProcessing(true)
    setError(null)
    setResult(null)

    try {
      // Call API route
      const response = await fetch('/api/youtube-to-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process video')
      }

      const notes = data.notes

      // Show result immediately
      setResult(notes)

      // Save to database in background (don't wait)
      const summaryData = {
        title: notes.title,
        short_summary: notes.shortSummary,
        detailed_bullets: notes.detailedBullets,
        one_liner: notes.oneLiner,
        raw_text: youtubeUrl
      }

      console.log('💾 Saving summary:', summaryData)

      addSummary(summaryData).then(savedSummary => {
        if (savedSummary) {
          console.log('✅ Summary saved:', savedSummary.id)
          
          // Update result with summary ID
          setResult((prev: any) => prev ? { ...prev, summaryId: savedSummary.id } : prev)
          
          // Save main topics as concepts
          const concepts = notes.mainTopics.map((topic: string) => ({
            summary_id: savedSummary.id,
            term: topic,
            definition: `Key topic from: ${notes.title}`,
            difficulty: 'medium' as const
          }))

          if (concepts.length > 0) {
            addConcepts(concepts).then(() => {
              console.log('✅ Concepts saved')
            }).catch(err => {
              console.error('⚠️ Failed to save concepts:', err)
            })
          }
        }
      }).catch(err => {
        console.error('⚠️ Failed to save summary:', err)
      })

    } catch (err: any) {
      console.error('YouTube processing error:', err)
      setError(err.message || 'Failed to process YouTube video')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <PageLayout>
      <div className="youtube-notes-page">
        <div className="page-header">
          <h1>🎥 YouTube to Notes</h1>
          <p className="subtitle">Transform any YouTube video into comprehensive study notes</p>
        </div>

        {!result ? (
          <Card className="input-card">
            <div className="input-section">
              <label htmlFor="youtube-url">YouTube Video URL</label>
              <input
                id="youtube-url"
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={processing}
                className="url-input"
              />
              
              <div className="help-text">
                📺 <strong>Paste YouTube video URL with captions/subtitles (CC)</strong>
                <br />
                💡 Tip: Most educational videos have captions. Look for the CC button on YouTube!
              </div>

              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={processing}
                className="generate-btn"
              >
                {processing ? (
                  <>
                    <LoadingSpinner />
                    <span>Processing Video...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Generate Notes</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="result-section">
            <div className="result-header">
              <h2>✅ Notes Generated!</h2>
              <div className="action-buttons">
                {result.summaryId && (
                  <Link href={`/summary/${result.summaryId}`}>
                    <Button className="view-btn">👁️ View Full Summary</Button>
                  </Link>
                )}
                <Button
                  onClick={() => {
                    setResult(null)
                    setYoutubeUrl('')
                    setError(null)
                  }}
                  className="new-btn"
                >
                  ➕ New Video
                </Button>
              </div>
            </div>

            <Card className="result-card">
              <h3 className="result-title">{result.title}</h3>
              
              <div className="one-liner">
                💡 <strong>{result.oneLiner}</strong>
              </div>

              <div className="summary-section">
                <h4>📋 Summary</h4>
                <p>{result.shortSummary}</p>
              </div>

              <div className="topics-section">
                <h4>🎯 Main Topics</h4>
                <div className="topics-list">
                  {result.mainTopics.map((topic: string, idx: number) => (
                    <span key={idx} className="topic-tag">{topic}</span>
                  ))}
                </div>
              </div>

              <div className="bullets-section">
                <h4>📝 Detailed Notes</h4>
                <ul>
                  {result.detailedBullets.map((bullet: string, idx: number) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>

              {result.keyTimestamps && result.keyTimestamps.length > 0 && (
                <div className="timestamps-section">
                  <h4>⏱️ Key Timestamps</h4>
                  <div className="timestamps-list">
                    {result.keyTimestamps.map((ts: any, idx: number) => (
                      <div key={idx} className="timestamp-item">
                        <span className="time">{ts.time}</span>
                        <span className="topic">{ts.topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* History Section */}
        {state.summaries.length > 0 && (
          <div className="history-section">
            <h3>📚 Previous Notes</h3>
            <div className="history-grid">
              {state.summaries
                .slice(0, 6)
                .map((summary) => (
                  <Link key={summary.id} href={`/summary/${summary.id}`}>
                    <Card className="history-card">
                      <div className="history-icon">🎥</div>
                      <h4>{summary.title}</h4>
                      <p>{summary.short_summary}</p>
                      <span className="history-date">
                        {new Date(summary.created_at).toLocaleDateString()}
                      </span>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>
        )}

        <style jsx>{`
          .youtube-notes-page {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 20px;
            font-family: var(--font-body);
          }

          .page-header {
            text-align: center;
            margin-bottom: 40px;
          }

          .page-header h1 {
            font-family: var(--font-heading);
            font-size: 3rem;
            color: var(--color-accent);
            margin-bottom: 10px;
            text-shadow: 3px 3px 0px var(--color-secondary);
          }

          .subtitle {
            font-size: 1.2rem;
            color: #666;
          }

          .input-section {
            padding: 30px;
          }

          label {
            display: block;
            font-weight: 600;
            margin-bottom: 10px;
            color: #333;
          }

          .url-input {
            width: 100%;
            padding: 15px;
            font-size: 1rem;
            border: 3px solid var(--color-secondary);
            border-radius: 12px;
            margin-bottom: 10px;
            font-family: monospace;
          }

          .url-input:focus {
            outline: none;
            border-color: var(--color-accent);
          }

          .url-input:disabled {
            background: #f5f5f5;
            cursor: not-allowed;
          }

          .help-text {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 20px;
          }

          .error-message {
            background: #ffebee;
            color: #c62828;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: 500;
          }

          .generate-btn {
            width: 100%;
            padding: 15px;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }

          .result-section {
            margin-top: 40px;
          }

          .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .result-header h2 {
            font-family: var(--font-heading);
            color: var(--color-accent);
            font-size: 2rem;
          }

          .action-buttons {
            display: flex;
            gap: 10px;
          }

          .view-btn, .new-btn {
            padding: 10px 20px;
          }

          .result-card {
            padding: 30px;
          }

          .result-title {
            font-family: var(--font-heading);
            font-size: 2rem;
            color: #333;
            margin-bottom: 20px;
          }

          .one-liner {
            background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
            padding: 15px 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            font-size: 1.1rem;
          }

          .summary-section,
          .topics-section,
          .bullets-section,
          .timestamps-section {
            margin-bottom: 30px;
          }

          .summary-section h4,
          .topics-section h4,
          .bullets-section h4,
          .timestamps-section h4 {
            font-family: var(--font-heading);
            font-size: 1.5rem;
            color: var(--color-accent);
            margin-bottom: 15px;
          }

          .summary-section p {
            font-size: 1.1rem;
            line-height: 1.6;
            color: #555;
          }

          .topics-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .topic-tag {
            background: var(--color-secondary);
            color: #333;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 500;
          }

          .bullets-section ul {
            list-style: none;
            padding: 0;
          }

          .bullets-section li {
            padding: 12px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-left: 4px solid var(--color-accent);
            border-radius: 8px;
            line-height: 1.6;
          }

          .timestamps-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .timestamp-item {
            display: flex;
            gap: 15px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
          }

          .timestamp-item .time {
            font-weight: 600;
            color: var(--color-accent);
            min-width: 60px;
          }

          .timestamp-item .topic {
            color: #555;
          }

          .history-section {
            margin-top: 60px;
          }

          .history-section h3 {
            font-family: var(--font-heading);
            font-size: 2rem;
            color: var(--color-accent);
            margin-bottom: 20px;
          }

          .history-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          }

          .history-card {
            padding: 20px;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .history-card:hover {
            transform: translateY(-5px);
          }

          .history-icon {
            font-size: 2rem;
            margin-bottom: 10px;
          }

          .history-card h4 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
          }

          .history-card p {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 10px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .history-date {
            font-size: 0.8rem;
            color: #999;
          }

          @media (max-width: 768px) {
            .page-header h1 {
              font-size: 2rem;
            }

            .result-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 15px;
            }

            .action-buttons {
              width: 100%;
              flex-direction: column;
            }

            .view-btn, .new-btn {
              width: 100%;
            }

            .history-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </PageLayout>
  )
}
