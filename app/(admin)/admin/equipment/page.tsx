import { createSupabaseServerClient } from '@/lib/supabase-server'
import EquipmentClient from './EquipmentClient'

export default async function EquipmentPage() {
  const supabase = await createSupabaseServerClient()

  const { data: equipment } = await supabase
    .from('equipment')
    .select('*, venues(name, code)')
    .order('code', { ascending: true })

  const { data: loans } = await supabase
    .from('equipment_loans')
    .select('*, equipment(code, name)')
    .order('created_at', { ascending: false })

  const { data: maintenance } = await supabase
    .from('equipment_maintenance')
    .select('*, equipment(code, name)')
    .order('reported_at', { ascending: false })

  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, code')
    .order('position', { ascending: true })

  return (
    <EquipmentClient
      equipment={equipment ?? []}
      loans={loans ?? []}
      maintenance={maintenance ?? []}
      venues={venues ?? []}
    />
  )
}