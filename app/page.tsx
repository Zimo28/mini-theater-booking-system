import { createSupabaseServerClient } from '@/lib/supabase-server'

export const metadata = { title: 'Unit Kebudayaan' }

type Link = {
  id: string
  title: string
  url: string
  icon_key: string
  style: 'primary' | 'default' | 'social'
}

function LinkIcon({ iconKey }: { iconKey: string }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (iconKey) {
    case 'calendar': return <svg {...common} fill="none" stroke="currentColor" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'search': return <svg {...common} fill="none" stroke="currentColor" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    case 'borrow': return <svg {...common} fill="none" stroke="currentColor" style={{ flexShrink: 0 }}><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
    case 'qr': return <svg {...common} fill="none" stroke="currentColor" style={{ flexShrink: 0 }}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="21" y1="14" x2="21" y2="14.01"/><line x1="14" y1="17.5" x2="17.5" y2="17.5"/><line x1="21" y1="21" x2="17.5" y2="21"/><line x1="17.5" y1="17.5" x2="17.5" y2="21"/></svg>
    case 'lock': return <svg {...common} fill="none" stroke="currentColor" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    case 'instagram': return <svg {...common} fill="none" stroke="currentColor" style={{ flexShrink: 0 }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
    case 'facebook': return <svg {...common} fill="currentColor" style={{ flexShrink: 0 }}><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>
    case 'youtube': return <svg {...common} fill="none" stroke="currentColor" style={{ flexShrink: 0 }}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
    case 'x': return <svg {...common} fill="currentColor" style={{ flexShrink: 0 }}><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-6.5L4.4 22H1.2l8.1-9.3L1 2h7l4.9 5.9L18.9 2zm-1.2 18h1.7L6.4 4H4.6L17.7 20z"/></svg>
    default: return <svg {...common} fill="none" stroke="currentColor" style={{ flexShrink: 0 }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  }
}

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('homepage_links')
    .select('id, title, url, icon_key, style')
    .eq('is_active', true)
    .order('position', { ascending: true })

  const links: Link[] = data ?? []
  const socialLinks = links.filter(l => l.style === 'social')
  const primaryLink = links.find(l => l.style === 'primary')
  const otherLinks = links.filter(l => l.style !== 'social' && l.id !== primaryLink?.id)

  return (
    <div style={{
      minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif",
      background: `
        linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px),
        #f9fafb
      `,
      backgroundSize: '36px 36px, 36px 36px, auto',
    }}>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', minHeight: '48vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', padding: '56px 20px',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=1600&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.4)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(26,0,0,0.35) 0%, rgba(26,0,0,0.6) 65%, #f9fafb 100%)',
        }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            display: 'inline-block', background: 'white', borderRadius: '16px',
            padding: '14px 20px', marginBottom: '18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}>
            <img src="/logo.png" alt="Unit Kebudayaan" style={{
              height: '56px', width: 'auto', objectFit: 'contain', display: 'block',
            }} />
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
            Unit Kebudayaan
          </h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>
            UiTM Cawangan Kelantan
          </p>

          {socialLinks.length > 0 && (
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '24px' }}>
              {socialLinks.map(s => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.title} style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                }}>
                  <LinkIcon iconKey={s.icon_key} />
                </a>
              ))}
            </div>
          )}

          {primaryLink && (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={primaryLink.url} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', textDecoration: 'none',
                borderRadius: '10px', padding: '13px 26px', fontSize: '14px', fontWeight: '700',
                boxShadow: '0 4px 24px rgba(139,0,0,0.45)',
              }}>
                <LinkIcon iconKey={primaryLink.icon_key} /> {primaryLink.title}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── LINK LIST ── */}
      <section style={{ padding: '8px 20px 56px', maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {otherLinks.map(link => (
            <a key={link.id} href={link.url} style={utilityCardStyle}>
              <div style={{ ...utilityIconWrap, background: '#fef2f2', color: '#8B0000' }}>
                <LinkIcon iconKey={link.icon_key} />
              </div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>{link.title}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '28px 20px', textAlign: 'center', borderTop: '1px solid #f3f4f6' }}>
        <p style={{ fontSize: '11px', color: '#9ca3af' }}>
          © {new Date().getFullYear()} Sistem Tempahan Unit Kebudayaan
        </p>
      </footer>
    </div>
  )
}

const utilityCardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '12px',
  background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px',
  padding: '16px', textDecoration: 'none',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
}

const utilityIconWrap: React.CSSProperties = {
  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}