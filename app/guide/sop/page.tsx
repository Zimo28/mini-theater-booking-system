import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const metadata = { title: 'SOP - Unit Kebudayaan' }

export default async function SopPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('settings').select('value').eq('id', 'sop_content').single()
  const content = data?.value ?? ''

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Link href="/qr" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', textDecoration: 'none', marginBottom: '16px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Guide
        </Link>

        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>SOP / Operation Manual</h1>

        <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {content ? (
            <p style={{ fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{content}</p>
          ) : (
            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>SOP content has not been set up yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}