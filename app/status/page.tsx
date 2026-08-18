'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Booking = {
  id: string
  full_name: string
  organization: string
  event_name: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
}

export default function StatusPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Booking[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setSearched(true)
    const { data } = await supabase
      .from('bookings')
      .select('id, full_name, organization, event_name, booking_date, start_time, end_time, status')
      .ilike('full_name', `%${searchQuery}%`)
    setSearchResults(data || [])
    setLoading(false)
  }

  const statusConfig = (status: string) => {
    if (status === 'approved') return { label: 'Approved', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }
    if (status === 'rejected') return { label: 'Rejected', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
    return { label: 'Pending', bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f5f5 0%, #fef2f2 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#111827' }}>

      {/* Navbar */}
      <nav style={{
        background: 'white', borderBottom: '1px solid #f3f4f6',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <Link href="/"><img src="/logo.png" alt="Unit Kebudayaan" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{
            fontSize: '13px', color: '#8B0000', textDecoration: 'none',
            fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px',
            padding: '7px 14px', borderRadius: '8px', border: '1px solid #fecaca',
            background: '#fef2f2', transition: 'all 0.15s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Kembali
          </Link>
        </div>
      </nav>

      {/* Hero Strip */}
      <div style={{
        position: 'relative', padding: '40px 24px', textAlign: 'center', overflow: 'hidden',
        background: 'linear-gradient(145deg, #1a0000 0%, #3d0000 40%, #8B0000 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '999px', padding: '4px 14px',
            fontSize: '11px', fontWeight: '600', color: '#fecaca',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fca5a5' }} />
            Unit Kebudayaan — UiTM Cawangan Kelantan
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', marginBottom: '6px' }}>Semak Status Tempahan</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Masukkan nama penuh untuk semak status tempahan anda</p>
        </div>
      </div>

      <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Masukkan nama penuh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1, background: 'white', border: '1.5px solid #e5e7eb',
              borderRadius: '10px', padding: '12px 16px', fontSize: '14px', outline: 'none',
              boxSizing: 'border-box', color: '#111827', transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#8B0000'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <button onClick={handleSearch} disabled={loading} style={{
            background: loading ? '#f3f4f6' : 'linear-gradient(135deg, #8B0000, #a50000)',
            color: loading ? '#9ca3af' : 'white',
            border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 2px 12px rgba(139,0,0,0.2)',
          }}>{loading ? '...' : 'Cari'}</button>
        </div>

        {searched && (
          searchResults.length === 0 ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px', fontSize: '14px', color: '#dc2626', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Tiada rekod untuk &quot;<strong>{searchQuery}</strong>&quot;
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchResults.map(b => {
                const cfg = statusConfig(b.status)
                return (
                  <div key={b.id} style={{ border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.color}`, borderRadius: '10px', padding: '16px', background: cfg.bg }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>{b.full_name}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{b.organization}</p>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', background: 'white', color: cfg.color, padding: '3px 12px', borderRadius: '999px', border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {formatDate(b.booking_date)}
                      <span style={{ color: '#e5e7eb' }}>|</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {b.start_time} – {b.end_time}
                    </p>
                    <p style={{ fontSize: '13px', color: cfg.color, fontWeight: '500', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {b.status === 'approved' && (<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Tempahan telah diluluskan.</>)}
                      {b.status === 'pending' && (<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Sedang dalam semakan admin.</>)}
                      {b.status === 'rejected' && (<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Tidak diluluskan. Sila hubungi admin.</>)}
                    </p>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
      </div>
    </div>
  )
}