import React from 'react'

interface AgentTimelineProps {
  steps: {
    agent: string
    status: 'pending' | 'processing' | 'completed'
    icon: string
  }[]
}

export default function AgentTimeline({ steps }: AgentTimelineProps) {
  return (
    <div className="agent-timeline">
      {steps.map((step, index) => (
        <div key={index} className={`timeline-step status-${step.status}`}>
          <div className="step-icon">{step.icon}</div>
          <div className="step-label">{step.agent}</div>
          <div className="step-connector" />
        </div>
      ))}

      <style jsx>{`
        .agent-timeline {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          overflow-x: auto;
        }

        .timeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          position: relative;
          min-width: 100px;
        }

        .step-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-xl);
          border-radius: 50%;
          background: var(--color-card);
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-base);
        }

        .status-processing .step-icon {
          background: var(--color-accent-light);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .status-completed .step-icon {
          background: var(--color-success);
          color: white;
        }

        .step-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          text-align: center;
        }

        .status-processing .step-label {
          color: var(--color-accent);
          font-weight: var(--font-weight-semibold);
        }

        .step-connector {
          position: absolute;
          top: 24px;
          left: 100%;
          width: var(--spacing-sm);
          height: 2px;
          background: var(--color-text-muted);
          opacity: 0.3;
        }

        .timeline-step:last-child .step-connector {
          display: none;
        }

        .status-completed .step-connector {
          background: var(--color-success);
          opacity: 1;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  )
}
