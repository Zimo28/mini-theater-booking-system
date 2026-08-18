import { createSupabaseServerClient } from '@/lib/supabase-server'
import LinksClient from './LinksClient'

export default async function LinksPage() {
  const supabase = await createSupabaseServerClient()

  const { data: links } = await supabase
    .from('homepage_links')
    .select('*')
    .order('position', { ascending: true })

  return <LinksClient links={links ?? []} />
}