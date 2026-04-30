'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'
import { useSearchParams } from 'next/navigation'
import { syncToGoogleSheet, deleteFromGoogleSheet } from '@/lib/googleSheet'

type Booking = {
  id: string
  full_name: string
  phone: string
  organization: string
  event_name: string
  booking_date: string
  start_time: string
  end_time: string
  microphone: number
  aircond: number
  pa_system: number
  lcd_projector: number
  status: string
  attachment_url?: string
  note?: string
  created_at: string
}

const statusColor = (status: string) => {
  if (status === 'approved') return { bg: 'rgba(74,222,128,0.1)', color: '#4ade80', border: 'rgba(74,222,128,0.2)' }
  if (status === 'rejected') return { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.2)' }
  return { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: 'rgba(251,191,36,0.2)' }
}

const statusLabel = (status: string) => {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return 'Pending'
}

const card = {
  background: '#161616',
  border: '1px solid #1f1f1f',
  borderRadius: '14px',
}

export default function TempahanClient({ bookings: initial }: { bookings: Booking[] }) {
  const [bookings, setBookings] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [sheetUrl, setSheetUrl] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteValues, setNoteValues] = useState<Record<string, string>>({})
  const [savingNote, setSavingNote] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchSheetUrl = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 'google_sheet_url')
        .single()
      if (data?.value) setSheetUrl(data.value)
    }
    fetchSheetUrl()
  }, [])

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      const found = bookings.find(b => b.id === id)
      if (found) {
        setExpanded(id)
        setTimeout(() => {
          const el = document.getElementById(`booking-${id}`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    }
  }, [])

  useEffect(() => {
    const notes: Record<string, string> = {}
    initial.forEach(b => { notes[b.id] = b.note ?? '' })
    setNoteValues(notes)
  }, [])

  const saveNote = async (id: string) => {
    setSavingNote(true)
    const { error } = await supabase
      .from('bookings')
      .update({ note: noteValues[id] ?? '' })
      .eq('id', id)
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, note: noteValues[id] } : b))
      setEditingNote(null)
      showToast('Note berjaya disimpan!', 'success')
    } else {
      showToast('Ralat semasa menyimpan note.', 'error')
    }
    setSavingNote(false)
  }

  const filtered = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        b.full_name.toLowerCase().includes(q) ||
        b.event_name.toLowerCase().includes(q) ||
        b.organization.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'date_asc') return new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()
      if (sortBy === 'date_desc') return new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
      return 0
    })

  const updateStatus = async (id: string, status: string) => {
    setLoading(true)
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
      const booking = bookings.find(b => b.id === id)
      if (booking) await syncToGoogleSheet({ ...booking, status })
      showToast(
        status === 'approved' ? 'Tempahan telah diluluskan!' : 'Tempahan telah ditolak.',
        status === 'approved' ? 'success' : 'error'
      )
    } else {
      showToast('Ralat! Cuba lagi.', 'error')
    }
    setLoading(false)
  }

  const deleteBooking = async (id: string) => {
    if (!confirm('Confirm nak delete tempahan ni?')) return
    setLoading(true)
    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (!error) {
      await deleteFromGoogleSheet(id)
      setBookings(prev => prev.filter(b => b.id !== id))
      setExpanded(null)
      showToast('Tempahan berjaya dipadam.', 'success')
    } else {
      showToast('Ralat semasa memadam.', 'error')
    }
    setLoading(false)
  }

  const equipment = (b: Booking) => [
    { label: 'Microphone', value: b.microphone },
    { label: 'Air-cond', value: b.aircond },
    { label: 'PA System', value: b.pa_system },
    { label: 'LCD Projector', value: b.lcd_projector },
  ].filter(e => e.value > 0)

  const formatSubmitted = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>Tempahan</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Semak dan urus semua tempahan</p>
      </div>

      {/* Filter Tabs + Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }} className="filter-action-row">
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} className="filter-tabs">
          {[
            { label: 'Semua', value: 'all' },
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              style={{
                padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                border: filter === tab.value ? '1px solid #8B0000' : '1px solid #1f1f1f',
                background: filter === tab.value ? '#8B0000' : '#161616',
                color: filter === tab.value ? 'white' : '#6b7280',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: '6px',
                background: filter === tab.value ? 'rgba(255,255,255,0.2)' : '#1f1f1f',
                color: filter === tab.value ? 'white' : '#4b5563',
                padding: '1px 6px', borderRadius: '999px', fontSize: '11px',
              }}>
                {tab.value === 'all' ? bookings.length : bookings.filter(b => b.status === tab.value).length}
              </span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }} className="action-buttons">
          {sheetUrl && (
            <a
              href={sheetUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              View Google Sheet
            </a>
          )}
          <button
            onClick={() => {
              const approved = bookings.filter(b => b.status === 'approved')
              if (approved.length === 0) { showToast('Tiada tempahan approved untuk export.', 'warning'); return }
              const headers = ['ID', 'Full Name', 'Phone', 'Organization', 'Event Name', 'Booking Date', 'Start Time', 'End Time', 'Microphone', 'Air-cond', 'PA System', 'LCD Projector', 'Status', 'Created At']
              const rows = approved.map(b => [b.id, b.full_name, b.phone, b.organization, b.event_name, b.booking_date, b.start_time, b.end_time, b.microphone, b.aircond, b.pa_system, b.lcd_projector, b.status, b.created_at])
              const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `approved-bookings-${new Date().toISOString().split('T')[0]}.csv`
              link.click()
              showToast('CSV berjaya diexport!', 'success')
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(139,0,0,0.4)', background: 'rgba(139,0,0,0.1)', color: '#f87171', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,0,0,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139,0,0,0.1)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <a
            href="/admin/tempahan/tambah"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(139,0,0,0.3)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Booking
          </a>
        </div>
      </div>

      {/* Search & Sort */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }} className="search-sort-row">
        <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Cari nama, event atau organisasi..."
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', border: '1px solid #1f1f1f', borderRadius: '8px',
              padding: '9px 14px 9px 36px', fontSize: '13px', outline: 'none',
              boxSizing: 'border-box', background: '#161616', color: '#e5e7eb', transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#8B0000'}
            onBlur={(e) => e.target.style.borderColor = '#1f1f1f'}
          />
        </div>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              border: '1px solid #1f1f1f', borderRadius: '8px', padding: '9px 32px 9px 36px',
              fontSize: '13px', outline: 'none', background: '#161616', color: '#9ca3af',
              cursor: 'pointer', fontWeight: '500', appearance: 'none', WebkitAppearance: 'none',
            }}
          >
            <option value="newest">Terbaru dahulu</option>
            <option value="oldest">Terlama dahulu</option>
            <option value="date_asc">Tarikh acara ↑</option>
            <option value="date_desc">Tarikh acara ↓</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p style={{ fontSize: '14px', color: '#4b5563' }}>Tiada tempahan</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }} className="tempahan-table">
            <thead>
              <tr className="main-row" style={{ borderBottom: '1px solid #1f1f1f' }}>
                {['', 'Event', 'Nama Pemohon', 'Organisasi', 'Tarikh', 'Masa', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking) => {
                const sc = statusColor(booking.status)
                return (
                  <React.Fragment key={booking.id}>
                    <tr
                      id={`booking-${booking.id}`}
                      className="main-row"
                      onClick={() => setExpanded(expanded === booking.id ? null : booking.id)}
                      style={{
                        borderBottom: '1px solid #1a1a1a',
                        background: expanded === booking.id ? '#1a1a1a' : 'transparent',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { if (expanded !== booking.id) e.currentTarget.style.background = '#111111' }}
                      onMouseLeave={(e) => { if (expanded !== booking.id) e.currentTarget.style.background = 'transparent' }}
                    >
                      {/* Chevron td */}
                      <td className="td-chevron" style={{ padding: '12px 8px 12px 16px', width: '24px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          style={{ transition: 'transform 0.2s ease', transform: expanded === booking.id ? 'rotate(180deg)' : 'rotate(0deg)', display: 'block' }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </td>

                      {/* Event td */}
                      <td className="td-event" style={{ padding: '12px 16px', fontSize: '13px', color: '#f87171', fontWeight: '600' }}>{booking.event_name}</td>

                      <td className="td-name" style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: 'white' }}>{booking.full_name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{booking.organization}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        {new Date(booking.booking_date).toLocaleDateString('ms-MY')}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{booking.start_time} - {booking.end_time}</td>
                      
                      {/* Status td */}
                      <td className="td-status" style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {statusLabel(booking.status)}
                        </span>
                      </td>
                    </tr>

                    {expanded === booking.id && (
                      <tr className="detail-row" key={`${booking.id}-detail`}>
                        <td colSpan={7} style={{ padding: '8px 12px 20px', background: '#111111' }}>
                          <div style={{ background: '#161616', borderRadius: '12px', border: '1px solid #1f1f1f', padding: '20px 24px', animation: 'slideDown 0.2s ease' }}>
                            {/* Top */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <div>
                                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{booking.full_name}</h3>
                                <p style={{ fontSize: '12px', color: '#4b5563' }}>Submitted on {formatSubmitted(booking.created_at)}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteBooking(booking.id) }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px', transition: 'all 0.15s' }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6M14 11v6"/>
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                  </svg>
                                </button>
                              </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #1f1f1f', margin: '16px 0' }} />

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                              {[
                                { label: 'Event Name', value: booking.event_name, highlight: true },
                                { label: 'Organization', value: booking.organization },
                                { label: 'Full Name / Phone', value: `${booking.full_name} (${booking.phone})` },
                                { label: 'Booking Date & Time', value: `${new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })} | ${booking.start_time} - ${booking.end_time}` },
                              ].map((item) => (
                                <div key={item.label}>
                                  <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                                  <p style={{ fontSize: '14px', fontWeight: '600', color: item.highlight ? '#f87171' : '#e5e7eb' }}>{item.value}</p>
                                </div>
                              ))}
                            </div>

                            {/* Equipment */}
                            {equipment(booking).length > 0 && (
                              <div style={{ marginBottom: '16px' }}>
                                <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requested Equipment:</p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {equipment(booking).map((eq) => (
                                    <span key={eq.label} style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '500', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                                      {eq.label}: {eq.value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Attached File */}
                            <div style={{ border: '1px solid #1f1f1f', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: booking.status === 'pending' ? '16px' : '0', background: '#111111' }}>
                              <div>
                                <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attached File</p>
                                <p style={{ fontSize: '13px', fontWeight: '600', color: '#9ca3af' }}>Approval Paperwork Attachment</p>
                              </div>
                              {booking.attachment_url ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <a
                                    href={booking.attachment_url} target="_blank" rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #1f2937', background: '#1a1a1a', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textDecoration: 'none' }}
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                    </svg>
                                    View
                                  </a>
                                  <a
                                    href={booking.attachment_url} download
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #1f2937', background: '#1a1a1a', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textDecoration: 'none' }}
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                      <polyline points="7 10 12 15 17 10"/>
                                      <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    Download
                                  </a>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#4b5563' }}>Tiada fail</span>
                              )}
                            </div>

                            {/* Note Section */}
                            <div style={{ marginTop: '16px', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '12px 16px', background: '#111111' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <p style={{ fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Admin Note
                                </p>
                                {editingNote !== booking.id ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingNote(booking.id) }}
                                    style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #1f2937', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                  >Edit</button>
                                ) : (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditingNote(null) }}
                                      style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #1f2937', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}
                                    >Batal</button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); saveNote(booking.id) }}
                                      disabled={savingNote}
                                      style={{ fontSize: '12px', color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontWeight: '600' }}
                                    >{savingNote ? '...' : 'Simpan'}</button>
                                  </div>
                                )}
                              </div>

                              {editingNote === booking.id ? (
                                <textarea
                                  value={noteValues[booking.id] ?? ''}
                                  onChange={(e) => setNoteValues(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Tambah note untuk tempahan ini..."
                                  rows={3}
                                  style={{
                                    width: '100%', background: '#161616', border: '1px solid #1f2937',
                                    borderRadius: '8px', padding: '10px 12px', fontSize: '13px',
                                    color: '#e5e7eb', outline: 'none', resize: 'vertical',
                                    boxSizing: 'border-box', fontFamily: 'inherit',
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                                  onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                                />
                              ) : (
                                <p style={{ fontSize: '13px', color: noteValues[booking.id] ? '#9ca3af' : '#374151', fontStyle: noteValues[booking.id] ? 'normal' : 'italic' }}>
                                  {noteValues[booking.id] || 'Tiada note. Klik Edit untuk tambah.'}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            {booking.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateStatus(booking.id, 'approved') }}
                                  disabled={loading}
                                  style={{ padding: '9px 24px', borderRadius: '8px', border: '1px solid rgba(74,222,128,0.25)', background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74,222,128,0.2)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(74,222,128,0.1)'}
                                >✓ Approve</button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateStatus(booking.id, 'rejected') }}
                                  disabled={loading}
                                  style={{ padding: '9px 24px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.1)', color: '#f87171', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.2)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                                >✗ Reject</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
        .search-sort-row {
          flex-wrap: wrap !important;
        }

        .search-sort-row > div:last-child select {
          width: 100% !important;
        }

        .search-sort-row > div:last-child {
          width: 100% !important;
        }

        .filter-action-row {
          flex-direction: column !important;
          align-items: stretch !important;
        }

        .filter-tabs {
          width: 100%;
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 8px !important;
        }

        .filter-tabs button {
          width: 100% !important;
          justify-content: center !important;
        }

        .action-buttons {
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
        }

        .action-buttons a,
        .action-buttons button {
          width: 100% !important;
          justify-content: center !important;
          text-align: center !important;
          font-size: 13px !important;
          padding: 10px 14px !important;
          box-sizing: border-box !important;
        }

        .tempahan-table thead { display: none; }
        .tempahan-table tbody tr.main-row { 
          display: block !important;
          padding: 14px 16px !important;
          border-bottom: 1px solid #1a1a1a !important;
        }
        .tempahan-table td { 
          display: none !important;
        }
        .tempahan-table td.td-chevron,
        .tempahan-table td.td-event,
        .tempahan-table td.td-status {
          display: inline-block !important;
          padding: 0 !important;
          vertical-align: middle;
        }
        .tempahan-table td.td-chevron { width: 20px; }
        .tempahan-table td.td-event { 
          width: calc(100% - 130px);
          padding-left: 8px !important;
        }
        .tempahan-table td.td-name { display: none !important; }
        .tempahan-table td.td-status { 
          float: right;
          margin-top: -2px;
        }
        .tempahan-table tr.detail-row td {
          display: block !important;
          padding: 12px 12px 20px !important;
        }
      }
      `}</style>
    </div>
  )
}