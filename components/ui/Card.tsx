import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  title?: string // Optional title for the "notebook" header look
}

export default function Card({ children, className = '', hover = false, title }: CardProps) {
  return (
    <div className={`doodle-card ${hover ? 'hover-effect' : ''} ${className}`}>
      {title && <div className="card-header">{title}</div>}
      <div className="card-content">
        {children}
      </div>

      <style jsx>{`
        .doodle-card {
          background: white;
          border: var(--border-width) var(--border-style) var(--border-color);
          border-radius: 2px 2px 2px 2px; /* Slightly irregular look handled by box-shadow mostly */
          box-shadow: var(--shadow-sketch);
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
        }

        /* Rough border effect using pseudo-element */
        .doodle-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border: 1px solid rgba(0,0,0,0.1);
          pointer-events: none;
          transform: rotate(0.5deg);
        }

        .hover-effect:hover {
          transform: translate(-2px, -2px);
          box-shadow: var(--shadow-hover);
        }

        .card-header {
          background: var(--color-highlight-yellow);
          border-bottom: 2px solid black;
          padding: var(--spacing-sm) var(--spacing-md);
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: bold;
          transform: rotate(-0.5deg);
          margin: -1px -1px 0 -1px; /* Overlap border */
        }

        .card-content {
          padding: var(--spacing-md);
        }
      `}</style>
    </div>
  )
}
