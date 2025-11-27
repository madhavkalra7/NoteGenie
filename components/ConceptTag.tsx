import React from 'react'
import { Concept } from '@/agents/types'

interface ConceptTagProps {
  concept: Concept
  onClick?: () => void
  showDefinition?: boolean
}

export default function ConceptTag({ concept, onClick, showDefinition = true }: ConceptTagProps) {
  const difficultyClass = `tag-${concept.difficulty}`

  return (
    <div className="concept-tag-wrapper">
      <div className={`concept-tag ${difficultyClass}`} onClick={onClick}>
        <span className="concept-term">{concept.term}</span>
        <span className="difficulty-badge">{concept.difficulty}</span>
      </div>
      {showDefinition && (
        <div className="concept-tooltip">
          <strong>{concept.term}</strong>
          <p>{concept.definition}</p>
          {concept.category && <span className="concept-category">Category: {concept.category}</span>}
        </div>
      )}

      <style jsx>{`
        .concept-tag-wrapper {
          position: relative;
          display: inline-block;
        }

        .concept-tag {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .concept-tag:hover {
          transform: scale(1.05);
        }

        .tag-easy {
          background: rgba(123, 198, 126, 0.15);
          color: var(--color-easy);
        }

        .tag-medium {
          background: rgba(255, 183, 77, 0.15);
          color: var(--color-medium);
        }

        .tag-hard {
          background: rgba(229, 115, 115, 0.15);
          color: var(--color-hard);
        }

        .concept-term {
          font-weight: var(--font-weight-semibold);
        }

        .difficulty-badge {
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          opacity: 0.7;
        }

        .concept-tooltip {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: var(--spacing-xs);
          padding: var(--spacing-md);
          background: var(--color-card);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          max-width: 300px;
          z-index: var(--z-dropdown);
          animation: slideDown 0.2s ease-out;
        }

        .concept-tag-wrapper:hover .concept-tooltip {
          display: block;
        }

        .concept-tooltip strong {
          display: block;
          color: var(--color-accent);
          margin-bottom: var(--spacing-xs);
        }

        .concept-tooltip p {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--spacing-sm);
        }

        .concept-category {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          font-style: italic;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
