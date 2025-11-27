'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DoodleDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home 🏠' },
    { href: '/audio-notes', label: 'Audio Notes 🎤' },
    { href: '/flashcards', label: 'Flashcards 🔖' },
    { href: '/settings', label: 'Settings ⚙️' },
  ]

  return (
    <div className="doodle-dropdown-container">
      <button 
        className={`hamburger-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        <div className="line line-1"></div>
        <div className="line line-2"></div>
        <div className="line line-3"></div>
      </button>

      {isOpen && (
        <div className="dropdown-menu animate-slide-down">
          <ul className="menu-list">
            {links.map((link) => (
              <li key={link.href}>
                <Link 
                  href={link.href}
                  className={`menu-link ${pathname === link.href ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .doodle-dropdown-container {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          z-index: 50;
        }

        .hamburger-btn {
          background: white;
          border: 2px solid black;
          border-radius: var(--radius-md);
          padding: 8px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 3px 3px 0px 0px black;
          transition: all 0.2s ease;
          width: 44px;
          height: 44px;
          align-items: center;
          justify-content: center;
        }

        .hamburger-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 5px 5px 0px 0px black;
        }

        .hamburger-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px 0px black;
        }

        .line {
          width: 24px;
          height: 3px;
          background: black;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        /* Hamburger Animation */
        .hamburger-btn.open .line-1 {
          transform: translateY(7px) rotate(45deg);
        }
        .hamburger-btn.open .line-2 {
          opacity: 0;
        }
        .hamburger-btn.open .line-3 {
          transform: translateY(-7px) rotate(-45deg);
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: var(--spacing-sm);
          background: white;
          border: 2px solid black;
          border-radius: var(--radius-md);
          box-shadow: 5px 5px 0px 0px black;
          min-width: 200px;
          overflow: hidden;
          animation: slideDown 0.3s ease-out;
        }

        .menu-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .menu-link {
          display: block;
          padding: var(--spacing-md) var(--spacing-lg);
          font-family: var(--font-heading);
          font-size: 1.5rem; /* Bigger font */
          color: black;
          text-decoration: none;
          border-bottom: 2px dashed black; /* Thicker dash */
          transition: all 0.2s ease;
          transform: rotate(-1deg); /* Slight rotation for all */
        }

        .menu-list li:nth-child(even) .menu-link {
          transform: rotate(1deg); /* Alternating rotation */
        }

        .menu-list li:last-child .menu-link {
          border-bottom: none;
        }

        .menu-link:hover {
          background: var(--color-highlight-yellow);
          padding-left: var(--spacing-xl); /* Exaggerated slide */
          transform: scale(1.1) rotate(0deg);
          font-weight: bold;
        }

        .menu-link.active {
          background: var(--color-highlight-cyan);
          font-weight: bold;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
