'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'

const DOMAIN = '@minitheater.com'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const email = username.includes('@') ? username : `${username}${DOMAIN}`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Username atau password tidak sah.')
      showToast('Login gagal. Semak username dan password.', 'error')
    } else {
      showToast('Login berjaya! Selamat datang.', 'success')
      setTimeout(() => { window.location.href = '/admin' }, 800)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: 'flex',
      background: '#f9fafb',
    }}>

      {/* Left Panel */}
      <div className="left-panel" style={{
        flex: '1',
        position: 'relative',
        background: 'linear-gradient(145deg, #1a0000 0%, #3d0000 40%, #8B0000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        overflow: 'hidden',
      }}>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />

        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '-80px', left: '-80px',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(139,0,0,0.4) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-100px',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(180,0,0,0.25) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        <div style={{
          position: 'relative', textAlign: 'center',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s ease',
        }}>
          <a href="/">
            <img src="/logo.png" alt="Unit Kebudayaan" style={{
              height: '72px', width: 'auto', objectFit: 'contain',
              display: 'block', margin: '0 auto 32px',
              filter: 'brightness(0) invert(1)', opacity: 0.95,
            }} />
          </a>

          <h1 style={{
            fontSize: '32px', fontWeight: '800', color: 'white',
            letterSpacing: '-0.5px', marginBottom: '12px', lineHeight: 1.2,
          }}>Unit Kebudayaan</h1>
          <p style={{
            fontSize: '13px', color: 'rgba(255,255,255,0.5)',
            fontWeight: '500', letterSpacing: '0.15em',
            textTransform: 'uppercase', marginBottom: '48px',
          }}>UiTM Cawangan Kelantan</p>

          <div style={{
            width: '40px', height: '2px',
            background: 'rgba(255,255,255,0.2)',
            margin: '0 auto 48px', borderRadius: '2px',
          }} />

          {[
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10s3-3 3-8h14c0 5 3 8 3 8"/><path d="M6 15s-2 2-2 5h16c0-3-2-5-2-5"/><path d="M7 15h10"/><path d="M7 10h10"/></svg>,
              label: 'Booking Management'
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
              label: 'Calendar & Availability'
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
              label: 'System Settings'
            },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
              transition: `all 0.6s ease ${0.2 + i * 0.1}s`,
            }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, border: '1px solid rgba(255,255,255,0.06)',
              }}>{item.icon}</div>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <p style={{
          position: 'absolute', bottom: '24px',
          fontSize: '11px', color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.05em',
        }}>© {new Date().getFullYear()} Sistem Tempahan Unit Kebudayaan</p>
      </div>

      {/* Right Panel */}
      <div style={{
        width: '460px', flexShrink: 0,
        background: 'white',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', position: 'relative',
        borderLeft: '1px solid #f3f4f6',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.04)',
      }} className="right-panel">

        {/* Back button */}
        <a href="/" style={{
          position: 'absolute', top: '24px', left: '24px',
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '12px', color: '#9ca3af', textDecoration: 'none',
          padding: '6px 10px', borderRadius: '6px',
          border: '1px solid #e5e7eb', transition: 'all 0.15s',
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#6b7280'
            e.currentTarget.style.borderColor = '#d1d5db'
            e.currentTarget.style.background = '#f9fafb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9ca3af'
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Kembali
        </a>

        <div style={{
          width: '100%', maxWidth: '340px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.6s ease 0.15s',
        }}>
          <div style={{ marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '999px', padding: '4px 12px',
              fontSize: '11px', fontWeight: '600', color: '#8B0000',
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626' }} />
              Admin Access
            </div>
            <h2 style={{
              fontSize: '26px', fontWeight: '800', color: '#111827',
              letterSpacing: '-0.5px', marginBottom: '6px',
            }}>Log Masuk</h2>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              Masukkan credentials untuk akses panel admin
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '20px',
              fontSize: '13px', color: '#dc2626',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Username */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '12px', fontWeight: '600',
              color: '#374151', marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Username</label>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%', background: 'white',
                  border: '1.5px solid #e5e7eb', borderRadius: '8px',
                  padding: '11px 14px 11px 38px', fontSize: '14px', outline: 'none',
                  boxSizing: 'border-box', color: '#111827',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block', fontSize: '12px', fontWeight: '600',
              color: '#374151', marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%', background: 'white',
                  border: '1.5px solid #e5e7eb', borderRadius: '8px',
                  padding: '11px 40px 11px 38px', fontSize: '14px', outline: 'none',
                  boxSizing: 'border-box', color: '#111827',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#f3f4f6' : 'linear-gradient(135deg, #8B0000, #a50000)',
              color: loading ? '#9ca3af' : 'white',
              border: 'none', borderRadius: '10px', padding: '13px',
              fontSize: '14px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(139,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(139,0,0,0.35)' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,0,0,0.25)' }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ animation: 'spin 1s linear infinite' }}>
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Logging in...
              </>
            ) : 'Log Masuk →'}
          </button>

          <p style={{
            textAlign: 'center', fontSize: '11px', color: '#9ca3af',
            marginTop: '28px', letterSpacing: '0.03em',
          }}>
            Hanya untuk kakitangan yang diberi kebenaran
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .left-panel { display: none !important; }
          .right-panel { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}