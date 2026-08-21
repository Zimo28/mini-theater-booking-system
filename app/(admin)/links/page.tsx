import { createSupabaseServerClient } from '@/lib/supabase-server'
import LinksClient from './LinksClient'

export default async function LinksPage() {
  const supabase = await createSupabaseServerClient()

  const { data: links } = await supabase
    .from('homepage_links')
    .select('*')
    .order('position', { ascending: true })

  const { data: settingsData } = await supabase
    .from('settings')
    .select('id, value')
    .in('id', ['hero_title', 'hero_subtitle', 'hero_logo_url'])

  const settings: Record<string, string> = {}
  settingsData?.forEach(s => { settings[s.id] = s.value })

  return <LinksClient links={links ?? []} settings={settings} />
}