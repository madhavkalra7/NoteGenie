'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import DoodleDropdown from './DoodleDropdown'

export default function Navbar() {
  const { state, isHydrated, signOut } = useApp()
  const [showLogo, setShowLogo] = useState(false)

  useEffect(() => {
    setTimeout(() => setShowLogo(true), 100)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth/login'
  }

  return (
    <nav className="doodle-navbar">
      {/* Left side - Sign In */}
      <div className="navbar-left">
        {isHydrated && state.user ? (
          <div className="user-menu">
            <span className="user-email">{state.user.email}</span>
            <button onClick={handleSignOut} className="logout-btn">
              ✌️ LOGOUT ✌️
            </button>
          </div>
        ) : isHydrated ? (
          <Link href="/auth/login">
            <span className="login-btn">✨ SIGN IN ✨</span>
          </Link>
        ) : null}
      </div>

      {/* Center - Logo */}
      <div className="navbar-center">
        <Link href="/">
          <span className={`brand-logo ${showLogo ? 'magic-write' : ''}`}>
            🪄 NOTEGENIE ✨
          </span>
        </Link>
      </div>
      
      {/* Right side - Dropdown */}
      <div className="navbar-right">
        <DoodleDropdown />
      </div>

      <style jsx>{`
        .doodle-navbar {
          padding: 16px 24px;
          background: transparent;
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar-left {
          flex: 1;
          display: flex;
          align-items: center;
        }

        .navbar-center {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .navbar-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-email {
          font-family: 'Patrick Hand', cursive;
          font-size: 1.1rem;
          color: #000;
        }

        .logout-btn {
          padding: 14px 24px;
          background: #ff69b4;
          border: 4px solid #000;
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          font-family: 'Patrick Hand', cursive;
          font-size: 1.3rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 4px 4px 0px 0px black;
          letter-spacing: 2px;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px 0px black;
          background: #fca5a5;
        }

        @media (max-width: 768px) {
          .user-email {
            display: none;
          }
        }
      `}</style>
      <style jsx global>{`
        .doodle-navbar .brand-logo {
          font-family: 'Patrick Hand', cursive !important;
          font-size: 2rem !important;
          font-weight: bold !important;
          text-decoration: none !important;
          color: #000 !important;
          padding: 14px 28px;
          background: #00ffff;
          border: 4px solid black;
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          box-shadow: 5px 5px 0px 0px black;
          letter-spacing: 3px;
          cursor: pointer;
          display: inline-block;
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.5s ease;
        }

        .doodle-navbar .brand-logo.magic-write {
          opacity: 1;
          transform: translateY(0) rotate(-2deg);
        }

        .doodle-navbar .brand-logo:hover {
          transform: translate(-3px, -3px) rotate(1deg) !important;
          box-shadow: 8px 8px 0px 0px black !important;
          background: #ff69b4 !important;
        }

        .doodle-navbar .login-btn {
          padding: 14px 28px;
          background: #ffff00;
          color: #000 !important;
          border: 4px solid #000;
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          text-decoration: none !important;
          font-family: 'Patrick Hand', cursive !important;
          font-size: 1.4rem !important;
          font-weight: bold !important;
          box-shadow: 5px 5px 0px 0px black;
          letter-spacing: 2px;
          cursor: pointer;
          display: inline-block;
          transform: rotate(-2deg);
          transition: all 0.2s;
        }

        .doodle-navbar .login-btn:hover {
          transform: translate(-2px, -2px) rotate(2deg) !important;
          box-shadow: 7px 7px 0px 0px black !important;
          background: #ff69b4 !important;
        }

        @media (max-width: 768px) {
          .doodle-navbar .brand-logo {
            font-size: 1.4rem !important;
            padding: 10px 18px;
          }
        }
      `}</style>
    </nav>
  )
}
