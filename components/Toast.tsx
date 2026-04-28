'use client'

import { useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'warning'

type Toast = {
  id: string
  message: string
  type: ToastType
}

let toastHandler: ((message: string, type: ToastType) => void) | null = null

export const showToast = (message: string, type: ToastType = 'success') => {
  if (toastHandler) toastHandler(message, type)
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastHandler = (message, type) => {
      const id = Math.random().toString(36).slice(2)
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3000)
    }
    return () => { toastHandler = null }
  }, [])

  const iconMap = {
    success: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    error: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    warning: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  }

  const colorMap = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a' },
    error: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706' },
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {toasts.map((toast) => {
        const c = colorMap[toast.type]
        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: c.bg,
              border: `1px solid ${c.border}`,
              color: c.color,
              fontSize: '13px',
              fontWeight: '500',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              minWidth: '260px',
              animation: 'slideInRight 0.25s ease',
            }}
          >
            {iconMap[toast.type]}
            {toast.message}
          </div>
        )
      })}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}