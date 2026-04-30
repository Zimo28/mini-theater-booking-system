import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramNotification } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, booking } = body

  let message = ''

  if (type === 'new_booking') {
    message = `
🔔 <b>Tempahan Baru!</b>

👤 <b>Nama:</b> ${booking.full_name}
🏢 <b>Organisasi:</b> ${booking.organization}
🎭 <b>Event:</b> ${booking.event_name}
📅 <b>Tarikh:</b> ${booking.booking_date}
🕐 <b>Masa:</b> ${booking.start_time} - ${booking.end_time}
📌 <b>Status:</b> Pending
    `.trim()
  }

  if (type === 'status_changed') {
    const emoji = booking.status === 'approved' ? '✅' : '❌'
    message = `
${emoji} <b>Status Dikemaskini</b>

👤 <b>Nama:</b> ${booking.full_name}
🎭 <b>Event:</b> ${booking.event_name}
📅 <b>Tarikh:</b> ${booking.booking_date}
📌 <b>Status:</b> ${booking.status === 'approved' ? 'Diluluskan' : 'Ditolak'}
    `.trim()
  }

  if (type === 'admin_booking') {
  message = `
✅ <b>Tempahan Baru (Admin)</b>

👤 <b>Nama:</b> ${booking.full_name}
🏢 <b>Organisasi:</b> ${booking.organization}
🎭 <b>Event:</b> ${booking.event_name}
📅 <b>Tarikh:</b> ${booking.booking_date}
🕐 <b>Masa:</b> ${booking.start_time} - ${booking.end_time}
📌 <b>Status:</b> Diluluskan
  `.trim()
  }

  await sendTelegramNotification(message)
  return NextResponse.json({ ok: true })
}