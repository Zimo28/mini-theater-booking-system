import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import TempahanClient from './TempahanClient'

export default async function TempahanPage() {
  const supabase = await createSupabaseServerClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TempahanClient bookings={bookings ?? []} />
    </Suspense>
  )
}