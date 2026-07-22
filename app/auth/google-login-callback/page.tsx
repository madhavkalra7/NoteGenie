'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GoogleLoginCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        
        const accessToken = params.get('access_token')
        const error = params.get('error')
        const errorDescription = params.get('error_description')

        if (error) {
          setStatus('error')
          setErrorMessage(errorDescription || error || 'Google Authentication failed')
          return
        }

        if (!accessToken) {
          setStatus('error')
          setErrorMessage('No access token received from Google')
          return
        }

        // Post token to backend to create user & session
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken })
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          setStatus('error')
          setErrorMessage(data.error || 'Failed to authenticate with backend')
          return
        }

        setStatus('success')
        // Force full refresh or router push to reload app context state
        window.location.href = '/dashboard'
      } catch (err: any) {
        setStatus('error')
        setErrorMessage(err.message || 'An unexpected error occurred')
      }
    }

    handleGoogleCallback()
  }, [router])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      background: status === 'error' 
        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        : status === 'success'
        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '40px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>
          {status === 'error' ? '❌' : status === 'success' ? '✅' : '✨'}
        </div>
        <h1 style={{ marginBottom: '10px', fontSize: '1.8rem' }}>
          {status === 'error' ? 'Sign In Failed' : 
           status === 'success' ? 'Welcome to NoteGenie!' : 
           'Signing in with Google...'}
        </h1>
        <p style={{ opacity: 0.9, fontSize: '1rem', lineHeight: '1.5' }}>
          {status === 'error' ? errorMessage : status === 'success' ? 'Redirecting to your dashboard...' : 'Please wait while we set up your session.'}
        </p>

        {status === 'processing' && (
          <div style={{
            marginTop: '20px',
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '20px auto'
          }}></div>
        )}

        {status === 'error' && (
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: 'white',
              color: '#ef4444',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Back to Login
          </button>
        )}
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
