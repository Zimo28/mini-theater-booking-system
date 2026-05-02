import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from '../DashboardClient'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const todayStr = now.toISOString().split('T')[0]

  const [{ data: bookings }, { count: total }, { count: pending }, { count: approved }, { count: thisMonth }] = await Promise.all([
    supabase.from('bookings').select('*').order('booking_date'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
  ])

  const { data: upcoming } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'approved')
    .gte('booking_date', todayStr)
    .lte('booking_date', sevenDaysLater)
    .order('booking_date')

  return (
    <DashboardClient
      bookings={bookings ?? []}
      upcoming={upcoming ?? []}
      stats={{ total: total ?? 0, pending: pending ?? 0, approved: approved ?? 0, thisMonth: thisMonth ?? 0 }}
    />
  )
}