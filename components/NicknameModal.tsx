'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import Button from '@/components/ui/Button'

export default function NicknameModal() {
  const { state } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Show modal if user is logged in but has no name
    if (state.user && !state.user.user_metadata?.name) {
      const hasSeenModal = localStorage.getItem('nickname_modal_seen')
      if (!hasSeenModal) {
        setShowModal(true)
      }
    }
  }, [state.user])

  const handleSave = async () => {
    if (!nickname.trim()) return

    setSaving(true)
    try {
      // Call API to update profile
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.user!.id,
          email: state.user!.email,
          name: nickname.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      localStorage.setItem('nickname_modal_seen', 'true')
      setShowModal(false)
      window.location.reload() // Refresh to update name everywhere
    } catch (error) {
      console.error('Error saving nickname:', error)
      alert('Failed to save nickname. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('nickname_modal_seen', 'true')
    setShowModal(false)
  }

  if (!showModal) return null

  return (
    <div className="nickname-modal-overlay">
      <div className="nickname-modal">
        <div className="modal-header">
          <h2>👋 Welcome to NoteGenie!</h2>
          <p>What should we call you?</p>
        </div>
        
        <div className="modal-body">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter your nickname..."
            className="nickname-input"
            maxLength={50}
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div className="modal-footer">
          <button onClick={handleSkip} className="skip-btn">
            Skip for now
          </button>
          <Button onClick={handleSave} disabled={!nickname.trim() || saving} loading={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .nickname-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s;
        }

        .nickname-modal {
          background: white;
          border: 4px solid #000;
          border-radius: 20px;
          box-shadow: 8px 8px 0 #000;
          padding: var(--spacing-2xl);
          max-width: 450px;
          width: 90%;
          animation: slideUp 0.3s;
        }

        .modal-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .modal-header h2 {
          font-size: var(--font-size-2xl);
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-primary);
        }

        .modal-header p {
          color: var(--color-text-secondary);
          font-size: var(--font-size-md);
        }

        .modal-body {
          margin-bottom: var(--spacing-xl);
        }

        .nickname-input {
          width: 100%;
          padding: var(--spacing-md);
          font-size: var(--font-size-md);
          border: 3px solid #000;
          border-radius: var(--radius-md);
          font-family: var(--font-body);
          transition: all 0.2s;
        }

        .nickname-input:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .modal-footer {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
        }

        .skip-btn {
          padding: var(--spacing-md) var(--spacing-lg);
          background: transparent;
          border: 2px solid #ddd;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-family: var(--font-body);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          transition: all 0.2s;
        }

        .skip-btn:hover {
          border-color: #bbb;
          background: #f5f5f5;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
