'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'
import { syncToGoogleSheet } from '@/lib/googleSheet'
import BlackoutCalendar from '@/components/BlackoutCalendar'

type Venue = {
  id: string
  name: string
  code: string
}

type Slot = {
  booking_date: string
  start_time: string
  end_time: string
  microphone: number
  aircond: number
  pa_system: number
  lcd_projector: number
}

const emptySlot = (): Slot => ({
  booking_date: '', start_time: '', end_time: '',
  microphone: 0, aircond: 0, pa_system: 0, lcd_projector: 0,
})

function EquipmentSelect({ eq, value, onChange }: { 
  eq: { label: string; field: string; icon: React.ReactNode; max: number }
  value: number
  onChange: (val: number) => void 
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px', background: '#f9fafb', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {eq.icon} {eq.label}
        </span>
        <span style={{ fontSize: '10px', color: '#3b82f6', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
          MAX {eq.max}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'white', border: `1.5px solid ${open ? '#8B0000' : '#e5e7eb'}`,
          borderRadius: '6px', padding: '8px 12px', fontSize: '14px', fontWeight: '600',
          color: '#111827', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.2s', boxShadow: open ? '0 0 0 2px rgba(139,0,0,0.08)' : 'none',
        }}
      >
        <span>{value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div style={{
        position: 'absolute', left: 0, right: 0, zIndex: 50,
        background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
        marginTop: '4px', overflow: 'hidden',
        maxHeight: open ? '200px' : '0px',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'all 0.2s ease',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        pointerEvents: open ? 'auto' : 'none',
      }}>
        {Array.from({ length: eq.max + 1 }, (_, i) => (
          <button
            key={i} type="button"
            onClick={() => { onChange(i); setOpen(false) }}
            style={{
              width: '100%', padding: '10px 14px', fontSize: '14px', fontWeight: '500',
              background: value === i ? '#fef2f2' : 'transparent',
              color: value === i ? '#8B0000' : '#6b7280',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              borderBottom: i < eq.max ? '1px solid #f3f4f6' : 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (value !== i) e.currentTarget.style.background = '#f9fafb' }}
            onMouseLeave={(e) => { if (value !== i) e.currentTarget.style.background = 'transparent' }}
          >{i}</button>
        ))}
      </div>
    </div>
  )
}

export default function AdminBookingClient() {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [form, setForm] = useState({
    full_name: '', phone: '', organization: '', event_name: '', venue_id: '',
  })
  const [slots, setSlots] = useState<Slot[]>([emptySlot()])

  useEffect(() => {
    supabase
      .from('venues')
      .select('id, name, code')
      .eq('is_active', true)
      .order('position', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setVenues(data)
          setForm(prev => prev.venue_id ? prev : { ...prev, venue_id: data[0]?.id ?? '' })
        }
      })
  }, [])

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const updateSlot = (index: number, field: keyof Slot, value: string | number) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const addSlot = () => {
    setSlots(prev => [...prev, emptySlot()])
  }

  const removeSlot = (index: number) => {
    setSlots(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFile = async (bookingId: string) => {
    if (!file) return null
    const fileExt = file.name.split('.').pop()
    const fileName = `${bookingId}.${fileExt}`
    const { error } = await supabase.storage.from('approval-docs').upload(fileName, file)
    if (error) return null
    const { data: urlData } = supabase.storage.from('approval-docs').getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const checkConflictForSlot = async (slot: Slot) => {
    const { data } = await supabase
      .from('bookings')
      .select('id, start_time, end_time')
      .eq('booking_date', slot.booking_date)
      .eq('venue_id', form.venue_id)
      .in('status', ['approved', 'pending'])

    if (!data) return false
    return data.some(b =>
      slot.start_time < b.end_time && slot.end_time > b.start_time
    )
  }

  const handleSubmit = async () => {
    if (!form.venue_id) {
      showToast('Sila pilih tempat/venue.', 'error')
      return
    }
    if (!form.full_name || !form.phone || !form.organization || !form.event_name) {
      showToast('Sila isi semua maklumat peribadi.', 'error')
      return
    }

    const phoneRegex = /^(\+?60|0)[0-9]{8,10}$/
    if (!phoneRegex.test(form.phone.replace(/[-\s]/g, ''))) {
      showToast('Format nombor telefon tidak sah. Contoh: 012-3456789', 'error')
      return
    }

    for (const slot of slots) {
      if (!slot.booking_date || !slot.start_time || !slot.end_time) {
        showToast('Sila isi tarikh dan masa untuk semua slot.', 'error'); return
      }
      if (slot.start_time >= slot.end_time) {
        showToast('Masa tamat mesti lebih lewat dari masa mula untuk setiap slot.', 'error'); return
      }
    }

    // Check conflict + blackout untuk SETIAP slot — admin boleh override satu-satu dengan confirm
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]

      const hasConflict = await checkConflictForSlot(slot)
      if (hasConflict) {
        const proceed = window.confirm(
          `⚠️ Slot ${i + 1} (${slot.booking_date}, ${slot.start_time}-${slot.end_time}) ada conflict masa dengan tempahan lain.\nTeruskan sebagai admin?`
        )
        if (!proceed) return
      }

      const { data: blackout } = await supabase
        .from('blackout_dates')
        .select('date, reason')
        .eq('date', slot.booking_date)
        .single()

      if (blackout) {
        const proceedBlackout = window.confirm(
          `⚠️ Slot ${i + 1}: Tarikh ${slot.booking_date} adalah blackout date${blackout.reason ? ` (${blackout.reason})` : ''}.\nTeruskan sebagai admin?`
        )
        if (!proceedBlackout) return
      }
    }

    setLoading(true)
    const groupId = crypto.randomUUID()
    const rowsToInsert = slots.map(slot => ({
      ...form,
      ...slot,
      status: 'approved',
      booking_group_id: groupId,
    }))

    const { data: inserted, error } = await supabase
      .from('bookings').insert(rowsToInsert).select()

    if (error) {
      showToast('Ralat semasa menambah tempahan.', 'error')
      setLoading(false)
      return
    }

    if (inserted?.[0]) {
      const attachmentUrl = await uploadFile(inserted[0].id)
      if (attachmentUrl) {
        await supabase.from('bookings').update({ attachment_url: attachmentUrl }).eq('booking_group_id', groupId)
      }
    }

    for (const row of inserted ?? []) {
      await syncToGoogleSheet({ ...row })
    }

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'admin_booking',
        booking: { ...form, slots, groupId },
      }),
    })

    showToast(`Tempahan berjaya ditambah (${slots.length} slot) dan diluluskan!`, 'success')
    setTimeout(() => { window.location.href = '/admin/bookings' }, 1200)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: 'white', border: '1.5px solid #e5e7eb',
    borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const, color: '#111827', transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: '600' as const,
    color: '#6b7280', marginBottom: '6px',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  }

  const cardStyle = {
    background: 'white',
    border: '1px solid #f3f4f6',
    borderRadius: '14px',
    padding: '28px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }

  const equipmentDefs = [
    { label: 'Microphone', field: 'microphone' as const, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>, max: 2 },
    { label: 'Air-cond', field: 'aircond' as const, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>, max: 1 },
    { label: 'PA System', field: 'pa_system' as const, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>, max: 1 },
    { label: 'LCD Projector', field: 'lcd_projector' as const, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><path d="M17 2l-5 5-5-5"/></svg>, max: 1 },
  ]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <a href="/admin/bookings" style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '13px', color: '#6b7280', textDecoration: 'none',
            padding: '5px 10px', borderRadius: '6px', border: '1px solid #e5e7eb',
            transition: 'all 0.15s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Kembali
          </a>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>
          Admin: Add Booking
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          Bypass advance rules & auto-approve new bookings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }} className="booking-grid">

        {/* Section 1 — Personal */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #8B0000, #a50000)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>1</div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>Personal & Organization Details</h2>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Tempat / Venue <span style={{ color: '#dc2626' }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {venues.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, venue_id: v.id }))}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.15s',
                    border: form.venue_id === v.id ? '1.5px solid #8B0000' : '1.5px solid #e5e7eb',
                    background: form.venue_id === v.id ? '#fef2f2' : 'white',
                    color: form.venue_id === v.id ? '#8B0000' : '#374151',
                  }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          {[
            { label: 'Full Name', field: 'full_name', placeholder: 'Enter full name', type: 'text' },
            { label: 'Phone Number', field: 'phone', placeholder: 'e.g. 012-345-6789', type: 'tel' },
            { label: 'Club / Organization Name', field: 'organization', placeholder: 'Enter club or organization name', type: 'text' },
            { label: 'Event Name', field: 'event_name', placeholder: 'Enter the name of the event', type: 'text' },
          ].map((item) => (
            <div key={item.field} style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{item.label} <span style={{ color: '#dc2626' }}>*</span></label>
              <input type={item.type} value={form[item.field as keyof typeof form]} placeholder={item.placeholder}
                onChange={(e) => updateForm(item.field, e.target.value)} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
            </div>
          ))}
        </div>

        {/* Section 2 — Schedule, loop ikut slot */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #8B0000, #a50000)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>2</div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>Schedule & Equipment</h2>
            </div>
            {slots.length > 1 && (
              <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', padding: '2px 8px', borderRadius: '999px', fontWeight: '600' }}>
                {slots.length} slot
              </span>
            )}
          </div>

          {slots.map((slot, index) => (
            <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', marginBottom: '14px', background: '#f9fafb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#8B0000' }}>Slot {index + 1}</span>
                {slots.length > 1 && (
                  <button type="button" onClick={() => removeSlot(index)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    Buang Slot
                  </button>
                )}
              </div>

              <label style={labelStyle}>Booking Date <span style={{ color: '#dc2626' }}>*</span></label>
              <BlackoutCalendar
                value={slot.booking_date}
                onChange={(date) => updateSlot(index, 'booking_date', date)}
                placeholder="Pilih tarikh tempahan"
                isAdmin={true}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '14px 0' }}>
                <div>
                  <label style={labelStyle}>Start Time <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="time" value={slot.start_time} onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
                </div>
                <div>
                  <label style={labelStyle}>End Time <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="time" value={slot.end_time} onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
                </div>
              </div>

              <label style={{ ...labelStyle, marginBottom: '10px' }}>Additional Equipment</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {equipmentDefs.map((eq) => (
                  <EquipmentSelect
                    key={eq.field}
                    eq={eq}
                    value={slot[eq.field]}
                    onChange={(val) => updateSlot(index, eq.field, val)}
                  />
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addSlot}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              border: '1.5px dashed #d1d5db', background: 'transparent',
              color: '#6b7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              marginBottom: '14px',
            }}
          >
            + Tambah Hari / Slot Lain
          </button>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#2563eb', display: 'flex', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span><strong>Admin Note:</strong> Semua slot akan dicipta sebagai "Approved" (bypass lead times & restrictions). Conflict/blackout akan diminta confirm satu-satu.</span>
          </div>
        </div>

        {/* Section 3 — Upload (full width) */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #8B0000, #a50000)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>3</div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>Upload Approval Paperwork</h2>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>Optional — upload if physical approval document is available</p>
            </div>
          </div>

          {file ? (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>{file.name}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >Buang</button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false)
                const dropped = e.dataTransfer.files?.[0]
                if (dropped?.type === 'application/pdf') setFile(dropped)
                else showToast('Hanya fail PDF dibenarkan.', 'error')
              }}
              style={{
                border: `2px dashed ${dragOver ? '#8B0000' : '#e5e7eb'}`,
                borderRadius: '12px', padding: '40px',
                textAlign: 'center',
                background: dragOver ? '#fef2f2' : '#fafafa',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
            >
              <label style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{
                  width: '48px', height: '48px',
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Click to upload or drag and drop
                </p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Only PDF files are accepted</p>
                <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => {
                  const selected = e.target.files?.[0]
                  if (selected?.type === 'application/pdf') setFile(selected)
                  else showToast('Hanya fail PDF dibenarkan.', 'error')
                }} />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%',
          background: loading ? '#f3f4f6' : 'linear-gradient(135deg, #8B0000, #a50000)',
          color: loading ? '#9ca3af' : 'white',
          border: loading ? '1px solid #e5e7eb' : 'none',
          borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(139,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(139,0,0,0.35)' }}
        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,0,0,0.25)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        {loading ? 'Menambah...' : `Add & Approve Booking${slots.length > 1 ? ` (${slots.length} slot)` : ''}`}
      </button>

      <style>{`
        @media (max-width: 768px) {
          .booking-grid { grid-template-columns: 1fr !important; }
        }
        input[type="time"]::-webkit-calendar-picker-indicator {
          cursor: pointer; opacity: 0.5;
        }
        input::placeholder { color: #9ca3af; }
      `}</style>
    </div>
  )
}