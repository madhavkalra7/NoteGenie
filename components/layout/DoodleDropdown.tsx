'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DoodleDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { href: '/', label: '🏠 HOME' },
    { href: '/dashboard', label: '📊 DASHBOARD' },
    { href: '/notes', label: '📝 NOTES' },
    { href: '/audio-notes', label: '🎤 AUDIO NOTES' },
    { href: '/flashcards', label: '🔖 FLASHCARDS' },
    { href: '/concept-graph', label: '🧠 MIND MAP' },
    { href: '/study-plan', label: '📅 STUDY PLAN' },
    { href: '/settings', label: '⚙️ SETTINGS' },
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
        <div className="dropdown-menu">
          <ul className="menu-list">
            {links.map((link, index) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setIsOpen(false)}>
                  <span 
                    className={`menu-link ${pathname === link.href ? 'active' : ''}`}
                    style={{ transform: index % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)' }}
                  >
                    {link.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .doodle-dropdown-container {
          position: relative;
          z-index: 50;
        }

        .hamburger-btn {
          background: white;
          border: 3px solid black;
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 5px;
          box-shadow: 4px 4px 0px 0px black;
          transition: all 0.2s ease;
          width: 50px;
          height: 50px;
          align-items: center;
          justify-content: center;
        }

        .hamburger-btn:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px 0px black;
          background: #ffff00;
        }

        .hamburger-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px 0px black;
        }

        .line {
          width: 26px;
          height: 4px;
          background: black;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .hamburger-btn.open .line-1 {
          transform: translateY(9px) rotate(45deg);
        }
        .hamburger-btn.open .line-2 {
          opacity: 0;
        }
        .hamburger-btn.open .line-3 {
          transform: translateY(-9px) rotate(-45deg);
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 12px;
          background: #fffef0;
          border: 4px solid black;
          border-radius: 15px;
          box-shadow: 8px 8px 0px 0px black;
          min-width: 280px;
          padding: 12px;
          animation: slideDown 0.3s ease-out;
        }

        .menu-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <style jsx global>{`
        .doodle-dropdown-container .menu-link {
          display: block;
          padding: 16px 20px;
          font-family: 'Patrick Hand', cursive !important;
          font-size: 1.4rem !important;
          color: black !important;
          text-decoration: none !important;
          background: white;
          border: 3px solid black;
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          box-shadow: 4px 4px 0px 0px black;
          transition: all 0.2s ease;
          font-weight: bold;
          letter-spacing: 2px;
          cursor: pointer;
        }

        .doodle-dropdown-container .menu-link:hover {
          background: #ffff00 !important;
          transform: translate(-3px, -3px) rotate(2deg) !important;
          box-shadow: 7px 7px 0px 0px black !important;
        }

        .doodle-dropdown-container .menu-link.active {
          background: #00ffff !important;
        }
      `}</style>
    </div>
  )
}
