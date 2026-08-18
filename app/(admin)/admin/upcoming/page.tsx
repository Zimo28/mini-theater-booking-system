import { supabase } from '@/lib/supabase'
import UpcomingClient from './UpcomingClient'

export default async function UpcomingPage() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }))
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const { data } = await supabase
    .from('bookings')
    .select('*, venues(name, code)')
    .gte('booking_date', localDate)
    .in('status', ['approved', 'pending'])
    .order('booking_date', { ascending: true })

  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, code')
    .order('position', { ascending: true })

  return <UpcomingClient events={data ?? []} venues={venues ?? []} />
}