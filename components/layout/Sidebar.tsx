'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const sidebarItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/notes', icon: '📝', label: 'Summarize Notes' },
    { href: '/audio-notes', icon: '🎤', label: 'Audio to Notes' },
    { href: '/flashcards', icon: '🔖', label: 'Flashcards & Quiz' },
    { href: '/study-plan', icon: '📅', label: 'Study Plan' },
    { href: '/concept-graph', icon: '🧠', label: 'Concept Graph' },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .sidebar {
          width: 240px;
          height: calc(100vh - 73px);
          position: sticky;
          top: 73px;
          background: var(--color-bg-secondary);
          border-right: 1px solid rgba(0, 0, 0, 0.08);
          overflow-y: auto;
        }

        .sidebar-content {
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          color: var(--color-text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          font-weight: var(--font-weight-medium);
          transition: all var(--transition-fast);
        }

        .sidebar-item:hover {
          background: var(--color-card);
          color: var(--color-accent);
          transform: translateX(4px);
        }

        .sidebar-item.active {
          background: var(--color-accent-light);
          color: var(--color-accent);
        }

        .sidebar-icon {
          font-size: var(--font-size-xl);
        }

        .sidebar-label {
          font-size: var(--font-size-base);
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
        }
      `}</style>
    </aside>
  )
}
