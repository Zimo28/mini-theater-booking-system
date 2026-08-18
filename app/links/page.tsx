import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const metadata = { title: 'Unit Kebudayaan' }

export default async function LinksPage() {
  const supabase = await createSupabaseServerClient()
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, code')
    .eq('is_active', true)
    .order('position', { ascending: true })

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg, #1a0000 0%, #3d0000 35%, #f9fafb 35%)',
      padding: '48px 20px', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Profile header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="Unit Kebudayaan" style={{
            height: '64px', width: 'auto', objectFit: 'contain',
            filter: 'brightness(0) invert(1)', marginBottom: '16px',
          }} />
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>Unit Kebudayaan</h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            UiTM Cawangan Kelantan
          </p>
        </div>

        {/* Link buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/booking" style={linkButtonStyle('primary')}>
            <IconCalendar />
            <span>Buat Tempahan</span>
          </Link>

          <Link href="/#status" style={linkButtonStyle('white')}>
            <IconSearch />
            <span>Semak Status Tempahan</span>
          </Link>

          {venues && venues.length > 0 && (
            <>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '16px 4px 4px' }}>
                Tempah Ikut Venue
              </p>
              {venues.map(v => (
                <Link key={v.id} href={`/booking?venue=${v.code}`} style={linkButtonStyle('white')}>
                  <IconVenue />
                  <span>{v.name}</span>
                </Link>
              ))}
            </>
          )}

          <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '8px 4px' }} />

          <Link href="/qr" style={linkButtonStyle('white')}>
            <IconQr />
            <span>Panduan Equipment / SOP</span>
          </Link>

          <Link href="/login" style={linkButtonStyle('outline')}>
            <IconLock />
            <span>Admin Login</span>
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '32px' }}>
          © {new Date().getFullYear()} Sistem Tempahan Unit Kebudayaan
        </p>
      </div>
    </div>
  )
}

function linkButtonStyle(variant: 'primary' | 'white' | 'outline'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '15px 18px', borderRadius: '12px',
    fontSize: '14px', fontWeight: '600', textDecoration: 'none',
    transition: 'transform 0.15s, box-shadow 0.15s',
  }
  if (variant === 'primary') {
    return { ...base, background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', boxShadow: '0 4px 20px rgba(139,0,0,0.35)' }
  }
  if (variant === 'outline') {
    return { ...base, background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.25)' }
  }
  return { ...base, background: 'white', color: '#111827', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
}

function IconCalendar() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
function IconSearch() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}
function IconVenue() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
function IconQr() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="21" y1="14" x2="21" y2="14.01"/><line x1="14" y1="17.5" x2="17.5" y2="17.5"/><line x1="21" y1="21" x2="17.5" y2="21"/><line x1="17.5" y1="17.5" x2="17.5" y2="21"/></svg>
}
function IconLock() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
}