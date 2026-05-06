'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'

type Facility = {
  id: string
  name: string
}

type BlackoutDate = { id: string; date: string; reason: string }

const tabs = [
  {
    id: 'general', label: 'General',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
  },
  {
    id: 'equipment', label: 'Equipment',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  },
  {
    id: 'notifications', label: 'Notifications',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  },
  {
    id: 'contact', label: 'Contact Us',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>
  },
  {
    id: 'blackout', label: 'Blackout Dates',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="15" x2="12" y2="19"/><line x1="10" y1="17" x2="14" y2="17"/></svg>
  },
]

export default function SettingsClient({
  settings: initialSettings,
  facilities: initialFacilities,
}: {
  settings: Record<string, string>
  facilities: Facility[]
}) {
  const [settings, setSettings] = useState(initialSettings)
  const [facilities, setFacilities] = useState(initialFacilities)
  const [newFacility, setNewFacility] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([])
  const [newBlackout, setNewBlackout] = useState({ date: '', reason: '' })
  const [loadingBlackout, setLoadingBlackout] = useState(false)

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const saveAllSettings = async () => {
    setSaving(true)
    const entries = Object.entries(settings).map(([id, value]) => ({
      id, value, updated_at: new Date().toISOString()
    }))
    const { error } = await supabase.from('settings').upsert(entries)
    if (!error) showToast('Settings saved successfully!', 'success')
    else showToast('Error occurred while saving settings.', 'error')
    setSaving(false)
  }

  const addFacility = async () => {
    if (!newFacility.trim()) return
    const { data, error } = await supabase
      .from('facilities')
      .insert([{ name: newFacility.trim() }])
      .select()
      .single()
    if (!error && data) {
      setFacilities(prev => [...prev, data])
      setNewFacility('')
      showToast('Kemudahan berjaya ditambah!', 'success')
    } else {
      showToast('Ralat semasa menambah.', 'error')
    }
  }

  const deleteFacility = async (id: string) => {
    const { error } = await supabase.from('facilities').delete().eq('id', id)
    if (!error) {
      setFacilities(prev => prev.filter(f => f.id !== id))
      showToast('Kemudahan berjaya dipadam.', 'success')
    } else {
      showToast('Ralat semasa memadam.', 'error')
    }
  }

  const addBlackoutDate = async () => {
    if (!newBlackout.date) { showToast('Please select a date.', 'error'); return }
    setLoadingBlackout(true)
    const { data, error } = await supabase
      .from('blackout_dates')
      .insert([{ date: newBlackout.date, reason: newBlackout.reason }])
      .select().single()
    if (!error && data) {
      setBlackoutDates(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
      setNewBlackout({ date: '', reason: '' })
      showToast('Blackout date successfully added!', 'success')
    } else {
      showToast('Error or date already exists.', 'error')
    }
    setLoadingBlackout(false)
  }

  const deleteBlackoutDate = async (id: string) => {
    const { error } = await supabase.from('blackout_dates').delete().eq('id', id)
    if (!error) {
      setBlackoutDates(prev => prev.filter(b => b.id !== id))
      showToast('Blackout date deleted.', 'success')
    }
  }

  const inputStyle = {
    width: '100%',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#111827',
    background: 'white',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#6b7280',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }

  const card = {
    background: 'white',
    border: '1px solid #f3f4f6',
    borderRadius: '12px',
    overflow: 'hidden' as const,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }

  useEffect(() => {
    const fetchBlackout = async () => {
      const { data } = await supabase
        .from('blackout_dates')
        .select('*')
        .order('date', { ascending: true })
      if (data) setBlackoutDates(data)
    }
    fetchBlackout()
  }, [])

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>Settings</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Manage system configurations</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '2px', marginBottom: '24px',
        background: '#f3f4f6', padding: '4px', borderRadius: '10px',
        border: '1px solid #e5e7eb', overflowX: 'auto',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 14px', borderRadius: '7px', border: 'none',
              fontSize: '13px', fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#8B0000' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6b7280',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '7px',
              flex: 1, justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = '#fef2f2'
                e.currentTarget.style.color = '#8B0000'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#6b7280'
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={card}>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>System Settings</h3>

            {/* Google Sheet */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f3f4f6' }}>
              <label style={labelStyle}>Google Sheet URL</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/..."
                  value={settings['google_sheet_url'] ?? ''}
                  onChange={(e) => updateSetting('google_sheet_url', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                {settings['google_sheet_url'] && (
                  <a
                    href={settings['google_sheet_url']} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textDecoration: 'none', flexShrink: 0, transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Open
                  </a>
                )}
              </div>
            </div>

            {/* Theater Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="settings-grid-2">
              {[
                { label: 'Theater Name', key: 'theater_name', col: '1 / -1', type: 'text' },
                { label: 'Hero Title', key: 'hero_title', col: '1 / -1', type: 'text' },
              ].map(item => (
                <div key={item.key} style={{ gridColumn: item.col }}>
                  <label style={labelStyle}>{item.label}</label>
                  <input type={item.type} value={settings[item.key] ?? ''} onChange={(e) => updateSetting(item.key, e.target.value)} style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
                </div>
              ))}

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Hero Subtitle</label>
                <textarea value={settings['hero_subtitle'] ?? ''} onChange={(e) => updateSetting('hero_subtitle', e.target.value)} rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
              </div>

              <div>
                <label style={labelStyle}>Opening Hours</label>
                <input type="time" value={settings['operating_hours_start'] ?? '07:00'} onChange={(e) => updateSetting('operating_hours_start', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label style={labelStyle}>Closing Time</label>
                <input type="time" value={settings['operating_hours_end'] ?? '22:30'} onChange={(e) => updateSetting('operating_hours_end', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label style={labelStyle}>Min Days to Book in Advance</label>
                <input type="number" min="1" max="30" value={settings['min_advance_days'] ?? '5'} onChange={(e) => updateSetting('min_advance_days', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label style={labelStyle}>Max Booking Hours</label>
                <input type="number" min="1" max="16" value={settings['max_booking_hours'] ?? '8'} onChange={(e) => updateSetting('max_booking_hours', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Warning Message (Booking Form)</label>
                <textarea value={settings['warning_message'] ?? ''} onChange={(e) => updateSetting('warning_message', e.target.value)} rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            </div>

            {/* Facilities */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
              <label style={{ ...labelStyle, marginBottom: '12px' }}>Mini Theater Facilities</label>
              {facilities.map((facility) => (
                <div key={facility.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '8px', border: '1px solid #f3f4f6',
                  marginBottom: '6px', background: '#f9fafb',
                }}>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{facility.name}</span>
                  <button
                    onClick={() => deleteFacility(facility.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
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
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Add new facility..."
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addFacility()}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <button
                  onClick={addFacility}
                  style={{ 
                    background: 'linear-gradient(135deg, #8B0000, #a50000)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    width: '42px', 
                    height: '42px', 
                    cursor: 'pointer', 
                    flexShrink: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>Equipment Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="equipment-grid">
              {[
                { 
                  label: 'Max Microphone', key: 'max_microphone',
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                },
                { 
                  label: 'Max Air-cond', key: 'max_aircond',
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>
                },
                { 
                  label: 'Max PA System', key: 'max_pa_system',
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                },
                { 
                  label: 'Max LCD Projector', key: 'max_lcd_projector',
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><path d="M17 2l-5 5-5-5"/></svg>
                },
              ].map((item) => (
                <div key={item.key}>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#9ca3af' }}>{item.icon}</span>
                    {item.label}
                  </label>
                  <input type="number" min="0" max="10" value={settings[item.key] ?? '1'} onChange={(e) => updateSetting(item.key, e.target.value)} style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>Notification Settings</h3>
            <label style={labelStyle}>Admin Email</label>
            <input type="email" value={settings['admin_email'] ?? ''} onChange={(e) => updateSetting('admin_email', e.target.value)} style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>This email will receive notifications for new bookings</p>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>Contact Us Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="settings-grid-2">
              <div>
                <label style={labelStyle}>Name</label>
                <input type="text" value={settings['contact_name'] ?? ''} onChange={(e) => updateSetting('contact_name', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input type="text" value={settings['contact_phone'] ?? ''} onChange={(e) => updateSetting('contact_phone', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={settings['contact_email'] ?? ''} onChange={(e) => updateSetting('contact_email', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label style={labelStyle}>Operating Hours</label>
                <input type="text" value={settings['contact_hours'] ?? ''} placeholder="e.g. 7:00 AM – 10:30 PM" onChange={(e) => updateSetting('contact_hours', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Address</label>
                <textarea value={settings['contact_address'] ?? ''} onChange={(e) => updateSetting('contact_address', e.target.value)} rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            </div>
          </div>
        )}

        {/* Blackout Dates Tab */}
        {activeTab === 'blackout' && (
          <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>Blackout Dates</h3>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>Set dates that cannot be booked — semester breaks, study weeks, etc.</p>
            </div>

            {/* Add form */}
            <div style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Add New Date</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }} className="blackout-grid">
                <div>
                  <label style={labelStyle}>Date</label>
                  <input
                    type="date"
                    value={newBlackout.date}
                    onChange={(e) => setNewBlackout(prev => ({ ...prev, date: e.target.value }))}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Reason (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Semester Break, Study Week"
                    value={newBlackout.reason}
                    onChange={(e) => setNewBlackout(prev => ({ ...prev, reason: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addBlackoutDate()}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                <button
                  onClick={addBlackoutDate}
                  disabled={loadingBlackout}
                  style={{
                    background: 'linear-gradient(135deg, #8B0000, #a50000)',
                    color: 'white', border: 'none', borderRadius: '8px',
                    padding: '10px 16px', fontSize: '13px', fontWeight: '600',
                    cursor: loadingBlackout ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    whiteSpace: 'nowrap', height: '42px',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Date
                </button>
              </div>
            </div>

            {/* List */}
            {blackoutDates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '13px', border: '2px dashed #f3f4f6', borderRadius: '10px' }}>
                No blackout dates. Add dates that are not available above.
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>{blackoutDates.length} dates blocked</p>
                {blackoutDates.map((b) => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: '8px', border: '1px solid #f3f4f6',
                    marginBottom: '6px', background: 'white', gap: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: '#fef2f2', border: '1px solid #fecaca',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                          {new Date(b.date + 'T00:00:00').toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        {b.reason && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>{b.reason}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteBlackoutDate(b.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      {activeTab !== 'admin' && activeTab !== 'blackout' && (
        <button
          onClick={saveAllSettings}
          disabled={saving}
          style={{
            width: '100%',
            marginTop: '16px',
            background: saving ? '#f3f4f6' : 'linear-gradient(135deg, #8B0000, #a50000)',
            color: saving ? '#9ca3af' : 'white',
            border: saving ? '1px solid #e5e7eb' : 'none',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '14px', fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: saving ? 'none' : '0 4px 16px rgba(139,0,0,0.25)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { if (!saving) e.currentTarget.style.boxShadow = '0 6px 24px rgba(139,0,0,0.35)' }}
          onMouseLeave={(e) => { if (!saving) e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,0,0,0.25)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      )}

      <style>{`
        @media (max-width: 600px) {
          .save-btn { width: 100% !important; justify-content: center !important; }
          .equipment-grid { grid-template-columns: 1fr !important; }
          .settings-grid-2 { grid-template-columns: 1fr !important; }
          .settings-grid-2 > div[style*="1 / -1"] { grid-column: 1 !important; }
          .blackout-grid { grid-template-columns: 1fr !important; }
        }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
      `}</style>
    </div>
  )
}