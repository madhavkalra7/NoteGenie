'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import { useApp } from '@/context/AppContext'
import { generateConceptGraph } from '@/agents/conceptGraphAgent'
import InteractiveConceptGraph from '@/components/InteractiveConceptGraph'

// Cache key for localStorage
const GRAPH_CACHE_KEY = 'notegenie_concept_graphs'

// Get cached graphs from localStorage
const getCachedGraphs = (): Record<string, any> => {
  if (typeof window === 'undefined') return {}
  try {
    const cached = localStorage.getItem(GRAPH_CACHE_KEY)
    return cached ? JSON.parse(cached) : {}
  } catch {
    return {}
  }
}

// Save graph to cache
const saveGraphToCache = (key: string, data: any) => {
  if (typeof window === 'undefined') return
  try {
    const cached = getCachedGraphs()
    cached[key] = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(GRAPH_CACHE_KEY, JSON.stringify(cached))
  } catch (e) {
    console.error('Error saving graph to cache:', e)
  }
}

// Get graph from cache
const getGraphFromCache = (key: string): any | null => {
  const cached = getCachedGraphs()
  if (cached[key]) {
    return cached[key].data
  }
  return null
}

export default function ConceptGraphPage() {
  const router = useRouter()
  const { state, isReady } = useApp()
  const [graphData, setGraphData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph')
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [showNoteSelector, setShowNoteSelector] = useState(true)
  const [cachedGraphKeys, setCachedGraphKeys] = useState<string[]>([])

  // Load cached graph keys on mount
  useEffect(() => {
    const cached = getCachedGraphs()
    setCachedGraphKeys(Object.keys(cached))
  }, [])

  // Redirect to login if not authenticated (only after ready)
  useEffect(() => {
    if (isReady && !state.user) {
      router.push('/auth/login')
    }
  }, [isReady, state.user, router])

  // Check if a note has a cached graph
  const hasCachedGraph = (noteId: string | 'all') => {
    const userId = state.user?.id || 'guest'
    const cacheKey = `${userId}_${noteId}`
    return cachedGraphKeys.includes(cacheKey)
  }

  // Generate graph when a note is selected
  const handleGenerateGraph = async (noteId: string | 'all', forceRegenerate = false) => {
    const userId = state.user?.id || 'guest'
    const cacheKey = `${userId}_${noteId}`
    
    setSelectedNoteId(noteId === 'all' ? 'all' : noteId)
    setShowNoteSelector(false)

    // Check cache first (unless forcing regeneration)
    if (!forceRegenerate) {
      const cachedData = getGraphFromCache(cacheKey)
      if (cachedData) {
        console.log('📦 Using cached graph for:', noteId)
        setGraphData(cachedData)
        return
      }
    }

    // Generate new graph
    setIsLoading(true)
    setGraphData(null)

    try {
      let conceptsToUse = state.concepts
      
      if (noteId !== 'all') {
        // Filter concepts for selected note
        conceptsToUse = state.concepts.filter(c => c.summary_id === noteId)
      }

      if (conceptsToUse.length === 0) {
        setIsLoading(false)
        return
      }

      const concepts = conceptsToUse.map(c => ({
        ...c,
        category: c.category ?? undefined
      }))
      
      console.log('🔄 Generating new graph for:', noteId)
      const data = await generateConceptGraph({ concepts })
      setGraphData(data)
      
      // Save to cache
      saveGraphToCache(cacheKey, data)
      setCachedGraphKeys(prev => [...new Set([...prev, cacheKey])])
      console.log('💾 Graph saved to cache')
    } catch (error) {
      console.error('Error generating graph:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToSelector = () => {
    setShowNoteSelector(true)
    setSelectedNoteId(null)
    setGraphData(null)
  }

  if (!isReady) {
    return (
      <PageLayout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading concepts...</p>
          <style jsx>{`
            .loading-state {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              gap: 20px;
              font-family: var(--font-body);
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

  // Get selected note title
  const getSelectedNoteTitle = () => {
    if (selectedNoteId === 'all') return 'All Notes'
    const note = state.summaries.find(s => s.id === selectedNoteId)
    return note?.title || 'Selected Note'
  }

  // Get concepts count per note
  const getConceptsCountForNote = (noteId: string) => {
    return state.concepts.filter(c => c.summary_id === noteId).length
  }

  return (
    <PageLayout>
      <div className="concept-graph-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🧠 Concept Mind Map</h1>
            <p className="page-subtitle">Interactive visualization of concept relationships</p>
          </div>
          {state.concepts.length > 0 && !showNoteSelector && (
            <div className="view-toggle">
              <button 
                className="toggle-btn back-btn"
                onClick={handleBackToSelector}
              >
                ← Back
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'graph' ? 'active' : ''}`}
                onClick={() => setViewMode('graph')}
              >
                🌐 Graph View
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                📋 List View
              </button>
            </div>
          )}
        </div>

        {/* Note Selector - Ask which note to use */}
        {showNoteSelector && state.summaries.length > 0 && (
          <Card>
            <h2 className="section-title">📚 Select Notes for Concept Graph</h2>
            <p className="section-subtitle">Choose which notes to visualize as a concept graph. Saved graphs load instantly! ⚡</p>
            
            <div className="note-selector-grid">
              {/* All Notes Option */}
              <button 
                className={`note-option all-notes ${hasCachedGraph('all') ? 'has-cache' : ''}`}
                onClick={() => handleGenerateGraph('all')}
              >
                <div className="note-option-icon">🌐</div>
                <div className="note-option-title">All Notes</div>
                <div className="note-option-count">{state.concepts.length} concepts</div>
                {hasCachedGraph('all') && <div className="cached-badge">💾 Saved</div>}
              </button>
              
              {/* Individual Notes */}
              {state.summaries.map(note => {
                const conceptCount = getConceptsCountForNote(note.id)
                const isCached = hasCachedGraph(note.id)
                return (
                  <button 
                    key={note.id}
                    className={`note-option ${conceptCount === 0 ? 'disabled' : ''} ${isCached ? 'has-cache' : ''}`}
                    onClick={() => conceptCount > 0 && handleGenerateGraph(note.id)}
                    disabled={conceptCount === 0}
                  >
                    <div className="note-option-icon">📄</div>
                    <div className="note-option-title">{note.title}</div>
                    <div className="note-option-count">
                      {conceptCount > 0 ? `${conceptCount} concepts` : 'No concepts'}
                    </div>
                    {isCached && <div className="cached-badge">💾 Saved</div>}
                  </button>
                )
              })}
            </div>
          </Card>
        )}

        {/* Graph View - Only show after selection */}
        {!showNoteSelector && state.concepts.length > 0 ? (
          <>
            <div className="selected-note-banner">
              📊 Showing graph for: <strong>{getSelectedNoteTitle()}</strong>
              <button 
                className="regenerate-btn"
                onClick={() => handleGenerateGraph(selectedNoteId || 'all', true)}
                disabled={isLoading}
              >
                🔄 Regenerate
              </button>
            </div>

            {viewMode === 'graph' && (
              <Card>
                <h2 className="section-title">🔮 Interactive Concept Network</h2>
                <p className="section-subtitle">Click and drag nodes to explore. Select a node to see its connections.</p>
                <div className="graph-container">
                  {isLoading ? (
                    <div className="loading-graph">
                      <div className="pulse-loader"></div>
                      <p>Analyzing concept relationships...</p>
                    </div>
                  ) : graphData ? (
                    <InteractiveConceptGraph 
                      nodes={graphData.nodes} 
                      edges={graphData.edges}
                    />
                  ) : graphData === null && !isLoading ? (
                    <div className="no-concepts">
                      <p>No concepts found for this note. Try selecting a different note.</p>
                      <button className="back-link" onClick={handleBackToSelector}>
                        ← Select Different Note
                      </button>
                    </div>
                  ) : (
                    <p className="error-message">Failed to generate graph. Please try again.</p>
                  )}
                </div>
              </Card>
            )}

            {viewMode === 'list' && (
              <Card>
                <h2 className="section-title">📚 All Concepts ({state.concepts.length})</h2>
                <div className="concepts-grid">
                  {state.concepts.map((concept, idx) => (
                    <div key={concept.id} className={`concept-card level-${idx % 6}`}>
                      <div className="concept-header">
                        <div className="concept-number">{idx + 1}</div>
                        <div className={`difficulty-badge ${concept.difficulty}`}>
                          {concept.difficulty}
                        </div>
                      </div>
                      <h3 className="concept-term">{concept.term}</h3>
                      <p className="concept-definition">{concept.definition}</p>
                      {concept.category && (
                        <div className="concept-category">
                          <span className="category-icon">📁</span>
                          {concept.category}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Stats Section */}
            <div className="stats-section">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{state.concepts.length}</div>
                <div className="stat-label">Total Concepts</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔗</div>
                <div className="stat-value">{graphData?.edges?.length || 0}</div>
                <div className="stat-label">Relationships</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-value">
                  {state.concepts.filter(c => c.difficulty === 'hard').length}
                </div>
                <div className="stat-label">Hard Concepts</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-value">
                  {state.concepts.filter(c => c.difficulty === 'easy').length}
                </div>
                <div className="stat-label">Easy Concepts</div>
              </div>
            </div>
          </>
        ) : (
          <Card>
            <div className="empty-state">
              <div className="empty-icon">🧩</div>
              <h3>No concepts yet</h3>
              <p>Upload and analyze notes to generate an interactive concept map</p>
              <a href="/notes" className="cta-button">📝 Go to Notes</a>
            </div>
          </Card>
        )}
      </div>

      <style jsx>{`
        .concept-graph-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-xl);
          flex-wrap: wrap;
          gap: var(--spacing-md);
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

        .view-toggle {
          display: flex;
          gap: 8px;
          padding: 4px;
          background: var(--color-bg-secondary);
          border-radius: 12px;
        }

        .toggle-btn {
          padding: 10px 20px;
          border: none;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          font-family: var(--font-body);
        }

        .toggle-btn:hover {
          background: var(--color-card);
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .toggle-btn.back-btn {
          background: var(--color-card);
          border: 2px solid var(--color-border);
        }

        .toggle-btn.back-btn:hover {
          background: var(--color-bg-secondary);
        }

        .section-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-xs);
        }

        .section-subtitle {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-lg);
        }

        /* Note Selector Grid */
        .note-selector-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
        }

        .note-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: var(--spacing-lg);
          background: var(--color-card);
          border: 2px solid var(--color-border);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: var(--font-body);
          position: relative;
        }

        .note-option:hover:not(.disabled) {
          border-color: #667eea;
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
        }

        .note-option.all-notes {
          background: linear-gradient(135deg, #667eea22 0%, #764ba222 100%);
          border-color: #667eea;
        }

        .note-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .note-option.has-cache {
          border-color: #22c55e;
          background: linear-gradient(135deg, #22c55e11 0%, #16a34a11 100%);
        }

        .note-option.has-cache:hover:not(.disabled) {
          border-color: #16a34a;
        }

        .cached-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #22c55e;
          color: white;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .note-option-icon {
          font-size: 32px;
        }

        .note-option-title {
          font-weight: 600;
          font-size: var(--font-size-base);
          text-align: center;
          color: var(--color-text-primary);
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .note-option-count {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .selected-note-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: var(--spacing-md) var(--spacing-lg);
          border-radius: 12px;
          margin-bottom: var(--spacing-lg);
          text-align: center;
          font-size: var(--font-size-base);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }

        .regenerate-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: var(--font-size-sm);
          font-weight: 600;
          transition: all 0.2s;
          font-family: var(--font-body);
        }

        .regenerate-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.3);
        }

        .regenerate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .no-concepts {
          text-align: center;
          padding: var(--spacing-2xl);
          color: var(--color-text-secondary);
        }

        .back-link {
          display: inline-block;
          margin-top: var(--spacing-md);
          color: #667eea;
          cursor: pointer;
          font-weight: 600;
          background: none;
          border: none;
          font-family: var(--font-body);
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .graph-container {
          min-height: 500px;
        }

        .loading-graph {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 20px;
        }

        .pulse-loader {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }

        .error-message {
          text-align: center;
          color: var(--color-hard);
          padding: var(--spacing-xl);
        }

        .concepts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-lg);
        }

        .concept-card {
          padding: var(--spacing-lg);
          border-radius: 16px;
          background: white;
          border: 2px solid transparent;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .concept-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .concept-card.level-0::before { background: linear-gradient(90deg, #667eea, #764ba2); }
        .concept-card.level-1::before { background: linear-gradient(90deg, #f093fb, #f5576c); }
        .concept-card.level-2::before { background: linear-gradient(90deg, #4facfe, #00f2fe); }
        .concept-card.level-3::before { background: linear-gradient(90deg, #43e97b, #38f9d7); }
        .concept-card.level-4::before { background: linear-gradient(90deg, #fa709a, #fee140); }
        .concept-card.level-5::before { background: linear-gradient(90deg, #a8edea, #fed6e3); }

        .concept-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
        }

        .concept-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .concept-number {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-secondary);
          border-radius: 50%;
          font-weight: bold;
          font-size: 14px;
        }

        .difficulty-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .difficulty-badge.easy {
          background: rgba(67, 233, 123, 0.2);
          color: #2d9d4e;
        }

        .difficulty-badge.medium {
          background: rgba(255, 183, 77, 0.2);
          color: #e6a23c;
        }

        .difficulty-badge.hard {
          background: rgba(245, 87, 108, 0.2);
          color: #f5576c;
        }

        .concept-term {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-primary);
        }

        .concept-definition {
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: var(--spacing-sm);
          font-size: var(--font-size-sm);
        }

        .concept-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--color-bg-secondary);
          border-radius: 8px;
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .stats-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-md);
          margin-top: var(--spacing-xl);
        }

        .stat-card {
          background: white;
          padding: var(--spacing-lg);
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 28px;
          margin-bottom: var(--spacing-sm);
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-top: 4px;
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-3xl);
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: var(--spacing-md);
        }

        .empty-state h3 {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-sm);
        }

        .empty-state p {
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-lg);
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }

          .view-toggle {
            width: 100%;
          }

          .toggle-btn {
            flex: 1;
          }

          .concepts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageLayout>
  )
}
