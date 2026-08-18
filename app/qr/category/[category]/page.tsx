import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const categoryLabels: Record<string, string> = {
  audio: 'Audio',
  video: 'Video',
  lighting: 'Lighting',
  power: 'Power',
  tools: 'Tools',
  other: 'Other',
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const label = categoryLabels[category]
  if (!label) notFound()

  const supabase = await createSupabaseServerClient()
  const { data: items } = await supabase
    .from('equipment')
    .select('code, name, status, available_quantity, quantity')
    .eq('category', category)
    .order('code', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Link href="/qr" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', textDecoration: 'none', marginBottom: '16px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Guide
        </Link>

        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{label} Equipment</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Tap an item to view its manual and troubleshooting guide</p>

        {(!items || items.length === 0) ? (
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
            No {label.toLowerCase()} equipment registered yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map(item => (
              <Link
                key={item.code}
                href={`/qr/item/${item.code}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                  background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px',
                  padding: '14px 16px', textDecoration: 'none',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#8B0000', background: '#fef2f2', padding: '2px 8px', borderRadius: '999px', display: 'inline-block', marginBottom: '6px' }}>{item.code}</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{item.name}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}