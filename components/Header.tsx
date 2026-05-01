import { createSupabaseServerClient } from '@/lib/supabase-server'
import HeaderClient from '@/components/HeaderClient'

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

  return <HeaderClient userName={userName} role={role} />
}