'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useSidebar } from '@/components/SidebarContext'

export default function Sidebar() {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)
  const { collapsed, setCollapsed } = useSidebar()

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
    { label: 'Bookings', href: '/admin/bookings', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ), badge: pendingCount > 0 ? pendingCount : null },
    { label: 'Equipment', href: '/admin/equipment', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ), badge: null },
    { label: 'Links', href: '/admin/links', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ), badge: null },
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

  return (
    <aside style={{
      width: collapsed ? '64px' : '240px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #f3f4f6',
      flexShrink: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      transition: 'width 0.25s ease',
    }}>
      {/* Logo */}
      <Link href="/admin/dashboard" style={{ textDecoration: 'none' }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #f3f4f6',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: '80px',
          overflow: 'hidden',
        }}>
          {collapsed ? (
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '8px',
              border: '1px solid #f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              <img src="/logo.png" alt="Unit Kebudayaan" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            </div>
          ) : (
            <img src="/logo.png" alt="Unit Kebudayaan" style={{ width: '100%', maxHeight: '60px', objectFit: 'contain', display: 'block' }} />
          )}
        </div>
      </Link>

      {/* Menu label */}
      {!collapsed && (
        <div style={{ padding: '16px 16px 6px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Menu
          </span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 8px' }}>
        {navItems.map((item) => {
          const isActive = item.href === '/admin/bookings'
            ? pathname.startsWith('/admin/bookings')
            : pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                gap: '10px',
                padding: collapsed ? '10px' : '9px 12px',
                borderRadius: '8px',
                marginBottom: '2px',
                fontSize: '13.5px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#8B0000' : '#6b7280',
                background: isActive ? '#fef2f2' : 'transparent',
                borderLeft: collapsed ? 'none' : isActive ? '3px solid #8B0000' : '3px solid transparent',
                transition: 'all 0.15s',
                textDecoration: 'none',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#fef2f2'
                  e.currentTarget.style.color = '#8B0000'
                  if (!collapsed) e.currentTarget.style.borderLeft = '3px solid #fecaca'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6b7280'
                  if (!collapsed) e.currentTarget.style.borderLeft = '3px solid transparent'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <span style={{ opacity: isActive ? 1 : 0.5, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && item.label}
              </div>
              {!collapsed && item.badge !== null && (
                <span style={{ background: '#dc2626', color: 'white', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '999px', minWidth: '18px', textAlign: 'center' }}>
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge !== null && (
                <span style={{
                  position: 'absolute', top: '4px', right: '4px',
                  background: '#dc2626', color: 'white',
                  fontSize: '9px', fontWeight: '700',
                  width: '14px', height: '14px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}