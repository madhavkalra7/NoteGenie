'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import { useApp } from '@/context/AppContext'
import { resolveDoubt } from '@/agents/doubtResolverAgent'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  details?: {
    simpleExplanation?: string
    detailedExplanation?: string
    analogy?: string
    oneLiner?: string
    stepByStep?: string[]
  }
}

interface UploadedFile {
  name: string
  content: string
}

export default function DoubtSolverPage() {
  const router = useRouter()
  const { state, isReady } = useApp()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hi! I\'m DoodleBot 🤖 your study buddy! Ask me anything about your studies. I can explain concepts in multiple ways to help you understand better.\n\nYou can also upload files or select from your saved notes for context!',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [showNoteSelector, setShowNoteSelector] = useState(false)
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isReady && !state.user) {
      router.push('/auth/login')
    }
  }, [isReady, state.user, router])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Build context from selected notes and uploaded files
      let context = ''
      
      if (selectedNotes.length > 0) {
        const selectedNotesContent = state.summaries
          .filter((n: { id: string }) => selectedNotes.includes(n.id))
          .map((n: { title: string; raw_text: string }) => `Notes: ${n.title}\n${n.raw_text}`)
          .join('\n\n')
        context += selectedNotesContent
      }

      if (uploadedFiles.length > 0) {
        const filesContent = uploadedFiles
          .map(f => `File: ${f.name}\n${f.content}`)
          .join('\n\n')
        context += (context ? '\n\n' : '') + filesContent
      }

      // Add relevant concepts
      if (state.concepts.length > 0) {
        const conceptsContext = state.concepts
          .slice(0, 5)
          .map(c => `${c.term}: ${c.definition}`)
          .join('\n')
        context += (context ? '\n\n' : '') + `Relevant Concepts:\n${conceptsContext}`
      }

      const result = await resolveDoubt({
        doubt: input,
        context: context || undefined
      })

      let botMessage: Message

      // Check if it's casual chat or study doubt
      if (result.type === 'chat') {
        // Simple chat response - no details
        botMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: result.reply || 'Hey there! 👋',
          timestamp: new Date()
        }
      } else {
        // Study doubt - full details
        botMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: result.oneLiner || result.simpleExplanation || 'Here\'s what I found!',
          timestamp: new Date(),
          details: {
            simpleExplanation: result.simpleExplanation,
            detailedExplanation: result.detailedExplanation,
            analogy: result.analogy,
            oneLiner: result.oneLiner,
            stepByStep: result.stepByStep
          }
        }
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Oops! I had trouble understanding that. Could you try rephrasing your question? 🤔',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const content = await file.text()
        setUploadedFiles(prev => [...prev, { name: file.name, content }])
      } else if (file.type === 'application/pdf') {
        // For PDF, we'll just note it - actual extraction would need server-side
        setUploadedFiles(prev => [...prev, { 
          name: file.name, 
          content: `[PDF file: ${file.name} - Please use the Notes page to upload PDFs for full extraction]` 
        }])
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName))
  }

  const clearContext = () => {
    setSelectedNotes([])
    setUploadedFiles([])
  }

  if (!isReady) {
    return (
      <PageLayout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="doubt-solver-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🤖 Doubt Solver</h1>
            <p className="page-subtitle">Ask anything - I'll explain it multiple ways!</p>
          </div>
        </div>

        <div className="chat-layout">
          {/* Context Panel */}
          <div className="context-panel">
            <Card>
              <h3 className="panel-title">📚 Context Sources</h3>
              <p className="panel-subtitle">Add context for better answers</p>

              {/* File Upload */}
              <div className="upload-section">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md,.pdf"
                  multiple
                  hidden
                />
                <button 
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📎 Upload Files
                </button>
              </div>

              {/* Select Notes */}
              <div className="notes-section">
                <button 
                  className="notes-toggle-btn"
                  onClick={() => setShowNoteSelector(!showNoteSelector)}
                >
                  📝 {showNoteSelector ? 'Hide' : 'Select'} Notes ({state.summaries.length})
                </button>

                {showNoteSelector && state.summaries.length > 0 && (
                  <div className="notes-list">
                    {state.summaries.map((note: { id: string; title: string }) => (
                      <label key={note.id} className="note-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedNotes.includes(note.id)}
                          onChange={() => toggleNoteSelection(note.id)}
                        />
                        <span className="note-title">{note.title}</span>
                      </label>
                    ))}
                  </div>
                )}

                {showNoteSelector && state.summaries.length === 0 && (
                  <p className="no-notes">No saved notes yet. <a href="/notes">Add some!</a></p>
                )}
              </div>

              {/* Active Context */}
              {(selectedNotes.length > 0 || uploadedFiles.length > 0) && (
                <div className="active-context">
                  <div className="context-header">
                    <h4>Active Context:</h4>
                    <button className="clear-btn" onClick={clearContext}>Clear All</button>
                  </div>
                  
                  {selectedNotes.map(id => {
                    const note = state.summaries.find((n: { id: string }) => n.id === id) as { id: string; title: string } | undefined
                    return note ? (
                      <div key={id} className="context-tag note-tag">
                        📝 {note.title}
                        <button onClick={() => toggleNoteSelection(id)}>×</button>
                      </div>
                    ) : null
                  })}

                  {uploadedFiles.map(file => (
                    <div key={file.name} className="context-tag file-tag">
                      📄 {file.name}
                      <button onClick={() => removeFile(file.name)}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Topics from Concepts - Random from ALL notes */}
              {state.concepts.length > 0 && (
                <div className="quick-topics">
                  <h4>💡 Quick Questions:</h4>
                  <div className="topic-chips">
                    {(() => {
                      // Get random 6 concepts from all notes
                      const shuffled = [...state.concepts].sort(() => Math.random() - 0.5)
                      return shuffled.slice(0, 6).map(concept => (
                        <button
                          key={concept.id}
                          className="topic-chip"
                          onClick={() => setInput(`Explain ${concept.term}`)}
                        >
                          {concept.term}
                        </button>
                      ))
                    })()}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Chat Panel */}
          <div className="chat-panel">
            <Card>
              {/* Messages */}
              <div className="messages-container">
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`message ${message.type}`}
                  >
                    <div className="message-avatar">
                      {message.type === 'bot' ? '🤖' : '👤'}
                    </div>
                    <div className="message-content">
                      <p className="message-text">{message.content}</p>
                      
                      {/* Expanded Details */}
                      {message.details && (
                        <div className="message-actions">
                          <button 
                            className="expand-btn"
                            onClick={() => setExpandedMessage(
                              expandedMessage === message.id ? null : message.id
                            )}
                          >
                            {expandedMessage === message.id ? '📖 Hide Details' : '📖 Show More'}
                          </button>
                        </div>
                      )}

                      {message.details && expandedMessage === message.id && (
                        <div className="message-details">
                          <div className="detail-section simple">
                            <h5>🌟 Simple Explanation</h5>
                            <p>{message.details.simpleExplanation}</p>
                          </div>

                          <div className="detail-section detailed">
                            <h5>📚 Detailed Explanation</h5>
                            <p>{message.details.detailedExplanation}</p>
                          </div>

                          <div className="detail-section analogy">
                            <h5>💡 Analogy</h5>
                            <p>{message.details.analogy}</p>
                          </div>

                          {message.details.stepByStep && message.details.stepByStep.length > 0 && (
                            <div className="detail-section steps">
                              <h5>📋 Step by Step</h5>
                              <ol>
                                {message.details.stepByStep.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}

                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="message bot">
                    <div className="message-avatar">🤖</div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="input-area">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your doubt here... (e.g., What is photosynthesis?)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isLoading}
                />
                <button 
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? '⏳' : '🚀'}
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        .doubt-solver-page {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: var(--spacing-xl);
        }

        .page-title {
          font-size: var(--font-size-3xl);
          margin-bottom: var(--spacing-xs);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          color: var(--color-text-secondary);
        }

        .chat-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: var(--spacing-lg);
          height: calc(100vh - 250px);
          min-height: 500px;
        }

        .context-panel {
          height: 100%;
          overflow: hidden;
        }

        .context-panel :global(.card) {
          height: 100%;
          overflow-y: auto;
        }

        .panel-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
        }

        .panel-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-lg);
        }

        .upload-section {
          margin-bottom: var(--spacing-md);
        }

        .upload-btn,
        .notes-toggle-btn {
          width: 100%;
          padding: 12px;
          border: 2px dashed #ddd;
          border-radius: 12px;
          background: var(--color-bg-secondary);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          font-family: var(--font-body);
        }

        .upload-btn:hover,
        .notes-toggle-btn:hover {
          border-color: #667eea;
          background: #f8f9ff;
        }

        .notes-section {
          margin-bottom: var(--spacing-md);
        }

        .notes-list {
          margin-top: var(--spacing-sm);
          max-height: 150px;
          overflow-y: auto;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: var(--spacing-sm);
        }

        .note-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .note-checkbox:hover {
          background: var(--color-bg-secondary);
        }

        .note-checkbox input {
          width: 16px;
          height: 16px;
          accent-color: #667eea;
        }

        .note-title {
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .no-notes {
          font-size: 13px;
          color: var(--color-text-muted);
          text-align: center;
          padding: var(--spacing-md);
        }

        .no-notes a {
          color: #667eea;
        }

        .active-context {
          padding: var(--spacing-md);
          background: #f8f9ff;
          border-radius: 12px;
          margin-bottom: var(--spacing-md);
        }

        .context-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .context-header h4 {
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .clear-btn {
          font-size: 11px;
          color: #f5576c;
          background: none;
          border: none;
          cursor: pointer;
        }

        .context-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          margin: 4px 4px 0 0;
        }

        .context-tag button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          opacity: 0.7;
        }

        .context-tag button:hover {
          opacity: 1;
        }

        .note-tag {
          background: linear-gradient(135deg, #667eea33, #764ba233);
          color: #667eea;
        }

        .file-tag {
          background: linear-gradient(135deg, #43e97b33, #38f9d733);
          color: #2d9d4e;
        }

        .quick-topics {
          padding-top: var(--spacing-md);
          border-top: 1px solid #eee;
        }

        .quick-topics h4 {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-sm);
        }

        .topic-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .topic-chip {
          padding: 6px 12px;
          border: none;
          border-radius: 20px;
          background: linear-gradient(135deg, #f093fb33, #f5576c33);
          color: #f5576c;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-body);
        }

        .topic-chip:hover {
          transform: scale(1.05);
          background: linear-gradient(135deg, #f093fb, #f5576c);
          color: white;
        }

        .chat-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .chat-panel :global(.card) {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .message {
          display: flex;
          gap: 12px;
          max-width: 85%;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .message.bot .message-avatar {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }

        .message.user .message-avatar {
          background: linear-gradient(135deg, #43e97b, #38f9d7);
        }

        .message-content {
          background: white;
          padding: 12px 16px;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .message.bot .message-content {
          border-bottom-left-radius: 4px;
        }

        .message.user .message-content {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message-text {
          margin: 0;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .message-actions {
          margin-top: 8px;
        }

        .expand-btn {
          padding: 6px 12px;
          background: #f8f9ff;
          border: none;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-body);
        }

        .expand-btn:hover {
          background: #667eea;
          color: white;
        }

        .message-details {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-section {
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
        }

        .detail-section h5 {
          font-size: 13px;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .detail-section p,
        .detail-section ol {
          margin: 0;
          line-height: 1.6;
        }

        .detail-section ol {
          padding-left: 20px;
        }

        .detail-section.simple {
          background: linear-gradient(135deg, #f8f9ff, #f0f4ff);
        }

        .detail-section.detailed {
          background: linear-gradient(135deg, #fff8f0, #fff5e6);
        }

        .detail-section.analogy {
          background: linear-gradient(135deg, #f0fff4, #e6fff0);
        }

        .detail-section.steps {
          background: linear-gradient(135deg, #fff0f3, #ffe6eb);
        }

        .message-time {
          display: block;
          font-size: 10px;
          color: #999;
          margin-top: 8px;
        }

        .message.user .message-time {
          color: rgba(255, 255, 255, 0.7);
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #667eea;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .input-area {
          padding: var(--spacing-md);
          border-top: 1px solid #eee;
          display: flex;
          gap: 12px;
        }

        .input-area textarea {
          flex: 1;
          padding: 14px 16px;
          border: 2px solid #eee;
          border-radius: 16px;
          font-size: 15px;
          resize: none;
          height: 52px;
          font-family: var(--font-body);
          transition: border-color 0.2s;
        }

        .input-area textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .send-btn {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          border: none;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

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
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .chat-layout {
            grid-template-columns: 1fr;
            height: auto;
          }

          .context-panel {
            order: 2;
            height: auto;
          }

          .chat-panel {
            order: 1;
            height: 500px;
          }
        }
      `}</style>
    </PageLayout>
  )
}
