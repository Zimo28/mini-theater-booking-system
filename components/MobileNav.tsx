'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MobileNav({ userName }: { userName: string }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetchPending = async () => {
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      setPendingCount(count ?? 0)
    }
    fetchPending()
  }, [])

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ), badge: null },
    { label: 'Tempahan', href: '/admin/tempahan', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ), badge: pendingCount > 0 ? pendingCount : null },
    { label: 'QR Generator', href: '/admin/qr', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
        <rect x="3" y="16" width="5" height="5"/>
        <path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/>
        <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
        <path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/>
        <path d="M16 12h1"/><path d="M21 12v.01"/>
      </svg>
    ), badge: null },
    { label: 'Settings', href: '/admin/settings', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ), badge: null },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Top bar */}
      <nav style={{
        background: '#0a0a0a',
        borderBottom: '1px solid #1f1f1f',
        color: '#9ca3af',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4b5563',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>

          {/* Logo */}
          <img
            src="/logo.png"
            alt="Mini Theater"
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* User info — sama macam Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 10px',
          borderRadius: '999px',
          background: '#161616',
          border: '1px solid #1f1f1f',
          color: '#9ca3af',
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B0000, #a50000)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: 'white',
            fontWeight: '700',
            flexShrink: 0,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}>{userName}</span>
        </div>
      </nav>

      {/* Dropdown menu */}
      {menuOpen && (
        <div style={{
          background: '#0a0a0a',
          borderBottom: '1px solid #1f1f1f',
          padding: '8px',
          position: 'sticky',
          top: '56px',
          zIndex: 49,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        }}>
          {/* Nav label */}
          <div style={{ padding: '6px 12px 8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Menu
            </span>
          </div>

          {navItems.map((item) => {
            const isActive = item.href === '/admin/tempahan'
              ? pathname.startsWith('/admin/tempahan')
              : pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? '#f87171' : '#6b7280',
                  background: isActive ? 'rgba(139,0,0,0.2)' : 'transparent',
                  borderLeft: isActive ? '3px solid #8B0000' : '3px solid transparent',
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#fef2f2'
                    e.currentTarget.style.color = '#8B0000'
                    e.currentTarget.style.borderLeft = '3px solid #fecaca'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#4b5563'
                    e.currentTarget.style.borderLeft = '3px solid transparent'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
                  {item.label}
                </div>
                {item.badge !== null && (
                  <span style={{
                    background: 'rgba(139,0,0,0.1)',
                    color: '#f87171',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '999px',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Divider */}
          <div style={{ borderTop: '1px solid #f3f4f6', margin: '6px 0' }} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#4b5563',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderLeft: '3px solid transparent',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2'
              e.currentTarget.style.color = '#8B0000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#9ca3af'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log Keluar
          </button>
        </div>
      )}
    </>
  )
}