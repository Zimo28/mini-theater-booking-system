import Link from 'next/link'

export const metadata = { title: 'Unit Kebudayaan Guide' }

const tiles = [
  {
    href: '/guide/category/audio', label: 'Audio', desc: 'Mic, mixer, speaker',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    ),
  },
  {
    href: '/guide/category/video', label: 'Video', desc: 'Projector, HDMI, camera',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
  },
  {
    href: '/guide/category/lighting', label: 'Lighting', desc: 'DMX, controller',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.75.75 1.22 1.5 1.41 2.5"/>
      </svg>
    ),
  },
  {
    href: '/guide/category/power', label: 'Power', desc: 'Extension, adapter',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 9.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5"/><path d="M6 6v6"/><path d="M10 6v6"/><path d="M6 2v2"/><path d="M10 2v2"/>
      </svg>
    ),
  },
  {
    href: '/guide/category/tools', label: 'Tools', desc: 'Cable tie, spare parts',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    href: '/guide/sop', label: 'SOP', desc: 'Operation manual',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    href: '/booking', label: 'Booking', desc: 'Reserve the theater',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
]

export default function QrHubPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src="/logo.png" alt="Unit Kebudayaan" style={{ height: '48px', objectFit: 'contain', marginBottom: '12px' }} />
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', letterSpacing: '-0.3px' }}>Unit Kebudayaan Guide</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Scan a QR code or pick a category below</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {tiles.map(tile => (
            <Link
              key={tile.href}
              href={tile.href}
              style={{
                display: 'flex', flexDirection: 'column', gap: '10px',
                background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px',
                padding: '20px 16px', textDecoration: 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: '#fef2f2', color: '#8B0000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tile.icon}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{tile.label}</p>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{tile.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}