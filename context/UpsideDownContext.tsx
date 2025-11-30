'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface UpsideDownContextType {
  isUpsideDown: boolean
  isFlipping: boolean
  enterUpsideDown: () => void
  exitUpsideDown: () => void
  toggleUpsideDown: () => void
}

const UpsideDownContext = createContext<UpsideDownContextType | undefined>(undefined)

export function UpsideDownProvider({ children }: { children: ReactNode }) {
  const [isUpsideDown, setIsUpsideDown] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)

  const enterUpsideDown = useCallback(() => {
    setIsFlipping(true)
    // Play thunder sound effect
    const audio = new Audio('/sounds/Thunder_Clap_And_Rain_Sound_Effect(128k).m4a')
    audio.volume = 0.5
    audio.play().catch(() => {}) // Ignore if no audio file
    
    setTimeout(() => {
      setIsUpsideDown(true)
      setIsFlipping(false)
    }, 2500) // 2.5 second flip animation
  }, [])

  const exitUpsideDown = useCallback(() => {
    setIsFlipping(true)
    setTimeout(() => {
      setIsUpsideDown(false)
      setIsFlipping(false)
    }, 2500)
  }, [])

  const toggleUpsideDown = useCallback(() => {
    if (isUpsideDown) {
      exitUpsideDown()
    } else {
      enterUpsideDown()
    }
  }, [isUpsideDown, enterUpsideDown, exitUpsideDown])

  return (
    <UpsideDownContext.Provider
      value={{
        isUpsideDown,
        isFlipping,
        enterUpsideDown,
        exitUpsideDown,
        toggleUpsideDown,
      }}
    >
      {children}
    </UpsideDownContext.Provider>
  )
}

export function useUpsideDown() {
  const context = useContext(UpsideDownContext)
  if (context === undefined) {
    throw new Error('useUpsideDown must be used within an UpsideDownProvider')
  }
  return context
}
