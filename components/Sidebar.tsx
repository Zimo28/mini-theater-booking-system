'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
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
    <aside style={{
      width: '240px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #1f1f1f',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      <Link href="/admin/dashboard" style={{ textDecoration: 'none' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #1f1f1f', cursor: 'pointer' }}>
          <img src="/logo.png" alt="Mini Theater" style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', display: 'block', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        </div>
      </Link>

      <div style={{ padding: '16px 16px 6px' }}>
        <span style={{ fontSize: '10px', fontWeight: '700', color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Menu
        </span>
      </div>

      <nav style={{ flex: 1, padding: '4px 8px' }}>
        {navItems.map((item) => {
          const isActive = item.href === '/admin/tempahan'
            ? pathname.startsWith('/admin/tempahan')
            : pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
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
                  e.currentTarget.style.background = 'rgba(139,0,0,0.1)'
                  e.currentTarget.style.color = '#f87171'
                  e.currentTarget.style.borderLeft = '3px solid rgba(139,0,0,0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6b7280'
                  e.currentTarget.style.borderLeft = '3px solid transparent'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
                {item.label}
              </div>
              {item.badge !== null && (
                <span style={{ background: '#dc2626', color: 'white', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '999px', minWidth: '18px', textAlign: 'center' }}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '8px', borderTop: '1px solid #1f1f1f' }}>
        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#4b5563', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,0,0,0.1)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4b5563' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log Keluar
        </button>
      </div>
    </aside>
  )
}