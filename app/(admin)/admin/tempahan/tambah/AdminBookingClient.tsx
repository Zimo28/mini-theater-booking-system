'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'
import { syncToGoogleSheet } from '@/lib/googleSheet'

export default function AdminBookingClient() {
  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async () => {
    if (!form.full_name || !form.phone || !form.organization || !form.event_name) {
      showToast('Sila isi semua maklumat peribadi.', 'error')
      return
    }
    if (!form.booking_date || !form.start_time || !form.end_time) {
      showToast('Sila isi tarikh dan masa.', 'error')
      return
    }
    if (form.start_time >= form.end_time) {
      showToast('Masa tamat mesti lebih lewat dari masa mula.', 'error')
      return
    }

    setLoading(true)

    const { data: inserted, error } = await supabase
      .from('bookings')
      .insert([{ ...form, status: 'approved' }])
      .select()
      .single()

    if (error) {
      showToast('Ralat semasa menambah tempahan.', 'error')
    } else {
      await syncToGoogleSheet({
        ...form,
        id: inserted.id,
        status: 'approved',
        created_at: inserted.created_at,
      })
      showToast('Tempahan berjaya ditambah dan diluluskan!', 'success')
      setTimeout(() => { window.location.href = '/admin/tempahan' }, 1200)
    }

    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#111827',
    background: 'white',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: '6px',
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <a
            href="/admin/tempahan"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: '#6b7280',
              textDecoration: 'none',
            }}
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px',
      }}
      className="booking-grid"
      >
        {/* Section 1 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #f3f4f6',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #8B0000, #a50000)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '13px',
              fontWeight: '700',
              flexShrink: 0,
            }}>1</div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
              Personal & Organization Details
            </h2>
          </div>

          {[
            { label: 'Full Name', field: 'full_name', placeholder: 'Enter full name', type: 'text' },
            { label: 'Phone Number', field: 'phone', placeholder: 'e.g. 012-345-6789', type: 'tel' },
            { label: 'Club / Organization Name', field: 'organization', placeholder: 'Enter club or organization name', type: 'text' },
            { label: 'Event Name', field: 'event_name', placeholder: 'Enter the name of the event', type: 'text' },
          ].map((item) => (
            <div key={item.field} style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                {item.label} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type={item.type}
                placeholder={item.placeholder}
                onChange={(e) => updateForm(item.field, e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          ))}
        </div>

        {/* Section 2 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #f3f4f6',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #8B0000, #a50000)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '13px',
              fontWeight: '700',
              flexShrink: 0,
            }}>2</div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
              Schedule & Equipment
            </h2>
          </div>

          {/* Date */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Booking Date <span style={{ color: '#dc2626' }}>*</span>
              </span>
            </label>
            <input
              type="date"
              onChange={(e) => updateForm('booking_date', e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#8B0000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Start Time', field: 'start_time', icon: '🟢' },
              { label: 'End Time', field: 'end_time', icon: '🔴' },
            ].map((t) => (
              <div key={t.field}>
                <label style={labelStyle}>
                  {t.icon} {t.label} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="time"
                  onChange={(e) => updateForm(t.field, e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            ))}
          </div>

          {/* Equipment */}
          <div>
            <label style={{ ...labelStyle, marginBottom: '12px' }}>Additional Equipment Request</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Microphone', field: 'microphone', icon: '🎤', max: 2 },
                { label: 'Air-cond', field: 'aircond', icon: '❄️', max: 1 },
                { label: 'PA System', field: 'pa_system', icon: '🔊', max: 1 },
                { label: 'LCD Projector', field: 'lcd_projector', icon: '📽️', max: 1 },
              ].map((eq) => (
                <div key={eq.field} style={{
                  border: '1.5px solid #f3f4f6',
                  borderRadius: '10px',
                  padding: '12px',
                  background: '#fafafa',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                      {eq.icon} {eq.label}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: '#9ca3af',
                      background: '#e5e7eb',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: '600',
                    }}>
                      MAX {eq.max}
                    </span>
                  </div>
                  <select
                    onChange={(e) => updateForm(eq.field, parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '13px',
                      outline: 'none',
                      background: 'white',
                    }}
                  >
                    {Array.from({ length: eq.max + 1 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Admin Note */}
            <div style={{
              marginTop: '14px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#1e40af',
              display: 'flex',
              gap: '6px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span><strong>Admin Note:</strong> This booking will be created as "Approved" bypassing lead times and time restrictions.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%',
          background: loading ? '#d1d5db' : 'linear-gradient(135deg, #8B0000, #a50000)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '16px',
          fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(139,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        {loading ? 'Menambah...' : 'Add & Approve Booking'}
      </button>

      <style>{`
        @media (max-width: 768px) {
          .booking-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}