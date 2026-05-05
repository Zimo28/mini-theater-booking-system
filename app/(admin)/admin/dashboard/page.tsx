import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from '../DashboardClient'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }))
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const later = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
  const sevenDaysLater = `${later.getFullYear()}-${String(later.getMonth() + 1).padStart(2, '0')}-${String(later.getDate()).padStart(2, '0')}`
  const startOfMonth = new Date(
    new Date(now.getFullYear(), now.getMonth(), 1).toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' })
  ).toISOString()

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