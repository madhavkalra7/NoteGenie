'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/ui/Card'
import { useApp } from '@/context/AppContext'
import { generateConceptGraph } from '@/agents/conceptGraphAgent'

export default function ConceptGraphPage() {
  const router = useRouter()
  const { state, isReady } = useApp()
  const [graphData, setGraphData] = useState<any>(null)

  // Redirect to login if not authenticated (only after ready)
  useEffect(() => {
    if (isReady && !state.user) {
      router.push('/auth/login')
    }
  }, [isReady, state.user, router])

  useEffect(() => {
    if (isReady && state.concepts.length > 0) {
      // Convert DbConcept to Concept format (handle null -> undefined)
      const concepts = state.concepts.map(c => ({
        ...c,
        category: c.category ?? undefined
      }))
      generateConceptGraph({ concepts })
        .then(data => setGraphData(data))
    }
  }, [state.concepts, isReady])

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

  return (
    <PageLayout>
      <div className="concept-graph-page">
        <h1 className="page-title">Concept Mind Map</h1>
        <p className="page-subtitle">Visualize relationships between concepts</p>

        {state.concepts.length > 0 ? (
          <>
            <Card>
              <h2 className="section-title">🧠 Concept Network</h2>
              <div className="graph-container">
                {graphData && (
                  <div className="graph-visualization">
                    {/* Simple Tree Visualization */}
                    <div className="concept-tree">
                      {graphData.nodes.map((node: any, idx: number) => (
                        <div key={node.id} className={`tree-node level-${node.level}`}>
                          <div className="node-circle">
                            {idx + 1}
                          </div>
                          <div className="node-label">{node.label}</div>
                          {graphData.edges.find((e: any) => e.from === node.id) && (
                            <div className="node-connector" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="graph-legend">
                      <h3>Relationships:</h3>
                      <div className="legend-items">
                        {graphData.edges.map((edge: any, idx: number) => (
                          <div key={idx} className="legend-item">
                            <span className="from-node">
                              {graphData.nodes.find((n: any) => n.id === edge.from)?.label}
                            </span>
                            <span className="relationship">{edge.relationship}</span>
                            <span className="to-node">
                              {graphData.nodes.find((n: any) => n.id === edge.to)?.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="section-title">📋 All Concepts</h2>
              <div className="concepts-list">
                {state.concepts.map((concept, idx) => (
                  <div key={concept.id} className="concept-item">
                    <div className="concept-number">{idx + 1}</div>
                    <div className="concept-details">
                      <div className="concept-term">{concept.term}</div>
                      <div className="concept-definition">{concept.definition}</div>
                      {concept.category && (
                        <div className="concept-category">Category: {concept.category}</div>
                      )}
                    </div>
                    <div className={`difficulty-tag ${concept.difficulty}`}>
                      {concept.difficulty}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <Card>
            <div className="empty-state">
              <p>No concepts extracted yet</p>
              <p>Upload and analyze notes to generate a concept map</p>
              <a href="/notes">Go to Notes →</a>
            </div>
          </Card>
        )}
      </div>

      <style jsx>{`
        .concept-graph-page {
          max-width: 1000px;
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

        .graph-container {
          padding: var(--spacing-xl);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          min-height: 400px;
        }

        .concept-tree {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-lg);
          justify-content: center;
          margin-bottom: var(--spacing-2xl);
        }

        .tree-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          animation: fadeIn 0.5s ease-out;
        }

        .node-circle {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent);
          color: white;
          border-radius: 50%;
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-xl);
          box-shadow: var(--shadow-md);
          margin-bottom: var(--spacing-sm);
        }

        .node-label {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          text-align: center;
          max-width: 120px;
        }

        .graph-legend {
          padding: var(--spacing-lg);
          background: var(--color-card);
          border-radius: var(--radius-md);
        }

        .graph-legend h3 {
          font-size: var(--font-size-base);
          margin-bottom: var(--spacing-md);
          color: var(--color-accent);
        }

        .legend-items {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-sm);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-sm);
        }

        .from-node,
        .to-node {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .relationship {
          color: var(--color-accent);
          font-style: italic;
          padding: 0 var(--spacing-xs);
        }

        .concepts-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .concept-item {
          display: flex;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .concept-item:hover {
          transform: translateX(4px);
          box-shadow: var(--shadow-sm);
        }

        .concept-number {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent);
          color: white;
          border-radius: 50%;
          font-weight: var(--font-weight-bold);
          flex-shrink: 0;
        }

        .concept-details {
          flex: 1;
        }

        .concept-term {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .concept-definition {
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--spacing-xs);
        }

        .concept-category {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          font-style: italic;
        }

        .difficulty-tag {
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          align-self: flex-start;
        }

        .difficulty-tag.easy {
          background: rgba(123, 198, 126, 0.2);
          color: var(--color-easy);
        }

        .difficulty-tag.medium {
          background: rgba(255, 183, 77, 0.2);
          color: var(--color-medium);
        }

        .difficulty-tag.hard {
          background: rgba(229, 115, 115, 0.2);
          color: var(--color-hard);
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-2xl);
          color: var(--color-text-muted);
        }

        .empty-state p {
          margin-bottom: var(--spacing-md);
        }

        .empty-state a {
          color: var(--color-accent);
          font-weight: var(--font-weight-medium);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </PageLayout>
  )
}
