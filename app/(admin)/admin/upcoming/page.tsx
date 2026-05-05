import { supabase } from '@/lib/supabase'
import UpcomingClient from './UpcomingClient'

export default async function UpcomingPage() {
  const today = new Date()
  
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const { data } = await supabase
    .from('bookings')
    .select('*')
    .gte('booking_date', localDate)
    .in('status', ['approved', 'pending'])
    .order('booking_date', { ascending: true })

  return <UpcomingClient events={data ?? []} />
}