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
  postponed_date?: string
  postponed_time_start?: string
  postponed_time_end?: string
  postpone_reason?: string
  created_at: string
}

const statusColor = (status: string) => {
  if (status === 'approved') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }
  if (status === 'rejected') return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
  if (status === 'postponed') return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' }
  return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
}

const statusLabel = (status: string) => {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  if (status === 'postponed') return 'Postponed'
  return 'Pending'
}

const card = {
  background: 'white',
  border: '1px solid #f3f4f6',
  borderRadius: '14px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}

export default function BookingClient({ bookings: initial }: { bookings: Booking[] }) {
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
  const [postponingId, setPostponingId] = useState<string | null>(null)
  const [postponeForm, setPostponeForm] = useState({
    date: '', start_time: '', end_time: '', reason: ''
  })
  const [savingPostpone, setSavingPostpone] = useState(false)

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

  const checkConflictForApprove = async (booking: Booking) => {
    const { data } = await supabase
      .from('bookings')
      .select('id, start_time, end_time')
      .eq('booking_date', booking.booking_date)
      .eq('status', 'approved')
      .neq('id', booking.id)

    if (!data) return false
    return data.some(b =>
      booking.start_time < b.end_time && booking.end_time > b.start_time
    )
  }

  const updateStatus = async (id: string, status: string) => {
    setLoading(true)

    const booking = bookings.find(b => b.id === id)

    if (status === 'approved' && booking) {
      const hasConflict = await checkConflictForApprove(booking)
      if (hasConflict) {
        showToast('Conflict! Ada tempahan lain yang approved pada masa yang sama.', 'error')
        setLoading(false)
        return
      }
    }

    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
      if (booking) await syncToGoogleSheet({ ...booking, status })
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'status_changed', booking: { ...booking, status } }),
      })
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
      setExpanded(null)
      setBookings(prev => prev.filter(b => b.id !== id))
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

  const savePostpone = async (id: string) => {
    if (!postponeForm.date || !postponeForm.start_time || !postponeForm.end_time) {
      showToast('Sila isi tarikh dan masa baru.', 'error')
      return
    }
    setSavingPostpone(true)
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'postponed',
        postponed_date: postponeForm.date,
        postponed_time_start: postponeForm.start_time,
        postponed_time_end: postponeForm.end_time,
        postpone_reason: postponeForm.reason,
      })
      .eq('id', id)

    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? {
        ...b, status: 'postponed',
        postponed_date: postponeForm.date,
        postponed_time_start: postponeForm.start_time,
        postponed_time_end: postponeForm.end_time,
        postpone_reason: postponeForm.reason,
      } : b))
      setPostponingId(null)
      setPostponeForm({ date: '', start_time: '', end_time: '', reason: '' })
      showToast('Program berjaya ditangguhkan!', 'success')
    } else {
      showToast('Ralat semasa mengemaskini.', 'error')
    }
    setSavingPostpone(false)
  }

  const formatSubmitted = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })

  const printSlip = (booking: Booking) => {
  const eq = [
    booking.microphone > 0 ? `Mikrofon (${booking.microphone})` : null,
    booking.aircond > 0 ? `Penghawa Dingin (${booking.aircond})` : null,
    booking.pa_system > 0 ? `Sistem PA (${booking.pa_system})` : null,
    booking.lcd_projector > 0 ? `Projektor LCD (${booking.lcd_projector})` : null,
  ].filter(Boolean)

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })

  const slipHTML = `<!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8"/>
      <title>Slip Kelulusan - ${booking.full_name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: white; color: #1a1a1a; padding: 48px; }
        .watermark {
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 90px; font-weight: 900;
          color: rgba(22,163,74,0.07); letter-spacing: 8px;
          pointer-events: none; z-index: 0; white-space: nowrap;
        }
        .content { position: relative; z-index: 1; }
        .header { text-align: center; border-bottom: 3px solid #8B0000; padding-bottom: 20px; margin-bottom: 24px; }
        .header h1 { font-size: 20px; font-weight: 800; color: #8B0000; letter-spacing: 1px; }
        .header p { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .slip-title { text-align: center; margin-bottom: 16px; }
        .slip-title h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #374151; }
        .slip-title .ref { font-size: 11px; color: #9ca3af; margin-top: 4px; }
        .badge {
          display: block; width: fit-content; margin: 0 auto 24px;
          background: #dcfce7; color: #166534; border: 1.5px solid #86efac;
          padding: 5px 20px; border-radius: 999px; font-size: 13px; font-weight: 700;
        }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 10px; font-weight: 700; color: #8B0000; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 12px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .field label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 2px; }
        .field p { font-size: 13px; font-weight: 600; color: #1a1a1a; }
        .eq-list { display: flex; gap: 8px; flex-wrap: wrap; }
        .eq-tag { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 500; }
        .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .footer .note { font-size: 10px; color: #9ca3af; line-height: 1.7; max-width: 55%; }
        .sign .line { width: 160px; border-top: 1px solid #374151; margin-bottom: 6px; }
        .sign p { font-size: 10px; color: #6b7280; text-align: center; }
        .sign .name { color: #8B0000; font-weight: 700; margin-top: 2px; }
        .generated { text-align: center; margin-top: 16px; font-size: 10px; color: #d1d5db; }
        @media print {
          .print-bar { display: none !important; }
          body { padding: 40px; }
          .watermark, .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="watermark">DILULUSKAN</div>
      <div class="content">
        <div class="header">
          <img src="https://mini-theater-booking-system.vercel.app/logo.png"
            alt="Logo"
            style="height: 56px; width: auto; object-fit: contain; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;"
            onerror="this.style.display='none'"
          />
          <h1>MINI THEATER</h1>
          <p>UiTM Cawangan Kelantan, Kampus Machang</p>
        </div>
        <div class="slip-title">
          <h2>Slip Pengesahan Tempahan</h2>
          <p class="ref">No. Rujukan: MT-${booking.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <span class="badge">✓ DILULUSKAN</span>
        <div class="section">
          <p class="section-title">Maklumat Pemohon</p>
          <div class="grid">
            <div class="field"><label>Nama Penuh</label><p>${booking.full_name}</p></div>
            <div class="field"><label>No. Telefon</label><p>${booking.phone}</p></div>
            <div class="field"><label>Organisasi / Kelab</label><p>${booking.organization}</p></div>
            <div class="field"><label>Nama Program / Event</label><p>${booking.event_name}</p></div>
          </div>
        </div>
        <div class="section">
          <p class="section-title">Maklumat Tempahan</p>
          <div class="grid">
            <div class="field"><label>Tarikh Program</label><p>${formatDate(booking.booking_date)}</p></div>
            <div class="field"><label>Masa</label><p>${booking.start_time} - ${booking.end_time}</p></div>
            <div class="field"><label>Tempat</label><p>Mini Theater, UiTM Cawangan Kelantan</p></div>
            <div class="field"><label>Tarikh Permohonan</label><p>${formatDate(booking.created_at.split('T')[0])}</p></div>
          </div>
        </div>
        <div class="section">
          <p class="section-title">Peralatan Dipohon</p>
          ${eq.length > 0
            ? `<div class="eq-list">${eq.map(e => `<span class="eq-tag">${e}</span>`).join('')}</div>`
            : '<p style="font-size:12px;color:#9ca3af;font-style:italic;">Tiada peralatan tambahan</p>'
          }
        </div>
        <div class="footer">
          <div class="note">
            * Slip ini adalah pengesahan rasmi tempahan Mini Theater.<br/>
            * Sila bawa slip ini semasa program berlangsung.<br/>
            * Sebarang pertanyaan, hubungi pihak pengurusan.
          </div>
          <div class="sign">
            <div class="line"></div>
            <p>Tandatangan & Cop Rasmi</p>
            <p class="name">Pengurusan Mini Theater</p>
          </div>
        </div>
        <p class="generated">Dijana pada: ${new Date().toLocaleString('ms-MY')}</p>

        <div class="print-bar" style="text-align:center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
          <button onclick="window.print()" style="
            display: inline-flex; align-items: center; gap: 8px;
            padding: 11px 28px; background: linear-gradient(135deg, #8B0000, #a50000);
            color: white; border: none; border-radius: 8px;
            font-size: 13px; font-weight: 600; cursor: pointer;
            box-shadow: 0 4px 12px rgba(139,0,0,0.3); letter-spacing: 0.3px;
          ">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Cetak / Simpan sebagai PDF
          </button>
        </div>
      </div>
    </body>
    </html>`

    const blob = new Blob([slipHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  function renderDetail(booking: Booking) {
    const eq = equipment(booking)
    return (
      <div className="detail-panel" style={{ background: 'white', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '20px 24px', animation: 'slideDown 0.2s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {/* Top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{booking.full_name}</h3>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Submitted on {formatSubmitted(booking.created_at)}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700',
              background: booking.status === 'approved' ? '#16a34a' 
                : booking.status === 'rejected' ? '#dc2626' 
                : booking.status === 'postponed' ? '#7c3aed'
                : '#f59e0b',
              color: 'white',
            }}>
              {statusLabel(booking.status)}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteBooking(booking.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px', transition: 'all 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
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
        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
          {[
            { label: 'Event Name', value: booking.event_name, highlight: true },
            { label: 'Organization', value: booking.organization },
            { label: 'Full Name / Phone', value: `${booking.full_name}\n${booking.phone}` },
            { label: 'Booking Date & Time', value: `${new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })} | ${booking.start_time} - ${booking.end_time}` },
          ].map((item) => (
            <div key={item.label}>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
              <p className="detail-value" style={{ fontSize: '14px', fontWeight: '600', color: item.highlight ? '#8B0000' : '#111827', wordBreak: 'break-word', whiteSpace: 'pre-line' }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Equipment */}
        {eq.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requested Equipment:</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {eq.map((e) => (
                <span key={e.label} style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '500', background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe' }}>
                  {e.label}: {e.value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Attached File */}
        <div style={{ border: '1px solid #f3f4f6', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', background: '#f9fafb' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attached File</p>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Approval Paperwork Attachment</p>
          </div>
          {booking.attachment_url ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={booking.attachment_url} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', fontSize: '12px', fontWeight: '600', color: '#374151', textDecoration: 'none' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                View
              </a>
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const response = await fetch(booking.attachment_url!)
                    const blob = await response.blob()
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `attachment-${booking.id}.pdf`
                    link.click()
                    URL.revokeObjectURL(url)
                  } catch {
                    showToast('Gagal muat turun fail.', 'error')
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', fontSize: '12px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>No attachment</span>
          )}
        </div>

        {/* Admin Note */}
        <div style={{ border: '1px solid #f3f4f6', borderRadius: '10px', padding: '12px 16px', background: '#f9fafb', marginBottom: booking.status === 'pending' ? '16px' : '0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Note</p>
            {editingNote !== booking.id ? (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingNote(booking.id) }}
                style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#8B0000'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >Edit</button>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingNote(null) }}
                  style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}
                >Cancel</button>
                <button
                  onClick={(e) => { e.stopPropagation(); saveNote(booking.id) }}
                  disabled={savingNote}
                  style={{ fontSize: '12px', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontWeight: '600' }}
                >{savingNote ? '...' : 'Save'}</button>
              </div>
            )}
          </div>

          {editingNote === booking.id ? (
            <textarea
              value={noteValues[booking.id] ?? ''}
              onChange={(e) => setNoteValues(prev => ({ ...prev, [booking.id]: e.target.value }))}
              onClick={(e) => e.stopPropagation()}
              placeholder="Add note for this booking..."
              rows={3}
              style={{
                width: '100%', background: 'white', border: '1.5px solid #e5e7eb',
                borderRadius: '8px', padding: '10px 12px', fontSize: '13px',
                color: '#111827', outline: 'none', resize: 'vertical',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
              onFocus={(e) => e.target.style.borderColor = '#8B0000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          ) : (
            <p style={{ fontSize: '13px', color: noteValues[booking.id] ? '#374151' : '#d1d5db', fontStyle: noteValues[booking.id] ? 'normal' : 'italic' }}>
              {noteValues[booking.id] || 'No note. Click Edit to add.'}
            </p>
          )}
        </div>

        {/* Cetak Slip + Tangguh — sebaris */}
        {booking.status === 'approved' && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Cetak Slip */}
            <button
              onClick={(e) => { e.stopPropagation(); printSlip(booking) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 20px', borderRadius: '8px',
                border: '1px solid #bfdbfe', background: '#eff6ff',
                color: '#1d4ed8', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print Approval Slip
            </button>

            {/* Postpone Program */}
            {new Date(booking.booking_date) >= new Date(new Date().toDateString()) && (
              postponingId !== booking.id ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPostponeForm({
                      date: booking.booking_date,
                      start_time: booking.start_time,
                      end_time: booking.end_time,
                      reason: ''
                    })
                    setPostponingId(booking.id)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 20px', borderRadius: '8px',
                    border: '1px solid #ddd6fe', background: '#f5f3ff',
                    color: '#7c3aed', fontSize: '13px', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#ede9fe'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f5f3ff'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Postpone Program
                </button>
              ) : (
                <div
                  style={{ width: '100%', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '18px', background: '#f5f3ff', marginTop: '4px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#7c3aed', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Postpone Program
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }} className="postpone-grid">
                    <div>
                      <label style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Date</label>
                      <input type="date" value={postponeForm.date} min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setPostponeForm(prev => ({ ...prev, date: e.target.value }))}
                        style={{ width: '100%', border: '1.5px solid #c4b5fd', borderRadius: '8px', padding: '9px 10px', fontSize: '13px', outline: 'none', background: 'white', color: '#111827', boxSizing: 'border-box' as const }}
                        onFocus={(e) => e.target.style.borderColor = '#7c3aed'} onBlur={(e) => e.target.style.borderColor = '#c4b5fd'} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Start Time</label>
                      <input type="time" value={postponeForm.start_time}
                        onChange={(e) => setPostponeForm(prev => ({ ...prev, start_time: e.target.value }))}
                        style={{ width: '100%', border: '1.5px solid #c4b5fd', borderRadius: '8px', padding: '9px 10px', fontSize: '13px', outline: 'none', background: 'white', color: '#111827', boxSizing: 'border-box' as const }}
                        onFocus={(e) => e.target.style.borderColor = '#7c3aed'} onBlur={(e) => e.target.style.borderColor = '#c4b5fd'} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New End Time</label>
                      <input type="time" value={postponeForm.end_time}
                        onChange={(e) => setPostponeForm(prev => ({ ...prev, end_time: e.target.value }))}
                        style={{ width: '100%', border: '1.5px solid #c4b5fd', borderRadius: '8px', padding: '9px 10px', fontSize: '13px', outline: 'none', background: 'white', color: '#111827', boxSizing: 'border-box' as const }}
                        onFocus={(e) => e.target.style.borderColor = '#7c3aed'} onBlur={(e) => e.target.style.borderColor = '#c4b5fd'} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Reason for Postponement <span style={{ color: '#9ca3af', fontWeight: '400', textTransform: 'none' }}>(required)</span>
                    </label>
                    <textarea value={postponeForm.reason}
                      onChange={(e) => setPostponeForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g., Conflict with venue schedule, facility unavailable..."
                      rows={3}
                      style={{ width: '100%', border: '1.5px solid #c4b5fd', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', background: 'white', color: '#111827', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                      onFocus={(e) => e.target.style.borderColor = '#7c3aed'} onBlur={(e) => e.target.style.borderColor = '#c4b5fd'} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setPostponingId(null); setPostponeForm({ date: '', start_time: '', end_time: '', reason: '' }) }}
                      style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #c4b5fd', background: 'white', color: '#7c3aed', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={() => savePostpone(booking.id)} disabled={savingPostpone}
                      style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: 'white', fontSize: '13px', fontWeight: '600', cursor: savingPostpone ? 'not-allowed' : 'pointer', opacity: savingPostpone ? 0.7 : 1 }}>
                      {savingPostpone ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Info tangguhan — tunjuk bila status postponed */}
        {booking.status === 'postponed' && booking.postponed_date && (
          <div style={{ marginTop: '12px', padding: '14px 16px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📅 Maklumat Tangguhan
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div>
                <p style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '2px' }}>New Date</p>
                <p style={{ color: '#7c3aed', fontWeight: '600' }}>
                  {new Date(booking.postponed_date + 'T00:00:00').toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '2px' }}>New Start Time</p>
                <p style={{ color: '#7c3aed', fontWeight: '600' }}>
                  {booking.postponed_time_start} – {booking.postponed_time_end}
                </p>
              </div>
              {booking.postpone_reason && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '2px' }}>Reason for Postponement</p>
                  <p style={{ color: '#374151', fontWeight: '500' }}>{booking.postpone_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approve / Reject */}
        {booking.status === 'pending' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); updateStatus(booking.id, 'approved') }}
              disabled={loading}
              style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}
            >✓ Approve</button>
            <button
              onClick={(e) => { e.stopPropagation(); updateStatus(booking.id, 'rejected') }}
              disabled={loading}
              style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
            >✗ Reject</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>Bookings</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Check and manage all bookings</p>
      </div>

      {/* Filter Tabs + Action Buttons */}
      <div className="filter-action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div className="filter-tabs" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'All', value: 'all' },
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'Postponed', value: 'postponed' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              style={{
                padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                border: filter === tab.value ? '1px solid #8B0000' : '1px solid #e5e7eb',
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
                padding: '1px 6px', borderRadius: '999px', fontSize: '11px',
              }}>
                {tab.value === 'all' ? bookings.length : bookings.filter(b => b.status === tab.value).length}
              </span>
            </button>
          ))}
        </div>

        <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
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
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#8B0000', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <a
            href="/admin/bookings/add"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(139,0,0,0.2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Booking
          </a>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="search-sort-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Find name, event or organization..."
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px',
              padding: '9px 14px 9px 36px', fontSize: '13px', outline: 'none',
              boxSizing: 'border-box', background: '#f9fafb', color: '#111827', transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#8B0000'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '9px 32px 9px 36px',
              fontSize: '13px', outline: 'none', background: '#f9fafb', color: '#374151',
              cursor: 'pointer', fontWeight: '500', appearance: 'none', WebkitAppearance: 'none',
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="date_asc">Event date ↑</option>
            <option value="date_desc">Event date ↓</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>No bookings</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <table className="desktop-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                  {['', 'Event', 'Booker Name', 'Organization', 'Date', 'Time', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
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
                        onClick={() => setExpanded(expanded === booking.id ? null : booking.id)}
                        style={{
                          borderBottom: '1px solid #f5f5f5',
                          background: expanded === booking.id ? '#f5f5f5' : 'white',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { if (expanded !== booking.id) e.currentTarget.style.background = '#f9fafb' }}
                        onMouseLeave={(e) => { if (expanded !== booking.id) e.currentTarget.style.background = 'white' }}
                      >
                        <td style={{ padding: '12px 8px 12px 16px', width: '24px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transition: 'transform 0.2s ease', transform: expanded === booking.id ? 'rotate(180deg)' : 'rotate(0deg)', display: 'block' }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#8B0000', fontWeight: '600' }}>{booking.event_name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{booking.full_name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{booking.organization}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                          {new Date(booking.booking_date).toLocaleDateString('ms-MY')}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{booking.start_time} - {booking.end_time}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            {statusLabel(booking.status)}
                          </span>
                        </td>
                      </tr>

                      {expanded === booking.id && (
                        <tr key={`${booking.id}-detail`}>
                          <td colSpan={7} style={{ padding: '8px 12px 20px', background: '#f5f5f5' }}>
                            {renderDetail(booking)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile Card List */}
            <div className="mobile-cards">
              {filtered.map((booking) => {
                const sc = statusColor(booking.status)
                const isOpen = expanded === booking.id
                return (
                  <div key={booking.id} id={`booking-${booking.id}`}>
                    <div
                      onClick={() => setExpanded(isOpen ? null : booking.id)}
                      style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #f3f4f6',
                        background: isOpen ? '#f5f5f5' : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                      <span style={{ flex: 1, fontSize: '13px', color: '#8B0000', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {booking.event_name}
                      </span>
                      <span style={{ flexShrink: 0, padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {statusLabel(booking.status)}
                      </span>
                    </div>

                    {isOpen && (
                      <div style={{ padding: '8px 12px 16px', background: '#f5f5f5' }}>
                        {renderDetail(booking)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .desktop-table { display: table; }
        .mobile-cards { display: none; }

        @media (max-width: 640px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: block !important; }
          .postpone-grid { grid-template-columns: 1fr !important; }

          .filter-action-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .filter-tabs {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .filter-tabs button {
            width: 100% !important;
            justify-content: center !important;
          }
          .action-buttons {
            flex-direction: column !important;
            width: 100% !important;
          }
          .action-buttons a,
          .action-buttons button {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
          .search-sort-row { flex-wrap: wrap !important; }
          .search-sort-row > div:last-child { width: 100% !important; }
          .search-sort-row > div:last-child select { width: 100% !important; box-sizing: border-box !important; }
          .detail-grid { grid-template-columns: 1fr !important; }
          .detail-panel { padding: 14px 12px !important; }
        }
      `}</style>
    </div>
  )
}