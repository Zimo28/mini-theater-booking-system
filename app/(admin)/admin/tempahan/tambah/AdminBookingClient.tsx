'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'
import { syncToGoogleSheet } from '@/lib/googleSheet'

function EquipmentSelect({ eq, value, onChange }: { 
  eq: { label: string; field: string; icon: React.ReactNode; max: number }
  value: number
  onChange: (val: number) => void 
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ border: '1px solid #1f2937', borderRadius: '10px', padding: '12px', background: '#111111', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {eq.icon} {eq.label}
        </span>
        <span style={{ fontSize: '10px', color: '#93c5fd', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
          MAX {eq.max}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: '#0d0d0d', border: `1px solid ${open ? '#8B0000' : '#1f2937'}`,
          borderRadius: '6px', padding: '8px 12px', fontSize: '14px', fontWeight: '600',
          color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.2s', boxShadow: open ? '0 0 0 2px rgba(139,0,0,0.15)' : 'none',
        }}
      >
        <span>{value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div style={{
        position: 'absolute', left: 0, right: 0, zIndex: 50,
        background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: '8px',
        marginTop: '4px', overflow: 'hidden',
        maxHeight: open ? '200px' : '0px',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'all 0.2s ease',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        pointerEvents: open ? 'auto' : 'none',
      }}>
        {Array.from({ length: eq.max + 1 }, (_, i) => (
          <button
            key={i} type="button"
            onClick={() => { onChange(i); setOpen(false) }}
            style={{
              width: '100%', padding: '10px 14px', fontSize: '14px', fontWeight: '500',
              background: value === i ? 'rgba(139,0,0,0.2)' : 'transparent',
              color: value === i ? '#f87171' : '#9ca3af',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              borderBottom: i < eq.max ? '1px solid #1a1a1a' : 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (value !== i) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={(e) => { if (value !== i) e.currentTarget.style.background = 'transparent' }}
          >{i}</button>
        ))}
      </div>
    </div>
  )
}

export default function AdminBookingClient() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone: '', organization: '', event_name: '',
    booking_date: '', start_time: '', end_time: '',
    microphone: 0, aircond: 0, pa_system: 0, lcd_projector: 0,
  })

  const updateForm = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.full_name || !form.phone || !form.organization || !form.event_name) {
      showToast('Sila isi semua maklumat peribadi.', 'error'); return
    }
    if (!form.booking_date || !form.start_time || !form.end_time) {
      showToast('Sila isi tarikh dan masa.', 'error'); return
    }
    if (form.start_time >= form.end_time) {
      showToast('Masa tamat mesti lebih lewat dari masa mula.', 'error'); return
    }

    setLoading(true)
    const { data: inserted, error } = await supabase
      .from('bookings').insert([{ ...form, status: 'approved' }]).select().single()

    if (error) {
      showToast('Ralat semasa menambah tempahan.', 'error')
    } else {
      await syncToGoogleSheet({ ...form, id: inserted.id, status: 'approved', created_at: inserted.created_at })
      showToast('Tempahan berjaya ditambah dan diluluskan!', 'success')
      setTimeout(() => { window.location.href = '/admin/tempahan' }, 1200)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: '#1a1a1a', border: '1.5px solid #1f2937',
    borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const, color: 'white', transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: '600' as const,
    color: '#9ca3af', marginBottom: '6px',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  }

  const cardStyle = {
    background: '#161616', border: '1px solid #1f1f1f',
    borderRadius: '16px', padding: '28px',
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <a href="/admin/tempahan" style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '13px', color: '#6b7280', textDecoration: 'none',
            padding: '5px 10px', borderRadius: '6px', border: '1px solid #1f2937',
            transition: 'all 0.15s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.background = '#1a1a1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#1f2937'; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Kembali
          </a>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>
          Admin: Add Booking
        </h1>
        <p style={{ color: '#4b5563', fontSize: '14px', marginTop: '4px' }}>
          Bypass advance rules & auto-approve new bookings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }} className="booking-grid">

        {/* Section 1 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #8B0000, #a50000)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>1</div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>Personal & Organization Details</h2>
          </div>
          {[
            { label: 'Full Name', field: 'full_name', placeholder: 'Enter full name', type: 'text' },
            { label: 'Phone Number', field: 'phone', placeholder: 'e.g. 012-345-6789', type: 'tel' },
            { label: 'Club / Organization Name', field: 'organization', placeholder: 'Enter club or organization name', type: 'text' },
            { label: 'Event Name', field: 'event_name', placeholder: 'Enter the name of the event', type: 'text' },
          ].map((item) => (
            <div key={item.field} style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{item.label} <span style={{ color: '#dc2626' }}>*</span></label>
              <input type={item.type} placeholder={item.placeholder}
                onChange={(e) => updateForm(item.field, e.target.value)} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                onBlur={(e) => e.target.style.borderColor = '#1f2937'} />
            </div>
          ))}
        </div>

        {/* Section 2 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #8B0000, #a50000)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>2</div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>Schedule & Equipment</h2>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Booking Date <span style={{ color: '#dc2626' }}>*</span></label>
            <input type="date" onChange={(e) => updateForm('booking_date', e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={(e) => e.target.style.borderColor = '#8B0000'}
              onBlur={(e) => e.target.style.borderColor = '#1f2937'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {[{ label: 'Start Time', field: 'start_time' }, { label: 'End Time', field: 'end_time' }].map((t) => (
              <div key={t.field}>
                <label style={labelStyle}>{t.label} <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="time" onChange={(e) => updateForm(t.field, e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                  onBlur={(e) => e.target.style.borderColor = '#1f2937'} />
              </div>
            ))}
          </div>

          <label style={{ ...labelStyle, marginBottom: '12px' }}>Additional Equipment Request</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Microphone', field: 'microphone', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>, max: 2 },
              { label: 'Air-cond', field: 'aircond', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>, max: 1 },
              { label: 'PA System', field: 'pa_system', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>, max: 1 },
              { label: 'LCD Projector', field: 'lcd_projector', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><path d="M17 2l-5 5-5-5"/></svg>, max: 1 },
            ].map((eq) => (
              <EquipmentSelect key={eq.field} eq={eq} value={form[eq.field as keyof typeof form] as number} onChange={(val) => updateForm(eq.field, val)} />
            ))}
          </div>

          {/* Admin Note */}
          <div style={{ marginTop: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#93c5fd', display: 'flex', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span><strong>Admin Note:</strong> This booking will be created as "Approved" bypassing lead times and time restrictions.</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%',
          background: loading ? '#1f1f1f' : 'linear-gradient(135deg, #8B0000, #a50000)',
          color: loading ? '#6b7280' : 'white',
          border: loading ? '1px solid #2d2d2d' : 'none',
          borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(139,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(139,0,0,0.5)' }}
        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,0,0,0.35)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        {loading ? 'Menambah...' : 'Add & Approve Booking'}
      </button>

      <style>{`
        @media (max-width: 768px) {
          .booking-grid { grid-template-columns: 1fr !important; }
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1);
          cursor: pointer; opacity: 1;
        }
      `}</style>
    </div>
  )
}