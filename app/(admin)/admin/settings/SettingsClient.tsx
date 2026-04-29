'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'
import AdminAccountSection from '@/components/AdminAccountSection'

type Facility = {
  id: string
  name: string
}

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
    id: 'admin', label: 'Admin Account',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const saveAllSettings = async () => {
    setSaving(true)
    const entries = Object.entries(settings).map(([id, value]) => ({
      id, value, updated_at: new Date().toISOString()
    }))
    const { error } = await supabase.from('settings').upsert(entries)
    if (!error) showToast('Tetapan berjaya disimpan!', 'success')
    else showToast('Ralat semasa menyimpan.', 'error')
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

  const inputStyle = {
    width: '100%',
    border: '1px solid #1f1f1f',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#e5e7eb',
    background: '#111111',
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
    background: '#161616',
    border: '1px solid #1f1f1f',
    borderRadius: '12px',
    overflow: 'hidden' as const,
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>Settings</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Manage system configurations</p>
        </div>
        {activeTab !== 'admin' && (
          <button
            onClick={saveAllSettings}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #8B0000, #a50000)',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '10px 20px', fontSize: '13px', fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(139,0,0,0.3)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '2px', marginBottom: '24px',
        background: '#161616', padding: '4px', borderRadius: '10px',
        border: '1px solid #1f1f1f', overflowX: 'auto',
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
              color: activeTab === tab.id ? 'white' : '#4b5563',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '7px',
              flex: 1, justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'rgba(139,0,0,0.15)'
                e.currentTarget.style.color = '#f87171'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#4b5563'
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
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>System Settings</h3>

            {/* Google Sheet */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #1f1f1f' }}>
              <label style={labelStyle}>Google Sheet URL</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/..."
                  value={settings['google_sheet_url'] ?? ''}
                  onChange={(e) => updateSetting('google_sheet_url', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'}
                  onBlur={(e) => e.target.style.borderColor = '#1f1f1f'}
                />
                {settings['google_sheet_url'] && (
                  <a
                    href={settings['google_sheet_url']} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #1f2937', background: '#1a1a1a', fontSize: '13px', fontWeight: '600', color: '#9ca3af', textDecoration: 'none', flexShrink: 0 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Buka
                  </a>
                )}
              </div>
            </div>

            {/* Theater Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Nama Theater', key: 'theater_name', col: '1 / -1', type: 'text' },
                { label: 'Hero Title', key: 'hero_title', col: '1 / -1', type: 'text' },
              ].map(item => (
                <div key={item.key} style={{ gridColumn: item.col }}>
                  <label style={labelStyle}>{item.label}</label>
                  <input type={item.type} value={settings[item.key] ?? ''} onChange={(e) => updateSetting(item.key, e.target.value)} style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
                </div>
              ))}

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Hero Subtitle</label>
                <textarea value={settings['hero_subtitle'] ?? ''} onChange={(e) => updateSetting('hero_subtitle', e.target.value)} rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
              </div>

              <div>
                <label style={labelStyle}>Masa Buka</label>
                <input type="time" value={settings['operating_hours_start'] ?? '07:00'} onChange={(e) => updateSetting('operating_hours_start', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
              </div>
              <div>
                <label style={labelStyle}>Masa Tutup</label>
                <input type="time" value={settings['operating_hours_end'] ?? '22:30'} onChange={(e) => updateSetting('operating_hours_end', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
              </div>
              <div>
                <label style={labelStyle}>Min Hari Tempah Awal</label>
                <input type="number" min="1" max="30" value={settings['min_advance_days'] ?? '5'} onChange={(e) => updateSetting('min_advance_days', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
              </div>
              <div>
                <label style={labelStyle}>Max Jam Tempahan</label>
                <input type="number" min="1" max="16" value={settings['max_booking_hours'] ?? '8'} onChange={(e) => updateSetting('max_booking_hours', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Warning Message (Booking Form)</label>
                <textarea value={settings['warning_message'] ?? ''} onChange={(e) => updateSetting('warning_message', e.target.value)} rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
              </div>
            </div>

            {/* Facilities */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1f1f1f' }}>
              <label style={{ ...labelStyle, marginBottom: '12px' }}>Mini Theater Facilities</label>
              {facilities.map((facility) => (
                <div key={facility.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '8px', border: '1px solid #1f1f1f',
                  marginBottom: '6px', background: '#111111',
                }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>{facility.name}</span>
                  <button
                    onClick={() => deleteFacility(facility.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
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
                  onBlur={(e) => e.target.style.borderColor = '#1f1f1f'}
                />
                <button
                  onClick={addFacility}
                  style={{ background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', border: 'none', borderRadius: '8px', width: '42px', height: '42px', fontSize: '20px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >+</button>
              </div>
            </div>
          </div>
        )}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>Equipment Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: '🎤 Max Microphone', key: 'max_microphone' },
                { label: '❄️ Max Air-cond', key: 'max_aircond' },
                { label: '🔊 Max PA System', key: 'max_pa_system' },
                { label: '📽️ Max LCD Projector', key: 'max_lcd_projector' },
              ].map((item) => (
                <div key={item.key}>
                  <label style={labelStyle}>{item.label}</label>
                  <input type="number" min="0" max="10" value={settings[item.key] ?? '1'} onChange={(e) => updateSetting(item.key, e.target.value)} style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>Notification Settings</h3>
            <label style={labelStyle}>Admin Email</label>
            <input type="email" value={settings['admin_email'] ?? ''} onChange={(e) => updateSetting('admin_email', e.target.value)} style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
            <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>Email ini akan menerima notifikasi tempahan baru</p>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>Contact Us Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={settings['contact_email'] ?? ''} onChange={(e) => updateSetting('contact_email', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input type="text" value={settings['contact_phone'] ?? ''} onChange={(e) => updateSetting('contact_phone', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Address</label>
                <textarea value={settings['contact_address'] ?? ''} onChange={(e) => updateSetting('contact_address', e.target.value)} rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Operating Hours</label>
                <input type="text" value={settings['contact_hours'] ?? ''} onChange={(e) => updateSetting('contact_hours', e.target.value)} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#8B0000'} onBlur={(e) => e.target.style.borderColor = '#1f1f1f'} />
              </div>
            </div>
          </div>
        )}

        {/* Admin Account Tab */}
        {activeTab === 'admin' && (
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>Admin Account</h3>
            <AdminAccountSection />
          </div>
        )}
      </div>
    </div>
  )
}