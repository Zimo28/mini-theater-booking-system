import { createSupabaseServerClient } from '@/lib/supabase-server'
  import SettingsClient from './SettingsClient'

  export default async function SettingsPage() {
    const supabase = await createSupabaseServerClient()

    const { data: settings } = await supabase
      .from('settings')
      .select('*')

    const { data: facilities } = await supabase
      .from('facilities')
      .select('*')
      .order('position', { ascending: true })

    const { data: venues } = await supabase
      .from('venues')
      .select('*')
      .order('position', { ascending: true })

    const settingsMap: Record<string, string> = {}
    settings?.forEach(s => { settingsMap[s.id] = s.value })

    return (
      <SettingsClient
        settings={settingsMap}
        facilities={facilities ?? []}
        venues={venues ?? []}
      />
    )
  }