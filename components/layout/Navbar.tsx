'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { useUpsideDown } from '@/context/UpsideDownContext'
import DoodleDropdown from './DoodleDropdown'

export default function Navbar() {
  const router = useRouter()
  const { state, isHydrated, signOut } = useApp()
  const { isUpsideDown, isFlipping, toggleUpsideDown } = useUpsideDown()
  const [showLogo, setShowLogo] = useState(false)

  useEffect(() => {
    setTimeout(() => setShowLogo(true), 100)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (e) {
      console.error('Logout error:', e)
    }
    // Force full page reload to clear all state
    window.location.replace('/auth/login')
  }

  const handleUpsideDownClick = () => {
    if (isFlipping) return
    toggleUpsideDown()
    // Navigate to upside down page after flip
    setTimeout(() => {
      if (!isUpsideDown) {
        router.push('/upside-down')
      } else {
        router.push('/dashboard')
      }
    }, 2600)
  }

  return (
    <nav className={`doodle-navbar ${isUpsideDown ? 'navbar-upside-down' : ''}`}>
      {/* Left side - Sign In */}
      <div className="navbar-left">
        {state.user ? (
          <div className="user-menu">
            <span className="user-email">{state.user.email}</span>
            <button onClick={handleSignOut} className="logout-btn">
              ✌️ LOGOUT ✌️
            </button>
          </div>
        ) : (
          <Link href="/auth/login">
            <span className="login-btn">✨ SIGN IN ✨</span>
          </Link>
        )}
      </div>

      {/* Center - Logo */}
      <div className="navbar-center">
        <Link href={isUpsideDown ? '/upside-down' : '/'}>
          <span className={`brand-logo ${showLogo ? 'magic-write' : ''} ${isUpsideDown ? 'brand-upside-down' : ''}`}>
            {isUpsideDown ? '🌑 NOTEGENIE 🔥' : '🪄 NOTEGENIE ✨'}
          </span>
        </Link>
      </div>
      
      {/* Right side - Upside Down Button + Dropdown */}
      <div className="navbar-right">
        <button 
          onClick={handleUpsideDownClick}
          disabled={isFlipping}
          className={`upside-down-btn ${isUpsideDown ? 'exit-mode' : 'enter-mode'}`}
        >
          {isFlipping ? (
            <span className="flip-text">⚡ FLIPPING ⚡</span>
          ) : isUpsideDown ? (
            <>🌅 EXIT UPSIDE DOWN</>
          ) : (
            <>🌌 ENTER UPSIDE DOWN</>
          )}
        </button>
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

        /* Upside Down Button Styles */
        .upside-down-btn {
          position: relative;
          padding: 12px 20px;
          margin-right: 16px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-radius: 8px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .upside-down-btn.enter-mode {
          background: linear-gradient(135deg, #1a0a0a 0%, #2d0000 50%, #1a0a0a 100%);
          color: #ff4444;
          border: 3px solid #8b0000;
          text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000;
          box-shadow: 0 0 15px rgba(139, 0, 0, 0.5), inset 0 0 15px rgba(0, 0, 0, 0.5);
          animation: buttonPulse 2s infinite;
        }

        .upside-down-btn.exit-mode {
          background: linear-gradient(135deg, #0a1a1a 0%, #002d2d 50%, #0a1a1a 100%);
          color: #44ffff;
          border: 3px solid #008b8b;
          text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
          box-shadow: 0 0 15px rgba(0, 139, 139, 0.5), inset 0 0 15px rgba(0, 0, 0, 0.5);
        }

        @keyframes buttonPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(139, 0, 0, 0.5), inset 0 0 15px rgba(0, 0, 0, 0.5); }
          50% { box-shadow: 0 0 25px rgba(255, 0, 0, 0.8), inset 0 0 15px rgba(0, 0, 0, 0.5); }
        }

        .upside-down-btn::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 0, 0, 0.1) 50%, transparent 70%);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }

        .upside-down-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .upside-down-btn.enter-mode:hover:not(:disabled) {
          border-color: #ff0000;
          box-shadow: 0 0 30px rgba(255, 0, 0, 0.7), inset 0 0 20px rgba(139, 0, 0, 0.5);
        }

        .upside-down-btn.exit-mode:hover:not(:disabled) {
          border-color: #00ffff;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.7), inset 0 0 20px rgba(0, 139, 139, 0.5);
        }

        .upside-down-btn:disabled {
          cursor: not-allowed;
          opacity: 0.8;
        }

        .flip-text {
          animation: flipTextGlow 0.5s infinite alternate;
        }

        @keyframes flipTextGlow {
          0% { text-shadow: 0 0 5px #fff, 0 0 10px #fff; }
          100% { text-shadow: 0 0 15px #ff0, 0 0 30px #ff0; }
        }

        /* Upside Down mode navbar styles */
        .navbar-upside-down {
          background: linear-gradient(to bottom, rgba(10, 10, 15, 0.95), transparent) !important;
        }

        .navbar-upside-down .user-email {
          color: #888 !important;
        }

        .navbar-upside-down .logout-btn {
          background: #2d0000 !important;
          color: #ff4444 !important;
          border-color: #8b0000 !important;
          box-shadow: 4px 4px 0px 0px #8b0000 !important;
        }

        .brand-upside-down {
          background: linear-gradient(135deg, #1a0a0a 0%, #2d0000 100%) !important;
          color: #ff4444 !important;
          border-color: #8b0000 !important;
          box-shadow: 5px 5px 0px 0px #8b0000 !important;
          text-shadow: 0 0 10px #ff0000;
        }

        .brand-upside-down:hover {
          background: linear-gradient(135deg, #2d0000 0%, #4a0000 100%) !important;
          box-shadow: 8px 8px 0px 0px #ff0000 !important;
        }

        @media (max-width: 768px) {
          .upside-down-btn {
            padding: 8px 12px;
            font-size: 10px;
            margin-right: 8px;
          }
        }
      `}</style>
    </nav>
  )
}
