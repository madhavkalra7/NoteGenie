'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { summarizeNotes } from '@/agents/summarizerAgent'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      setResult(null) // Reset previous results
    }
  }

  const handleProcess = async () => {
    if (!file) return

    setProcessing(true)
    // Simulate file reading with LONG dummy text to trigger the "Chapters" logic
    // This ensures we don't hit the "file too short" fallback
    const dummyText = `
      Content extracted from ${file.name}. 
      
      Introduction to the Subject.
      This document provides a comprehensive overview of the topic at hand. It starts by defining the core terminology and establishing the historical context. We explore the fundamental principles that govern this field of study.
      
      Key Concepts and Theories.
      The first major concept is the idea of interconnected systems. This theory suggests that no element exists in isolation. We also examine the counter-argument which proposes a more modular approach. These conflicting theories form the basis of modern debate.
      
      Practical Applications.
      Moving beyond theory, we look at how these ideas apply in the real world. Case studies show that applying the interconnected model leads to better long-term outcomes. However, the modular approach offers speed and flexibility in the short term.
      
      Advanced Techniques.
      For practitioners, mastering the advanced techniques is crucial. This involves understanding the subtle nuances of the system. We discuss the importance of continuous monitoring and feedback loops.
      
      Conclusion and Future Outlook.
      In conclusion, the field is evolving rapidly. Future developments will likely focus on hybrid models that combine the best of both worlds. It is an exciting time to be involved in this research.
    `
    
    try {
      // Call the agent (now using the hardcoded model)
      const summary = await summarizeNotes({ 
        rawText: dummyText, 
        title: file.name 
      })
      
      setResult(summary)
    } catch (error) {
      console.error(error)
      alert('Oops! Something went wrong with the doodle magic.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <main className="doodle-main">
      <Navbar />
      
      <div className="content-container">
        {/* Upload Zone */}
        {!result && (
          <div className="upload-zone animate-pop-in">
            <h2 className="instruction-text">Drop your boring docs here! 👇</h2>
            
            <div className="drop-area">
              <input 
                type="file" 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                className="file-input"
              />
              <div className="drop-placeholder">
                <span className="icon">📂</span>
                <p>{file ? file.name : "Drag & Drop PDF or Click to Upload"}</p>
              </div>
            </div>

            <div className="controls">
              <Button 
                onClick={handleProcess} 
                disabled={!file || processing}
                size="lg"
                className="magic-btn"
              >
                {processing ? 'Doodling Magic...' : '✨ Turn into Cards! ✨'}
              </Button>
            </div>
          </div>
        )}

        {/* Processing State */}
        {processing && (
          <div className="loading-container">
            <LoadingSpinner size="lg" />
            <p className="loading-text">Drawing your summary...</p>
          </div>
        )}

        {/* Results View */}
        {result && (
          <div className="results-view animate-pop-in">
            <div className="results-header">
              <h2>🎉 Here are your cards!</h2>
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }}>
                Start Over
              </Button>
            </div>

            <div className="cards-grid">
              {/* One Liner Card */}
              <Card title="The Gist" className="result-card rotate-left">
                <p className="handwritten-text big">{result.oneLiner}</p>
              </Card>

              {/* Short Summary Card */}
              <Card title="Quick Summary" className="result-card rotate-right">
                <p className="handwritten-text">{result.shortSummary}</p>
              </Card>

              {/* Detailed Bullets (Simulating Cards) */}
              {result.detailedBullets.map((bullet: string, idx: number) => (
                <Card key={idx} title={`Point #${idx + 1}`} className={`result-card ${idx % 2 === 0 ? 'rotate-left' : 'rotate-right'}`}>
                  <p className="handwritten-text">{bullet}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .doodle-main {
          min-height: 100vh;
          padding-bottom: var(--spacing-2xl);
        }

        .content-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .instruction-text {
          text-align: center;
          margin-bottom: var(--spacing-md);
          transform: rotate(-1deg);
        }

        .upload-zone {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .drop-area {
          position: relative;
          border: 3px dashed black;
          border-radius: var(--radius-rough);
          background: white;
          padding: var(--spacing-2xl);
          text-align: center;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .drop-area:hover {
          background: var(--color-bg-secondary);
          transform: scale(1.02);
        }

        .file-input {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .drop-placeholder .icon {
          font-size: 4rem;
          display: block;
          margin-bottom: var(--spacing-sm);
        }

        .drop-placeholder p {
          font-family: var(--font-heading);
          font-size: 1.5rem;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          align-items: center;
        }

        .persona-label {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .doodle-select {
          font-family: var(--font-body);
          font-size: 1rem;
          padding: 0.5rem;
          border: 2px solid black;
          border-radius: var(--radius-md);
          background: white;
          cursor: pointer;
        }

        .loading-container {
          text-align: center;
          margin-top: var(--spacing-2xl);
        }

        .loading-text {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          margin-top: var(--spacing-md);
          animation: pulse 1s infinite;
        }

        .results-view {
          width: 100%;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl);
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-xl);
        }

        .result-card {
          background: white;
        }

        .rotate-left { transform: rotate(-1deg); }
        .rotate-right { transform: rotate(1deg); }

        .handwritten-text {
          font-size: 1.2rem;
          line-height: 1.6;
        }

        .handwritten-text.big {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--color-highlight-pink);
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </main>
  )
}
