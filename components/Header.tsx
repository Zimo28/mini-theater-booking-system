import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function Header() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user?.id)
    .single()

  const userName = profile?.full_name ?? user?.email ?? 'Admin'
  const role = profile?.role ?? 'admin'

  return (
    <header style={{
      background: '#0a0a0a',
      borderBottom: '1px solid #1f1f1f',
      padding: '0 28px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '12px',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '6px 12px', borderRadius: '999px',
        background: '#161616', border: '1px solid #1f1f1f',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B0000, #a50000)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', color: 'white', fontWeight: '700',
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af' }}>{userName}</span>
        <span style={{
          background: 'rgba(139,0,0,0.2)', color: '#f87171',
          padding: '2px 8px', borderRadius: '999px',
          fontSize: '10px', fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          border: '1px solid rgba(139,0,0,0.3)',
        }}>
          {role}
        </span>
      </div>
    </header>
  )
}