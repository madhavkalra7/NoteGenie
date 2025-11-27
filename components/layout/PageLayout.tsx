import React from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface PageLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export default function PageLayout({ children, showSidebar = true }: PageLayoutProps) {
  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-container">
        {showSidebar && <Sidebar />}
        <main className="page-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .page-container {
          display: flex;
          flex: 1;
        }

        .page-content {
          flex: 1;
          padding: var(--spacing-2xl) var(--spacing-lg);
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        @media (max-width: 768px) {
          .page-content {
            padding: var(--spacing-lg) var(--spacing-md);
          }
        }
      `}</style>
    </div>
  )
}
