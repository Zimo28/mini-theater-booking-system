import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramNotification } from '@/lib/telegram'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, booking } = body

  let telegramMessage = ''
  let notification: { type: string; title: string; message: string; booking_id?: string } | null = null

  if (type === 'new_booking') {
    telegramMessage = `
🔔 <b>Tempahan Baru!</b>

👤 <b>Nama:</b> ${booking.full_name}
🏢 <b>Organisasi:</b> ${booking.organization}
🎭 <b>Event:</b> ${booking.event_name}
📅 <b>Tarikh:</b> ${booking.booking_date}
🕐 <b>Masa:</b> ${booking.start_time} - ${booking.end_time}
📌 <b>Status:</b> Pending
    `.trim()

    notification = {
      type: 'new_booking',
      title: `Tempahan baru — ${booking.event_name}`,
      message: `${booking.full_name} · ${booking.organization} · ${booking.booking_date}`,
      booking_id: booking.id,
    }
  }

  if (type === 'status_changed') {
    const emoji = booking.status === 'approved' ? '✅' : '❌'
    telegramMessage = `
${emoji} <b>Status Dikemaskini</b>

👤 <b>Nama:</b> ${booking.full_name}
🎭 <b>Event:</b> ${booking.event_name}
📅 <b>Tarikh:</b> ${booking.booking_date}
📌 <b>Status:</b> ${booking.status === 'approved' ? 'Diluluskan' : 'Ditolak'}
    `.trim()

    notification = {
      type: booking.status === 'approved' ? 'approved' : 'rejected',
      title: `Tempahan ${booking.status === 'approved' ? 'diluluskan' : 'ditolak'} — ${booking.event_name}`,
      message: `${booking.full_name} · ${booking.booking_date}`,
      booking_id: booking.id,
    }
  }

  if (type === 'admin_booking') {
    telegramMessage = `
✅ <b>Tempahan Baru (Admin)</b>

👤 <b>Nama:</b> ${booking.full_name}
🏢 <b>Organisasi:</b> ${booking.organization}
🎭 <b>Event:</b> ${booking.event_name}
📅 <b>Tarikh:</b> ${booking.booking_date}
🕐 <b>Masa:</b> ${booking.start_time} - ${booking.end_time}
📌 <b>Status:</b> Diluluskan
    `.trim()

    notification = {
      type: 'approved',
      title: `Tempahan admin — ${booking.event_name}`,
      message: `${booking.full_name} · ${booking.organization} · ${booking.booking_date}`,
      booking_id: booking.id,
    }
  }

  if (type === 'blackout_added') {
    notification = {
      type: 'blackout',
      title: `Blackout date ditambah — ${booking.date}`,
      message: booking.reason || 'Tarikh tidak tersedia',
    }
  }

  // Insert to notifications table
  if (notification) {
    await supabase.from('notifications').insert([notification])
  }

  // Send Telegram (only for booking-related types)
  if (telegramMessage) {
    await sendTelegramNotification(telegramMessage)
  }

  return NextResponse.json({ ok: true })
}