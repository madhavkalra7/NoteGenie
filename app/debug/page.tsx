'use client'

import { useState, useEffect } from 'react'
import { supabase, db } from '@/lib/supabase'
import { useApp } from '@/context/AppContext'

export default function DebugPage() {
  const { state, isReady, addSummary } = useApp()
  const [logs, setLogs] = useState<string[]>([])
  const [testing, setTesting] = useState(false)

  const log = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  const testSupabase = async () => {
    setTesting(true)
    setLogs([])

    try {
      // Test 1: Check session
      log('Testing Supabase connection...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        log(`❌ Session error: ${sessionError.message}`)
        return
      }

      if (!session?.user) {
        log('❌ No user logged in! Please login first.')
        return
      }

      log(`✅ User logged in: ${session.user.email}`)
      log(`   User ID: ${session.user.id}`)

      // Test 2: Try to fetch summaries
      log('Fetching existing summaries...')
      const { data: summaries, error: fetchError } = await supabase
        .from('summaries')
        .select('*')
        .eq('user_id', session.user.id)

      if (fetchError) {
        log(`❌ Fetch error: ${fetchError.message}`)
        log(`   Code: ${fetchError.code}`)
        log(`   Details: ${JSON.stringify(fetchError.details)}`)
      } else {
        log(`✅ Found ${summaries?.length || 0} summaries in database`)
        if (summaries && summaries.length > 0) {
          log(`   Latest: "${summaries[0].title}"`)
        }
      }

      // Test 3: Try to insert a test summary
      log('Testing insert...')
      const testData = {
        user_id: session.user.id,
        title: 'Debug Test ' + Date.now(),
        raw_text: 'This is a test note',
        one_liner: 'Test summary',
        short_summary: 'This is a test summary for debugging',
        detailed_bullets: ['Point 1', 'Point 2'],
      }

      const { data: inserted, error: insertError } = await supabase
        .from('summaries')
        .insert(testData)
        .select()
        .single()

      if (insertError) {
        log(`❌ Insert error: ${insertError.message}`)
        log(`   Code: ${insertError.code}`)
        log(`   Hint: ${insertError.hint}`)
        log(`   Details: ${JSON.stringify(insertError.details)}`)
      } else {
        log(`✅ Insert successful! ID: ${inserted.id}`)
        
        // Clean up - delete test entry
        await supabase.from('summaries').delete().eq('id', inserted.id)
        log('✅ Cleaned up test entry')
      }

      // Test 4: Check context state
      log('')
      log('=== Context State ===')
      log(`isReady: ${isReady}`)
      log(`User in state: ${state.user?.email || 'none'}`)
      log(`Summaries in state: ${state.summaries.length}`)
      log(`Flashcards in state: ${state.flashcards.length}`)

    } catch (error: any) {
      log(`❌ Error: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  const testAddSummary = async () => {
    setTesting(true)
    log('')
    log('=== Testing addSummary from Context ===')

    try {
      const result = await addSummary({
        title: 'Context Test ' + Date.now(),
        raw_text: 'Test from context',
        one_liner: 'One liner test',
        short_summary: 'Short summary test',
        detailed_bullets: ['Bullet 1', 'Bullet 2'],
      })

      if (result) {
        log(`✅ addSummary successful! ID: ${result.id}`)
        log(`   State summaries count: ${state.summaries.length + 1}`)
      } else {
        log('❌ addSummary returned null')
      }
    } catch (error: any) {
      log(`❌ addSummary error: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>🔧 NoteGenie Debug Page</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={testSupabase}
          disabled={testing}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            cursor: testing ? 'not-allowed' : 'pointer',
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          {testing ? 'Testing...' : 'Test Supabase'}
        </button>

        <button 
          onClick={testAddSummary}
          disabled={testing || !isReady}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            cursor: (testing || !isReady) ? 'not-allowed' : 'pointer',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Test addSummary
        </button>
      </div>

      <div style={{ 
        background: '#1a1a1a', 
        color: '#0f0', 
        padding: '20px', 
        borderRadius: '10px',
        minHeight: '400px',
        whiteSpace: 'pre-wrap',
        fontSize: '14px',
        lineHeight: '1.6'
      }}>
        {logs.length === 0 ? (
          <span style={{ color: '#666' }}>Click "Test Supabase" to start debugging...</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ 
              color: log.includes('❌') ? '#f55' : log.includes('✅') ? '#0f0' : '#fff'
            }}>
              {log}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '10px' }}>
        <h3>Quick Status:</h3>
        <p>isReady: <strong>{isReady ? '✅ Yes' : '❌ No'}</strong></p>
        <p>User: <strong>{state.user?.email || '❌ Not logged in'}</strong></p>
        <p>Summaries in memory: <strong>{state.summaries.length}</strong></p>
      </div>
    </div>
  )
}
