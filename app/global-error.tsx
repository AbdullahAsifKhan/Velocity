'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Global error boundary — catches errors in the root layout itself.
 * This MUST be a client component and MUST render its own <html>/<body> tags.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#e5e5e5',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ maxWidth: 420, textAlign: 'center', padding: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: 16,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            marginBottom: 32,
          }}>
            <AlertTriangle style={{ width: 36, height: 36, color: '#ef4444' }} />
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, margin: '0 0 32px' }}>
            A critical error occurred. Please try refreshing the page.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', margin: '0 0 24px' }}>
              Error ID: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 12,
              background: '#3b82f6',
              color: '#fff',
              fontWeight: 500,
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
