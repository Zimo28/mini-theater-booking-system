import { supabase } from '@/lib/supabase'
import UpcomingClient from './UpcomingClient'

export default async function UpcomingPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in30Days = new Date(today)
  in30Days.setDate(today.getDate() + 30)

  const { data } = await supabase
    .from('bookings')
    .select('*')
    .gte('booking_date', today.toISOString().split('T')[0])
    .lte('booking_date', in30Days.toISOString().split('T')[0])
    .in('status', ['approved', 'pending'])
    .order('booking_date', { ascending: true })

  return <UpcomingClient events={data ?? []} />
}