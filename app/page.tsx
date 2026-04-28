import LandingPage from './guest/LandingPage'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()

  const { data: bookingsData } = await supabase
    .from('bookings')
    .select('id, full_name, organization, event_name, booking_date, start_time, end_time, status')
    .in('status', ['approved', 'pending'])

  const { data: settingsData } = await supabase
    .from('settings')
    .select('*')

  const { data: facilitiesData } = await supabase
    .from('facilities')
    .select('*')
    .order('created_at', { ascending: true })

  const settings: Record<string, string> = {}
  settingsData?.forEach(s => { settings[s.id] = s.value })

  return (
    <LandingPage
      bookings={bookingsData ?? []}
      settings={settings}
      facilities={facilitiesData ?? []}
    />
  )
}