'use client'

import { useEffect, useState } from 'react'

export default function GoogleCalendarCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Get access token from URL hash (implicit grant flow)
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    
    const accessToken = params.get('access_token')
    const state = params.get('state')
    const error = params.get('error')
    const errorDescription = params.get('error_description')

    console.log('OAuth callback - state:', state, 'hasToken:', !!accessToken, 'error:', error)

    if (error) {
      setStatus('error')
      setMessage(errorDescription || error)
      
      // Send error to parent window if opened as popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'google_oauth_error',
          error: error,
          description: errorDescription
        }, window.location.origin)
        
        setTimeout(() => window.close(), 2000)
      }
      return
    }

    if (accessToken && state === 'calendar_sync') {
      setStatus('success')
      setMessage('Calendar connected! Adding events...')
      
      // Send token to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'google_oauth_success',
          accessToken: accessToken
        }, window.location.origin)
        
        setTimeout(() => window.close(), 1500)
      } else {
        // If not a popup, store token and redirect
        sessionStorage.setItem('google_calendar_token', accessToken)
        window.location.href = '/study-plan'
      }
    } else if (!accessToken && !error) {
      setStatus('error')
      setMessage('No access token received. Please try again.')
    }
  }, [])

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
        maxWidth: '400px'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          {status === 'error' ? '❌' : status === 'success' ? '✅' : '📅'}
        </div>
        <h1 style={{ marginBottom: '10px' }}>
          {status === 'error' ? 'Connection Failed' : 
           status === 'success' ? 'Connected!' : 
           'Connecting to Google Calendar...'}
        </h1>
        <p style={{ opacity: 0.9 }}>
          {message || 'Please wait while we sync your study plan.'}
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
        {status === 'error' && !window.opener && (
          <button
            onClick={() => window.location.href = '/study-plan'}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: 'white',
              color: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Back to Study Plan
          </button>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
