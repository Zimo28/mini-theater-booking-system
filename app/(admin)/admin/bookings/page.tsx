import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import BookingClient from './BookingClient'

export default async function BookingPage() {
  const supabase = await createSupabaseServerClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingClient bookings={bookings ?? []} />
    </Suspense>
  )
}