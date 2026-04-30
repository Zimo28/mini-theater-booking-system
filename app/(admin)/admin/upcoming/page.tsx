import { supabase } from '@/lib/supabase'
import UpcomingClient from './UpcomingClient'

export default async function UpcomingPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('bookings')
    .select('*')
    .gte('booking_date', today.toISOString().split('T')[0])
    .in('status', ['approved', 'pending'])
    .order('booking_date', { ascending: true })

  return <UpcomingClient events={data ?? []} />
}