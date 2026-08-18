import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const categoryLabels: Record<string, string> = {
  audio: 'Audio', video: 'Video', lighting: 'Lighting', power: 'Power', tools: 'Tools', other: 'Other',
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export default async function EquipmentQrPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createSupabaseServerClient()

  const { data: item } = await supabase
    .from('equipment')
    .select('*, venues(name)')
    .eq('code', code.toUpperCase())
    .single()

  if (!item) notFound()

  const embedUrl = item.video_url ? getYouTubeEmbedUrl(item.video_url) : null
  const troubleshootingSteps: string[] = item.troubleshooting
    ? item.troubleshooting.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : []

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Link href={`/qr/category/${item.category}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', textDecoration: 'none', marginBottom: '16px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to {categoryLabels[item.category] ?? item.category}
        </Link>

        {/* Header card */}
        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#8B0000', background: '#fef2f2', padding: '3px 10px', borderRadius: '999px' }}>{item.code}</span>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginTop: '10px' }}>{item.name}</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {categoryLabels[item.category] ?? item.category}
            {item.venues?.name && ` · ${item.venues.name}`}
          </p>
        </div>

        {/* Manual */}
        {(item.manual_text || item.manual_url) && (
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>Manual</h2>
            {item.manual_text && (
              <p style={{ fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{item.manual_text}</p>
            )}
            {item.manual_url && (
              <a href={item.manual_url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#8B0000', textDecoration: 'none', marginTop: item.manual_text ? '10px' : '0' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Open full manual
              </a>
            )}
          </div>
        )}

        {/* Video */}
        {item.video_url && (
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>Video Tutorial</h2>
            {embedUrl ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '10px', overflow: 'hidden' }}>
                <iframe
                  src={embedUrl}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <a href={item.video_url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#8B0000', textDecoration: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                Watch video tutorial
              </a>
            )}
          </div>
        )}

        {/* Troubleshooting */}
        {troubleshootingSteps.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>Troubleshooting</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {troubleshootingSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{
                    flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%',
                    background: '#fef2f2', color: '#8B0000', fontSize: '11px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px',
                  }}>
                    {i + 1}
                  </span>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!item.manual_text && !item.manual_url && !item.video_url && troubleshootingSteps.length === 0 && (
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '32px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
            No guide content has been added for this item yet.
          </div>
        )}
      </div>
    </div>
  )
}