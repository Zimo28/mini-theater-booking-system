import { createSupabaseServerClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split('T')[0]

  const { data: upcoming } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'approved')
    .gte('booking_date', today)
    .lte('booking_date', nextWeekStr)
    .order('booking_date', { ascending: true })

  const total = bookings?.length ?? 0
  const pending = bookings?.filter(b => b.status === 'pending').length ?? 0
  const approved = bookings?.filter(b => b.status === 'approved').length ?? 0
  const thisMonth = bookings?.filter(b => {
    const date = new Date(b.booking_date)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length ?? 0

  return (
    <DashboardClient
      bookings={bookings ?? []}
      upcoming={upcoming ?? []}
      stats={{ total, pending, approved, thisMonth }}
    />
  )
}