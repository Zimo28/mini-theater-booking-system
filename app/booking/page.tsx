'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
          transition: 'all 0.2s',
          boxShadow: open ? '0 0 0 2px rgba(139,0,0,0.15)' : 'none',
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
            key={i}
            type="button"
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
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function BookingPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
  }, [])

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    organization: '',
    event_name: '',
    booking_date: '',
    start_time: '',
    end_time: '',
    microphone: 0,
    aircond: 0,
    pa_system: 0,
    lcd_projector: 0,
  })

  const updateForm = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const getMinDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 5)
    return date.toISOString().split('T')[0]
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

  const handleSubmit = async () => {
    setError('')
    if (!form.full_name || !form.phone || !form.organization || !form.event_name) {
      setError('Sila isi semua maklumat peribadi.')
      return
    }
    if (!form.booking_date || !form.start_time || !form.end_time) {
      setError('Sila isi tarikh dan masa.')
      return
    }
    if (form.start_time >= form.end_time) {
      setError('Masa tamat mesti lebih lewat dari masa mula.')
      return
    }
    if (!file) {
      setError('Sila muat naik dokumen kelulusan (PDF) sebelum menghantar.')
      return
    }

    setLoading(true)

    const { data: inserted, error } = await supabase
      .from('bookings')
      .insert([{ ...form, status: 'pending' }])
      .select()
      .single()

    if (error) {
      setError('Ralat semasa menghantar. Sila cuba lagi.')
      setLoading(false)
    } else {
      const attachmentUrl = await uploadFile(inserted.id)
      if (attachmentUrl) {
        await supabase.from('bookings').update({ attachment_url: attachmentUrl }).eq('id', inserted.id)
      }
      await syncToGoogleSheet({ ...form, id: inserted.id, status: 'pending', created_at: inserted.created_at })

      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_booking',
          booking: { ...form, id: inserted.id },
        }),
      })

      setLoading(false)
      setSuccess(true)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#1a1a1a',
    border: '1.5px solid #1f2937',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: 'white',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600' as const,
    color: '#6b7280',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
  }

  const cardStyle = {
    background: '#161616',
    border: '1px solid #1f1f1f',
    borderRadius: '16px',
    padding: '24px',
    height: '100%',
    boxSizing: 'border-box' as const,
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <nav style={{ background: '#111111', borderBottom: '1px solid #1f1f1f', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/">
            <img src="/logo.png" alt="Mini Theater" style={{ height: '44px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
          </a>
          <a href="/" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Kembali ke Laman Utama
          </a>
        </nav>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{
            ...cardStyle,
            textAlign: 'center',
            maxWidth: '440px',
            width: '100%',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease',
          }}>
            <div style={{
              width: '72px', height: '72px',
              background: 'rgba(22,163,74,0.12)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '10px' }}>
              Tempahan Dihantar!
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.7' }}>
              Tempahan anda sedang menunggu kelulusan admin. Anda akan dihubungi sekiranya ada pertanyaan.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '28px', flexDirection: 'column' }}>
              <button
                onClick={() => {
                  setSuccess(false)
                  setFile(null)
                  setForm({ full_name: '', phone: '', organization: '', event_name: '', booking_date: '', start_time: '', end_time: '', microphone: 0, aircond: 0, pa_system: 0, lcd_projector: 0 })
                }}
                style={{
                  background: 'linear-gradient(135deg, #8B0000, #a50000)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  padding: '12px 32px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(139,0,0,0.3)',
                }}
              >Buat Tempahan Baru</button>
              <a href="/" style={{
                display: 'block', padding: '12px', borderRadius: '10px',
                border: '1px solid #1f2937', fontSize: '14px', fontWeight: '500',
                color: '#6b7280', textDecoration: 'none', textAlign: 'center',
              }}>← Kembali ke Laman Utama</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Segoe UI', system-ui, sans-serif", color: 'white' }}>

      {/* Navbar */}
      <nav style={{
        background: '#111111',
        borderBottom: '1px solid #1f1f1f',
        padding: '0 20px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <a href="/">
          <img src="/logo.png" alt="Mini Theater" style={{ height: '40px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        </a>
        <a href="/" style={{
          fontSize: '13px', color: '#6b7280', textDecoration: 'none',
          fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px',
          padding: '6px 12px', borderRadius: '6px', border: '1px solid #1f2937',
          transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.background = '#1a1a1a' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#1f2937'; e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Kembali
        </a>
      </nav>

      {/* Hero Strip */}
      <div style={{
        position: 'relative',
        padding: '40px 24px',
        textAlign: 'center',
        overflow: 'hidden',
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
            Mini Theater — UiTM Cawangan Kelantan
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', marginBottom: '6px' }}>
            Borang Tempahan
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            Sila isi semua maklumat yang diperlukan dengan lengkap dan tepat
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ background: '#111111', borderBottom: '1px solid #1f1f1f', padding: '12px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minWidth: 'max-content', margin: '0 auto' }}>
          {[
            { num: '1', label: 'Maklumat Peribadi' },
            { num: '2', label: 'Jadual & Peralatan' },
            { num: '3', label: 'Dokumen Kelulusan' },
          ].map((step, i) => (
            <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8B0000, #a50000)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: '700', flexShrink: 0,
                }}>{step.num}</div>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', whiteSpace: 'nowrap' }}>{step.label}</span>
              </div>
              {i < 2 && <div style={{ width: '24px', height: '1px', background: '#1f2937', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ maxWidth: '900px', margin: '16px auto 0', padding: '0 16px' }}>
          <div style={{
            background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: '10px', padding: '12px 16px',
            color: '#f87171', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ padding: '20px 16px 48px' }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease 0.1s',
        }}>

          {/* Top 2 cards */}
          <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }} className="top-grid">

            {/* Section 1 — Personal */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg, #8B0000, #a50000)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>1</div>
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: 0 }}>Personal & Organization Details</h2>
              </div>

              {/* ✅ FIX: Semua field stacked 1 kolum */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                <div>
                  <label style={labelStyle}>Full Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" placeholder="Enter your full name"
                    onChange={(e) => updateForm('full_name', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                    onBlur={(e) => e.target.style.borderColor = '#1f2937'} />
                </div>

                <div>
                  <label style={labelStyle}>Phone Number <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="tel" placeholder="e.g. 012-3456789"
                    onChange={(e) => updateForm('phone', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                    onBlur={(e) => e.target.style.borderColor = '#1f2937'} />
                </div>

                <div>
                  <label style={labelStyle}>Organization <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" placeholder="Club or organization name"
                    onChange={(e) => updateForm('organization', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                    onBlur={(e) => e.target.style.borderColor = '#1f2937'} />
                </div>

                <div>
                  <label style={labelStyle}>Event Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" placeholder="Enter the name of your event"
                    onChange={(e) => updateForm('event_name', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                    onBlur={(e) => e.target.style.borderColor = '#1f2937'} />
                </div>

              </div>
            </div>

            {/* Section 2 — Schedule */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg, #8B0000, #a50000)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>2</div>
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: 0 }}>Schedule & Equipment</h2>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>
                  Booking Date <span style={{ color: '#dc2626' }}>*</span>{' '}
                  <span style={{ fontWeight: '400', color: '#4b5563', textTransform: 'none', letterSpacing: 0 }}>(Min. 5 days)</span>
                </label>
                <input type="date" min={getMinDate()} onChange={(e) => updateForm('booking_date', e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                  onBlur={(e) => e.target.style.borderColor = '#1f2937'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[{ label: 'Start Time', field: 'start_time' }, { label: 'End Time', field: 'end_time' }].map((t) => (
                  <div key={t.field}>
                    <label style={labelStyle}>{t.label} <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type="time" min="07:00" max="22:30"
                      onChange={(e) => updateForm(t.field, e.target.value)}
                      style={{ ...inputStyle, colorScheme: 'dark' }}
                      onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                      onBlur={(e) => e.target.style.borderColor = '#1f2937'} />
                  </div>
                ))}
              </div>

              <label style={{ ...labelStyle, marginBottom: '10px', display: 'block' }}>Additional Equipment</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {[
                  { label: 'Microphone', field: 'microphone', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>, max: 2 },
                  { label: 'Air-cond', field: 'aircond', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>, max: 1 },
                  { label: 'PA System', field: 'pa_system', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>, max: 1 },
                  { label: 'LCD Projector', field: 'lcd_projector', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><path d="M17 2l-5 5-5-5"/></svg>, max: 1 },
                ].map((eq) => (
                  <EquipmentSelect key={eq.field} eq={eq} value={form[eq.field as keyof typeof form] as number} onChange={(val) => updateForm(eq.field, val)} />
                ))}
              </div>

              <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#fbbf24', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span><strong>Warning:</strong> Other equipment (rostrum, sofa, etc.) must be applied via "emajlis" web.</span>
              </div>
            </div>
          </div>

          {/* Section 3 — Upload */}
          <div style={{ ...cardStyle, marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg, #8B0000, #a50000)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>3</div>
              <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: 0 }}>
                Upload Approval Paperwork <span style={{ color: '#dc2626' }}>*</span>
              </h2>
            </div>

            {file ? (
              <div style={{ border: '1px solid #1f2937', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111111', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{ width: '38px', height: '38px', flexShrink: 0, background: 'rgba(139,0,0,0.15)', border: '1px solid rgba(139,0,0,0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} style={{ flexShrink: 0, background: 'rgba(220,38,38,0.1)', color: '#f87171', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>Buang</button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false)
                  const dropped = e.dataTransfer.files?.[0]
                  if (dropped?.type === 'application/pdf') setFile(dropped)
                  else setError('Hanya fail PDF dibenarkan.')
                }}
                style={{
                  border: `2px dashed ${dragOver ? '#8B0000' : '#1f2937'}`,
                  borderRadius: '12px', padding: '40px 24px',
                  textAlign: 'center',
                  background: dragOver ? 'rgba(139,0,0,0.08)' : '#111111',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
              >
                <label style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{
                    width: '44px', height: '44px',
                    background: 'rgba(139,0,0,0.12)', border: '1px solid rgba(139,0,0,0.2)',
                    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                    Click to upload or drag and drop
                  </p>
                  <p style={{ fontSize: '12px', color: '#4b5563' }}>Only PDF files (Approval Documents) are allowed</p>
                  <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => {
                    const selected = e.target.files?.[0]
                    if (selected?.type === 'application/pdf') setFile(selected)
                    else setError('Hanya fail PDF dibenarkan.')
                  }} />
                </label>
              </div>
            )}
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
              borderRadius: '12px', padding: '15px',
              fontSize: '15px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(139,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(139,0,0,0.5)' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,0,0,0.35)' }}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Menghantar...
              </>
            ) : 'Hantar Tempahan →'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#060606', borderTop: '1px solid #0f0f0f', padding: '24px', textAlign: 'center' }}>
        <img src="/logo.png" alt="Mini Theater" style={{ height: '32px', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto 10px', filter: 'brightness(0) invert(1)', opacity: 0.35 }} />
        <p style={{ fontSize: '11px', color: '#1f2937', margin: 0 }}>
          © {new Date().getFullYear()} Mini Theater Booking System. All rights reserved.
        </p>
      </footer>

      <style>{`
        .top-grid {
          grid-template-columns: 1fr 1fr;
          align-items: stretch;
        }
        @media (max-width: 768px) {
          .top-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1);
          cursor: pointer;
          opacity: 0.6;
        }
        input::placeholder { color: #374151; }
      `}</style>
    </div>
  )
}