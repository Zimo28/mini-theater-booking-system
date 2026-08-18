'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  booking_id: string | null
  read: boolean
  created_at: string
}

export default function MobileNav({ userName }: { userName: string }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const bellRef = useRef<HTMLDivElement>(null)

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

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications-mobile')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchNotifications])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markOneRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => {
      const removed = prev.find(n => n.id === id)
      if (removed && !removed.read) setUnreadCount(c => Math.max(0, c - 1))
      return prev.filter(n => n.id !== id)
    })
  }

  const handleBellClick = () => {
    setBellOpen(o => !o)
    setMenuOpen(false)
  }

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read) markOneRead(notif.id)
    if (notif.booking_id) {
      window.location.href = `/admin/bookings?id=${notif.booking_id}`
    }
  }

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Baru sahaja'
    if (mins < 60) return `${mins}m lepas`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}j lepas`
    const days = Math.floor(hrs / 24)
    return `${days}h lepas`
  }

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'new_booking':
        return { bg: '#eff6ff', color: '#2563eb', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
      case 'approved':
        return { bg: '#f0fdf4', color: '#16a34a', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
      case 'rejected':
        return { bg: '#fef2f2', color: '#dc2626', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> }
      case 'blackout':
        return { bg: '#fffbeb', color: '#d97706', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
      default:
        return { bg: '#f3f4f6', color: '#6b7280', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> }
    }
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: (
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Top bar */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #f3f4f6',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hamburger */}
          <button
            onClick={() => { setMenuOpen(!menuOpen); setBellOpen(false) }}
            style={{
              background: menuOpen ? '#fef2f2' : 'none',
              border: menuOpen ? '1px solid #fecaca' : '1px solid transparent',
              cursor: 'pointer',
              color: menuOpen ? '#8B0000' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px',
              transition: 'all 0.15s',
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
          <Link href="/admin">
            <img
              src="/logo.png"
              alt="Unit Kebudayaan"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            />
          </Link>
        </div>

        {/* Right side: Bell + User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Notification Bell */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button
              onClick={handleBellClick}
              style={{
                position: 'relative',
                background: bellOpen ? '#fef2f2' : 'none',
                border: bellOpen ? '1px solid #fecaca' : '1px solid transparent',
                cursor: 'pointer',
                color: bellOpen ? '#8B0000' : '#6b7280',
                padding: '7px',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '2px', right: '2px',
                  minWidth: '15px', height: '15px', borderRadius: '999px',
                  background: '#8B0000', color: 'white',
                  fontSize: '9px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid white',
                  padding: '0 3px',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown — constrained supaya tak overflow skrin mobile */}
            {bellOpen && (
              <div style={{
                position: 'fixed',
                right: '12px',
                left: '12px',
                top: '60px',
                background: 'white', border: '1px solid #f3f4f6',
                borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                animation: 'dropdownFade 0.15s ease',
                zIndex: 100,
                maxWidth: '400px',
                marginLeft: 'auto',
              }}>
                {/* Header */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>Notifikasi</span>
                    {unreadCount > 0 && (
                      <span style={{
                        background: '#fef2f2', color: '#8B0000', border: '1px solid #fecaca',
                        fontSize: '10px', fontWeight: '700', padding: '1px 7px', borderRadius: '999px',
                      }}>
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '12px', color: '#8B0000', fontWeight: '500',
                        padding: '2px 6px', borderRadius: '4px',
                      }}
                    >
                      Tandakan dibaca
                    </button>
                  )}
                </div>

                {/* List */}
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                      <div style={{ marginBottom: '8px', color: '#d1d5db', display: 'flex', justifyContent: 'center' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Tiada notifikasi</p>
                    </div>
                  ) : (
                    notifications.map(notif => {
                      const { bg, color, icon } = getNotifIcon(notif.type)
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotifClick(notif)}
                          style={{
                            display: 'flex', gap: '10px', padding: '12px 16px',
                            borderBottom: '1px solid #f9fafb',
                            background: notif.read ? 'white' : '#fdfcfc',
                            cursor: notif.booking_id ? 'pointer' : 'default',
                            position: 'relative',
                          }}
                        >
                          {/* Unread dot */}
                          {!notif.read && (
                            <div style={{
                              position: 'absolute', left: '6px', top: '50%',
                              transform: 'translateY(-50%)',
                              width: '5px', height: '5px', borderRadius: '50%',
                              background: '#8B0000',
                            }} />
                          )}

                          {/* Icon */}
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: bg, color, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {icon}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: '12px', fontWeight: notif.read ? '500' : '600',
                              color: '#111827', margin: '0 0 2px',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {notif.title}
                            </p>
                            <p style={{
                              fontSize: '11px', color: '#6b7280', margin: '0 0 4px',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {notif.message}
                            </p>
                            <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>
                              {formatTime(notif.created_at)}
                            </p>
                          </div>

                          {/* Delete btn */}
                          <button
                            onClick={(e) => deleteNotification(notif.id, e)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#d1d5db', padding: '2px', borderRadius: '4px',
                              flexShrink: 0, display: 'flex', alignItems: 'center',
                              alignSelf: 'flex-start', marginTop: '2px',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 10px',
            borderRadius: '999px',
            background: '#f9fafb',
            border: '1px solid #f3f4f6',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B0000, #a50000)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: 'white', fontWeight: '700', flexShrink: 0,
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>{userName}</span>
          </div>
        </div>
      </nav>

      {/* Dropdown menu */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #f3f4f6',
        padding: '8px',
        position: 'sticky',
        top: '56px',
        zIndex: 49,
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        maxHeight: menuOpen ? '400px' : '0',
        opacity: menuOpen ? 1 : 0,
        transition: 'max-height 0.3s ease, opacity 0.2s ease',
      }}>
        {/* Nav label */}
        <div style={{ padding: '6px 12px 8px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#d1d5db', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Menu
          </span>
        </div>

        {navItems.map((item) => {
          const isActive = item.href === '/admin/bookings'
            ? pathname.startsWith('/admin/bookings')
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
                color: isActive ? '#8B0000' : '#4b5563',
                background: isActive ? '#fef2f2' : 'transparent',
                borderLeft: isActive ? '3px solid #8B0000' : '3px solid transparent',
                transition: 'all 0.15s',
                textDecoration: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
                {item.label}
              </div>
              {item.badge !== null && (
                <span style={{
                  background: '#fef2f2',
                  color: '#8B0000',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  minWidth: '18px',
                  textAlign: 'center',
                  border: '1px solid #fecaca',
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* Divider */}
        <div style={{ borderTop: '1px solid #f3f4f6', margin: '6px 0' }} />

        {/* Profile */}
        <Link
          href="/admin/profile"
          onClick={() => setMenuOpen(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: '8px',
            fontSize: '13.5px', fontWeight: '400',
            color: '#4b5563', textDecoration: 'none',
            borderLeft: '3px solid transparent',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ opacity: 0.5 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          Profile
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#9ca3af',
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderLeft: '3px solid transparent',
            transition: 'all 0.15s',
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

      <style>{`
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}