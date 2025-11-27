import React from 'react'

export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = {
    sm: 'spinner-sm',
    md: 'spinner-md',
    lg: 'spinner-lg',
  }[size]

  return (
    <div className={`loading-container`}>
      <div className={`spinner ${sizeClass}`} />

      <style jsx>{`
        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
        }

        .spinner {
          border: 3px solid var(--color-accent-light);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-sm {
          width: 24px;
          height: 24px;
          border-width: 2px;
        }

        .spinner-md {
          width: 40px;
          height: 40px;
          border-width: 3px;
        }

        .spinner-lg {
          width: 60px;
          height: 60px;
          border-width: 4px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
