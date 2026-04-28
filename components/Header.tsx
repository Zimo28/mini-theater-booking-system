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
      background: 'white',
      borderBottom: '1px solid #f3f4f6',
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
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 12px',
        borderRadius: '999px',
        background: '#f9fafb',
        border: '1px solid #f3f4f6',
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B0000, #a50000)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: 'white',
          fontWeight: '700',
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{userName}</span>
        <span style={{
          background: '#fef2f2',
          color: '#8B0000',
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '10px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {role}
        </span>
      </div>
    </header>
  )
}