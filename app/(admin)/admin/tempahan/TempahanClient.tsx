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
  created_at: string
}

const statusColor = (status: string) => {
  if (status === 'approved') return { bg: '#f0fdf4', color: '#16a34a' }
  if (status === 'rejected') return { bg: '#fef2f2', color: '#dc2626' }
  return { bg: '#fffbeb', color: '#d97706' }
}

const statusLabel = (status: string) => {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return 'Pending'
}

export default function TempahanClient({ bookings: initial }: { bookings: Booking[] }) {
  const [bookings, setBookings] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [sheetUrl, setSheetUrl] = useState<string | null>(null)

  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchSheetUrl = async () => {
      const { data } = await supabase
        .from('settings')
        .select('*, attachment_url')
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
          // Scroll to row
          setTimeout(() => {
            const el = document.getElementById(`booking-${id}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      }
    }, [])
  
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
      
      // Sync to Google Sheet
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
      await deleteFromGoogleSheet(id)  // ← tambah ni
      setBookings(prev => [...prev.filter(b => b.id !== id)])
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

  const formatSubmitted = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>Tempahan</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Semak dan urus semua tempahan</p>
      </div>

      {/* Filter Tabs + Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                padding: '7px 16px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                borderColor: filter === tab.value ? '#8B0000' : '#e5e7eb',
                background: filter === tab.value ? '#8B0000' : 'white',
                color: filter === tab.value ? 'white' : '#6b7280',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: '6px',
                background: filter === tab.value ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                color: filter === tab.value ? 'white' : '#6b7280',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '11px',
              }}>
                {tab.value === 'all' ? bookings.length : bookings.filter(b => b.status === tab.value).length}
              </span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: '#16a34a',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              View Google Sheet
            </a>
          )}
          <button
            onClick={() => {
              const approved = bookings.filter(b => b.status === 'approved')
              if (approved.length === 0) {
                showToast('Tiada tempahan approved untuk export.', 'warning')
                return
              }
              const headers = ['ID', 'Full Name', 'Phone', 'Organization', 'Event Name', 'Booking Date', 'Start Time', 'End Time', 'Microphone', 'Air-cond', 'PA System', 'LCD Projector', 'Status', 'Created At']
              const rows = approved.map(b => [
                b.id, b.full_name, b.phone, b.organization, b.event_name,
                b.booking_date, b.start_time, b.end_time,
                b.microphone, b.aircond, b.pa_system, b.lcd_projector,
                b.status, b.created_at
              ])
              const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `approved-bookings-${new Date().toISOString().split('T')[0]}.csv`
              link.click()
              showToast('CSV berjaya diexport!', 'success')
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: '1px solid #8B0000',
              background: 'white',
              color: '#8B0000',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Approved (CSV)
          </button>
          <a
            href="/admin/tempahan/tambah"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #8B0000, #a50000)',
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.15s',
              boxShadow: '0 2px 8px rgba(139,0,0,0.2)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Booking
          </a>
        </div>
      </div>

      {/* Search & Sort */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        alignItems: 'center',
        width: '100%',
      }}>
        {/* Search */}
        <div style={{
          flex: 1,
          position: 'relative',
          minWidth: '200px',
        }}>
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Cari nama, event atau organisasi..."
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              padding: '9px 14px 9px 36px',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
              background: '#f9fafb',
              color: '#111827',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#8B0000'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Sort */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="15" y2="12"/>
            <line x1="3" y1="18" x2="9" y2="18"/>
          </svg>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              border: '1.5px solid #e5e7eb',
              borderRadius: '8px',
              padding: '9px 32px 9px 36px',
              fontSize: '13px',
              outline: 'none',
              background: '#f9fafb',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: '500',
              appearance: 'none',
              WebkitAppearance: 'none',
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
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #f3f4f6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p style={{ fontSize: '14px' }}>Tiada tempahan</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                {['', 'Event', 'Nama Pemohon', 'Organisasi', 'Tarikh', 'Masa', 'Status'].map((h) => (
                  <th key={h} style={{
                    padding: '11px 16px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking) => (
                <React.Fragment key={booking.id}>
                  {/* Main Row */}
                  <tr
                    id={`booking-${booking.id}`}
                    key={booking.id}
                    onClick={() => setExpanded(expanded === booking.id ? null : booking.id)}
                    style={{
                      borderBottom: '1px solid #f5f5f5',
                      background: expanded === booking.id ? '#f5f5f5' : '#F9FAFB',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (expanded !== booking.id)
                        e.currentTarget.style.background = '#f0f0f0'
                    }}
                    onMouseLeave={(e) => {
                      if (expanded !== booking.id)
                        e.currentTarget.style.background = '#F9FAFB'
                    }}
                  >
                    {/* Chevron */}
                    <td style={{ padding: '12px 8px 12px 16px', width: '24px' }}>
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{
                          transition: 'transform 0.2s ease',
                          transform: expanded === booking.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          display: 'block',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#8B0000', fontWeight: '600' }}>
                      {booking.event_name}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                      {booking.full_name}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {booking.organization}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {new Date(booking.booking_date).toLocaleDateString('ms-MY')}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {booking.start_time} - {booking.end_time}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: '600',
                        ...statusColor(booking.status),
                      }}>
                        {statusLabel(booking.status)}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {expanded === booking.id && (
                    <tr key={`${booking.id}-detail`}>
                      <td colSpan={7} style={{ padding: '0 16px 16px', background: '#f5f5f5' }}>
                        <div style={{
                          background: 'white',
                          borderRadius: '12px',
                          border: '1px solid #f5f5f5',
                          padding: '20px 24px',
                          animation: 'slideDown 0.2s ease',
                        }}>
                          {/* Top — nama + status + delete */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <div>
                              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                                {booking.full_name}
                              </h3>
                              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                                Submitted on {formatSubmitted(booking.created_at)}
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: '700',
                                background: booking.status === 'approved' ? '#16a34a' : booking.status === 'rejected' ? '#6b7280' : '#f59e0b',
                                color: 'white',
                              }}>
                                {statusLabel(booking.status)}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteBooking(booking.id) }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#9ca3af',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '4px',
                                  borderRadius: '6px',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
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

                          <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '16px 0' }} />

                          {/* Details Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                            <div>
                              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Name</p>
                              <p style={{ fontSize: '14px', fontWeight: '600', color: '#8B0000' }}>{booking.event_name}</p>
                            </div>
                            <div>
                              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization</p>
                              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{booking.organization}</p>
                            </div>
                            <div>
                              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name / Phone</p>
                              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{booking.full_name} ({booking.phone})</p>
                            </div>
                            <div>
                              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Date & Time</p>
                              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                                {new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })} | {booking.start_time} - {booking.end_time}
                              </p>
                            </div>
                          </div>

                          {/* Equipment */}
                          {equipment(booking).length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requested Equipment:</p>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {equipment(booking).map((eq) => (
                                  <span key={eq.label} style={{
                                    padding: '4px 12px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    border: '1px solid #dbeafe',
                                  }}>
                                    {eq.label}: {eq.value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Attached File */}
                          <div style={{
                            border: '1px solid #f3f4f6',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: booking.status === 'pending' ? '16px' : '0',
                          }}>
                            <div>
                              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attached File</p>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>Approval Paperwork Attachment</p>
                            </div>

                            {booking.attachment_url ? (
                              <a
                                href={booking.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                  background: 'white',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#374151',
                                  cursor: 'pointer',
                                  textDecoration: 'none',
                                }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                  <polyline points="7 10 12 15 17 10"/>
                                  <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                Download
                              </a>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Tiada fail</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {booking.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); updateStatus(booking.id, 'approved') }}
                                disabled={loading}
                                style={{
                                  padding: '9px 24px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: '#16a34a',
                                  color: 'white',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                }}
                              >✓ Approve</button>
                              <button
                                onClick={(e) => { e.stopPropagation(); updateStatus(booking.id, 'rejected') }}
                                disabled={loading}
                                style={{
                                  padding: '9px 24px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: '#dc2626',
                                  color: 'white',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                }}
                              >✗ Reject</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}