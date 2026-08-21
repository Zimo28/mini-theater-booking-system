import { createSupabaseServerClient } from '@/lib/supabase-server'
import PrintQrClient from './PrintQrClient'

export default async function PrintQrPage() {
  const supabase = await createSupabaseServerClient()
  const { data: equipment } = await supabase
    .from('equipment')
    .select('id, code, name, category')
    .order('code', { ascending: true })

  return <PrintQrClient equipment={equipment ?? []} />
}