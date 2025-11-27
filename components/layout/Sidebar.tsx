'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const sidebarItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard', color: '#ff6b6b', gradient: 'linear-gradient(135deg, #ff6b6b, #ffa500)' },
    { href: '/notes', icon: '✏️', label: 'Summarize Notes', color: '#4ecdc4', gradient: 'linear-gradient(135deg, #4ecdc4, #44a08d)' },
    { href: '/audio-notes', icon: '🎙️', label: 'Audio to Notes', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #6366f1)' },
    { href: '/flashcards', icon: '⚡', label: 'Flashcards & Quiz', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
    { href: '/study-plan', icon: '🎯', label: 'Study Plan', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #14b8a6)' },
    { href: '/concept-graph', icon: '🔮', label: 'Concept Graph', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
    { href: '/settings', icon: '⚙️', label: 'Settings', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #374151)' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">✨ Features</span>
      </div>
      <div className="sidebar-content">
        {sidebarItems.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
            style={{ 
              '--item-color': item.color,
              '--item-gradient': item.gradient,
              '--delay': `${index * 0.05}s`
            } as React.CSSProperties}
            onMouseEnter={() => setHoveredItem(item.href)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span className={`sidebar-icon ${hoveredItem === item.href ? 'bounce' : ''}`}>
              {item.icon}
            </span>
            <span className="sidebar-label">{item.label}</span>
            <span className="sidebar-arrow">→</span>
          </Link>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <div className="doodle-decoration">
          <span>📚</span>
          <span className="footer-text">Happy Learning!</span>
          <span>🚀</span>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 260px;
          height: calc(100vh - 73px);
          position: sticky;
          top: 73px;
          background: linear-gradient(180deg, #fefefe 0%, #f8f9fa 100%);
          border-right: 3px solid #000;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
          border-bottom: 2px dashed #ccc;
          margin: 0 var(--spacing-md);
        }

        .sidebar-title {
          font-family: var(--font-heading);
          font-size: 1.3rem;
          color: #333;
          letter-spacing: 1px;
        }

        .sidebar-content {
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          color: #333;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 500;
          font-family: var(--font-body);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          border: 2px solid transparent;
          background: white;
          animation: slideIn 0.4s ease-out backwards;
          animation-delay: var(--delay);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .sidebar-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 4px;
          height: 100%;
          background: var(--item-gradient);
          transform: scaleY(0);
          transition: transform 0.3s ease;
          border-radius: 0 4px 4px 0;
        }

        .sidebar-item:hover {
          background: #fafafa;
          border-color: var(--item-color);
          transform: translateX(6px);
          box-shadow: 4px 4px 0 var(--item-color);
        }

        .sidebar-item:hover::before {
          transform: scaleY(1);
        }

        .sidebar-item:hover .sidebar-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .sidebar-item.active {
          background: var(--item-gradient);
          color: white;
          border-color: #000;
          box-shadow: 4px 4px 0 #000;
          transform: translateX(4px);
        }

        .sidebar-item.active::before {
          display: none;
        }

        .sidebar-icon {
          font-size: 1.4rem;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .sidebar-icon.bounce {
          animation: iconBounce 0.5s ease;
        }

        @keyframes iconBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3) rotate(-10deg); }
        }

        .sidebar-label {
          font-size: 0.95rem;
          flex: 1;
          letter-spacing: 0.3px;
        }

        .sidebar-arrow {
          font-size: 1rem;
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
          font-weight: bold;
        }

        .sidebar-footer {
          padding: var(--spacing-md);
          border-top: 2px dashed #ccc;
          margin: 0 var(--spacing-md) var(--spacing-md);
        }

        .doodle-decoration {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: linear-gradient(135deg, #fff9c4, #ffecb3);
          border: 2px solid #000;
          border-radius: 12px;
          box-shadow: 3px 3px 0 #000;
        }

        .footer-text {
          font-family: var(--font-heading);
          font-size: 0.9rem;
          color: #333;
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
