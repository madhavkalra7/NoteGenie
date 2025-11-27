'use client'

import Link from 'next/link'
import DoodleDropdown from './DoodleDropdown'

export default function Navbar() {
  return (
    <nav className="doodle-navbar">
      <div className="navbar-content">
        <Link href="/" className="brand-logo animate-genie">
          ✨ NoteGenie
        </Link>
        <div className="scribble-decoration"></div>
      </div>
      <DoodleDropdown />

      <style jsx>{`
        .doodle-navbar {
          padding: var(--spacing-md);
          background: transparent;
          position: relative;
          z-index: 10;
        }

        .navbar-content {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .brand-logo {
          font-family: var(--font-heading);
          font-size: 3rem; /* Made bigger */
          font-weight: bold;
          text-decoration: none;
          padding: 0.5rem 1.5rem;
          transform: rotate(-2deg);
          /* Removed border/bg to emphasize the text animation */
          border: none;
          box-shadow: none;
          background: none;
        }

        .brand-logo:hover {
          transform: rotate(2deg) scale(1.1);
        }

        .scribble-decoration {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 10px;
          background-image: url("data:image/svg+xml,%3Csvg width='200' height='10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 5 Q 10 0 20 5 T 40 5 T 60 5 T 80 5 T 100 5 T 120 5 T 140 5 T 160 5 T 180 5 T 200 5' stroke='black' fill='none' stroke-width='2'/%3E%3C/svg%3E");
          background-repeat: repeat-x;
          opacity: 0.5;
        }
      `}</style>
    </nav>
  )
}
