'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSidebar } from '@/components/SidebarContext'
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

export default function HeaderClient({ userName, role }: { userName: string; role: string }) {
  const { collapsed, setCollapsed } = useSidebar()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

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

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchNotifications])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
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
    setDropdownOpen(false)
  }

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read) markOneRead(notif.id)
    if (notif.booking_id) {
      window.location.href = `/admin/tempahan?id=${notif.booking_id}`
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
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

  const initial = userName.charAt(0).toUpperCase()

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #f3f4f6',
      padding: '0 28px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#6b7280', padding: '8px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#8B0000' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {collapsed
            ? <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
          }
        </svg>
      </button>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Notification Bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={handleBellClick}
            style={{
              position: 'relative',
              background: bellOpen ? '#fef2f2' : 'none',
              border: 'none', cursor: 'pointer',
              color: bellOpen ? '#8B0000' : '#9ca3af',
              padding: '8px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#8B0000' }}
            onMouseLeave={(e) => {
              if (!bellOpen) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af' }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                minWidth: '16px', height: '16px', borderRadius: '999px',
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

          {/* Notification Dropdown */}
          {bellOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: 'white', border: '1px solid #f3f4f6',
              borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              width: '340px', overflow: 'hidden',
              animation: 'dropdownFade 0.15s ease',
              zIndex: 100,
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
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    Tandakan semua dibaca
                  </button>
                )}
              </div>

              {/* List */}
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '8px', color: '#d1d5db', display: 'flex', justifyContent: 'center' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
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
                          transition: 'background 0.15s',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = notif.read ? 'white' : '#fdfcfc' }}
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
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
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

        {/* User Avatar + Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setBellOpen(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '5px 10px 5px 5px', borderRadius: '999px',
              background: dropdownOpen ? '#fef2f2' : '#f9fafb',
              border: `1px solid ${dropdownOpen ? '#fecaca' : '#f3f4f6'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca' }}
            onMouseLeave={(e) => {
              if (!dropdownOpen) {
                e.currentTarget.style.background = '#f9fafb'
                e.currentTarget.style.borderColor = '#f3f4f6'
              }
            }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B0000, #a50000)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', color: 'white', fontWeight: '700', flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', lineHeight: 1, margin: 0 }}>{userName}</p>
              <p style={{ fontSize: '10px', color: '#9ca3af', lineHeight: 1, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{role}</p>
            </div>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"
              style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: 'white', border: '1px solid #f3f4f6',
              borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              minWidth: '200px', overflow: 'hidden',
              animation: 'dropdownFade 0.15s ease',
              zIndex: 100,
            }}>
              {/* User info header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B0000, #a50000)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', color: 'white', fontWeight: '700', flexShrink: 0,
                  }}>{initial}</div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827', margin: 0 }}>{userName}</p>
                    <span style={{
                      background: '#fef2f2', color: '#8B0000',
                      padding: '1px 7px', borderRadius: '999px',
                      fontSize: '10px', fontWeight: '700',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      border: '1px solid #fecaca', display: 'inline-block', marginTop: '3px',
                    }}>{role}</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '6px' }}>
                {/* Profile — redirect ke settings tab admin */}
                <a
                  href="/admin/profile"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '8px',
                    fontSize: '13px', color: '#374151', textDecoration: 'none',
                    fontWeight: '500', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                >
                  <span style={{ color: '#9ca3af' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  Profile
                </a>

                <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }} />

                {/* Log Keluar */}
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '8px', width: '100%',
                    fontSize: '13px', color: '#dc2626', background: 'none',
                    border: 'none', cursor: 'pointer', fontWeight: '500',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Log Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  )
}