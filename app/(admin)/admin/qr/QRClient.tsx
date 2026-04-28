'use client'

import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import { showToast } from '@/components/Toast'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function QRClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrUrl, setQrUrl] = useState('https://mini-theater-booking-system.vercel.app/booking')
  const [logo, setLogo] = useState<string | null>(null)
  const [logoSize, setLogoSize] = useState(60)
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [generated, setGenerated] = useState(false)

  // Load settings bila page open
  const loadSettings = async () => {
    const { data } = await supabase
      .from('qr_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (data) {
      if (data.logo_url) setLogo(data.logo_url)
      if (data.fg_color) setFgColor(data.fg_color)
      if (data.bg_color) setBgColor(data.bg_color)
      if (data.qr_url) setQrUrl(data.qr_url)
    }
  }

  // Save settings lepas upload logo
  const saveAllSettings = async (updates: Record<string, unknown>) => {
    await supabase
      .from('qr_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1)
  }
  
  const generateQR = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    await QRCode.toCanvas(canvas, qrUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: fgColor, light: bgColor },
    })

    if (logo) {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const img = new Image()
      img.src = logo
      img.onload = () => {
        const x = (canvas.width - logoSize) / 2
        const y = (canvas.height - logoSize) / 2
        ctx.fillStyle = bgColor
        ctx.fillRect(x - 6, y - 6, logoSize + 12, logoSize + 12)
        ctx.drawImage(img, x, y, logoSize, logoSize)
        setGenerated(true)
      }
    } else {
      setGenerated(true)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Upload ke Supabase Storage
    const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`
    
    const { data, error } = await supabase.storage
      .from('qr-logos')
      .upload(fileName, file, { upsert: true })

    if (error) {
      console.log('Full error:', JSON.stringify(error))
      showToast('Gagal upload logo', 'error')
      return
    }

    // Ambil public URL
    const { data: urlData } = supabase.storage
      .from('qr-logos')
      .getPublicUrl(data.path)

    setLogo(urlData.publicUrl)
    await saveAllSettings({ logo_url: urlData.publicUrl })
    showToast('Logo berjaya diupload!', 'success')
  }
  
  const handleRemoveLogo = async () => {
    if (!logo) return
    const fileName = logo.split('/').pop()
    await supabase.storage.from('qr-logos').remove([fileName!])
    
    await supabase
      .from('qr_settings')
      .update({ logo_url: null })
      .eq('id', 1)
    
    setLogo(null)
  }

  const downloadQR = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'mini-theater-qr.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    showToast('QR kod berjaya dimuat turun!', 'success')
  }

  useEffect(() => { loadSettings(), generateQR() }, [logo, logoSize, fgColor, bgColor])

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>
          QR Generator
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          Jana QR kod untuk booking form
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Settings Panel */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #f3f4f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
            Tetapan QR
          </h2>

          {/* URL */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              URL Booking Form
            </label>
            <input
              type="text"
              value={qrUrl}
              onChange={(e) => setQrUrl(e.target.value)}
              style={{
                width: '100%',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#111827',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#8B0000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              Tukar URL ni bila dah deploy ke Vercel
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={async () => {
                  await saveAllSettings({ qr_url: qrUrl })
                  showToast('URL berjaya disimpan!', 'success')
                }}
                style={{
                  background: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >Simpan URL</button>
            </div>
          </div>

          {/* Colors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Warna QR', value: fgColor, onChange: setFgColor },
              { label: 'Warna Background', value: bgColor, onChange: setBgColor },
            ].map((item) => (
              <div key={item.label}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {item.label}
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}>
                  <input
                    type="color"
                    value={item.value}
                    onChange={(e) => item.onChange(e.target.value)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      background: 'none',
                    }}
                  />
                  <span style={{ fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>{item.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Logo Upload */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Logo (Optional)
            </label>

            {logo ? (
              <div style={{
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={logo} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>Logo uploaded ✓</span>
                </div>
                <button
                  onClick={handleRemoveLogo}
                  style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >Buang</button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor = '#8B0000'
                  e.currentTarget.style.background = '#fef2f2'
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.background = 'transparent'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files?.[0]
                  if (!file) return
                  
                  // Simulate input change event
                  handleLogoUpload({ target: { files: [file] } } as any)
                }}
                style={{
                  border: '2px dashed #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', display: 'block' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                  Drag & drop logo atau{' '}
                  <label style={{ color: '#8B0000', fontWeight: '600', cursor: 'pointer' }}>
                    browse
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  </label>
                </p>
                <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '4px' }}>PNG, JPG, SVG</p>
                <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '2px' }}>Saiz disyorkan: 200×200px hingga 500×500px</p>
              </div>
            )}
          </div>

          {/* Logo Size */}
          {logo && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Saiz Logo: {logoSize}px
              </label>
              <input
                type="range"
                min="30"
                max="100"
                value={logoSize}
                onChange={(e) => setLogoSize(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#8B0000' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                <span>Kecil</span>
                <span>Besar</span>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={() => { generateQR(); showToast('QR kod berjaya dijana!', 'success') }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #8B0000, #a50000)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(139,0,0,0.2)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Generate QR
          </button>
        </div>

        {/* Preview Panel */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #f3f4f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: '24px',
          textAlign: 'center',
          position: 'sticky',
          top: '20px',
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Preview
          </h2>

          <div style={{
            display: 'inline-block',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #f3f4f6',
            background: bgColor,
            marginBottom: '16px',
          }}>
            <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '6px' }} />
          </div>

          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
            Scan QR ini untuk pergi ke booking form
          </p>

          {generated && (
            <button
              onClick={downloadQR}
              style={{
                width: '100%',
                background: '#111827',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download QR (PNG)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}