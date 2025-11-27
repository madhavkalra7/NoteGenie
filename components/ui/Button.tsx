import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`doodle-btn btn-${variant} btn-${size} ${className}`}
    >
      {loading ? '⏳' : children}

      <style jsx>{`
        .doodle-btn {
          font-family: var(--font-heading);
          font-weight: bold;
          border: 2px solid black;
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 3px 3px 0px 0px black;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .doodle-btn:hover:not(:disabled) {
          transform: translate(-1px, -1px) rotate(-1deg);
          box-shadow: 5px 5px 0px 0px black;
        }

        .doodle-btn:active:not(:disabled) {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px 0px black;
        }

        .doodle-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
          background: #e0e0e0;
        }

        /* Variants */
        .btn-primary {
          background: var(--color-highlight-yellow);
          color: black;
        }

        .btn-secondary {
          background: var(--color-highlight-cyan);
          color: black;
        }

        .btn-outline {
          background: white;
          color: black;
        }

        .btn-danger {
          background: var(--color-highlight-pink);
          color: black;
        }

        /* Sizes */
        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }

        .btn-md {
          padding: 0.75rem 1.5rem;
          font-size: 1.1rem;
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1.4rem;
        }
      `}</style>
    </button>
  )
}
