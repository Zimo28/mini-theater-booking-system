import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import BookingClient from './BookingClient'

export default async function BookingPage() {
  const supabase = await createSupabaseServerClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, venues(name, code)')
    .order('created_at', { ascending: false })

  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, code')
    .order('position', { ascending: true })

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingClient bookings={bookings ?? []} venues={venues ?? []} />
    </Suspense>
  )
}