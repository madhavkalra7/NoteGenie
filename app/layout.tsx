import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NoteGenie – Multi-Agent AI Study Companion',
  description: 'Transform your notes into summaries, flashcards, quizzes, and personalized study plans with AI-powered learning agents.',
  keywords: ['study', 'AI', 'notes', 'flashcards', 'quiz', 'learning', 'education'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
