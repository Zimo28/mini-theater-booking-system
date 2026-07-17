'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const IDLE_LIMIT_MS = 10 * 60 * 1000 // 10 minit tanpa aktiviti sebelum warning muncul
const WARNING_DURATION_MS = 30 * 1000 // 30 saat countdown sebelum betul-betul logout
const CHECK_INTERVAL_MS = 1000 // check setiap 1 saat

export default function IdleTimeout() {
  const router = useRouter()
  const lastActivityRef = useRef<number>(Date.now())
  const warningStartRef = useRef<number | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(WARNING_DURATION_MS / 1000)

  const doLogout = useCallback(async () => {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
    await supabase.auth.signOut()
    sessionStorage.setItem('session_expired', '1')
    router.push('/login')
  }, [router])

  const handleStayLoggedIn = () => {
    lastActivityRef.current = Date.now()
    warningStartRef.current = null
    setShowWarning(false)
  }

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']

    const handleActivity = () => {
      // Bila warning tengah muncul, activity biasa TAK auto-dismiss —
      // user kena klik butang secara explicit.
      if (warningStartRef.current === null) {
        lastActivityRef.current = Date.now()
      }
    }

    // Check berdasarkan timestamp sebenar (Date.now()), bukan kira tick —
    // supaya tetap tepat walaupun tab throttled di background.
    const checkIdle = () => {
      const now = Date.now()

      if (warningStartRef.current !== null) {
        // Sedang dalam mod warning — kira baki countdown
        const elapsed = now - warningStartRef.current
        const remaining = Math.max(0, Math.ceil((WARNING_DURATION_MS - elapsed) / 1000))
        setSecondsLeft(remaining)
        if (elapsed >= WARNING_DURATION_MS) {
          doLogout()
        }
        return
      }

      const idleFor = now - lastActivityRef.current
      if (idleFor >= IDLE_LIMIT_MS) {
        warningStartRef.current = now
        setSecondsLeft(WARNING_DURATION_MS / 1000)
        setShowWarning(true)
      }
    }

    const handleVisibilityChange = () => {
      // Bila user balik ke tab ni, terus re-check serta-merta
      // (elak "tunggu" sampai interval seterusnya)
      if (document.visibilityState === 'visible') checkIdle()
    }

    events.forEach(event => window.addEventListener(event, handleActivity))
    document.addEventListener('visibilitychange', handleVisibilityChange)

    checkIntervalRef.current = setInterval(checkIdle, CHECK_INTERVAL_MS)

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
      events.forEach(event => window.removeEventListener(event, handleActivity))
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!showWarning) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(17,24,39,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'white', borderRadius: '16px', padding: '28px',
          maxWidth: '360px', width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: '#fef2f2', border: '1px solid #fecaca',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          Sesi anda akan tamat
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
          Anda tidak aktif buat seketika. Sesi akan log keluar automatik dalam
        </p>
        <p style={{ fontSize: '28px', fontWeight: '800', color: '#8B0000', margin: '8px 0 10px' }}>
          {secondsLeft}s
        </p>

        {/* Progress bar countdown */}
        <div style={{
          width: '100%', height: '6px', borderRadius: '999px',
          background: '#f3f4f6', overflow: 'hidden', marginBottom: '20px',
        }}>
          <div style={{
            height: '100%', borderRadius: '999px',
            background: secondsLeft <= 10 ? '#dc2626' : '#8B0000',
            width: `${(secondsLeft / (WARNING_DURATION_MS / 1000)) * 100}%`,
            transition: 'width 1s linear, background 0.3s ease',
          }} />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={doLogout}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              border: '1px solid #e5e7eb', background: 'white',
              color: '#6b7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            Log Keluar
          </button>
          <button
            onClick={handleStayLoggedIn}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              border: 'none', background: 'linear-gradient(135deg, #8B0000, #a50000)',
              color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(139,0,0,0.25)',
            }}
          >
            Saya Masih Di Sini
          </button>
        </div>
      </div>
    </div>
  )
}