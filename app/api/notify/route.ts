import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramNotification } from '@/lib/telegram'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SlotLike = {
  booking_date: string
  start_time: string
  end_time: string
}

// Format senarai slot jadi teks — "15 Ogos (9:00-12:00), 16 Ogos (14:00-17:00)"
// Kalau single slot, cuma pulangkan satu baris biasa.
const formatSlotsText = (slots: SlotLike[]) => {
  if (slots.length === 1) {
    return `📅 <b>Tarikh:</b> ${slots[0].booking_date}\n🕐 <b>Masa:</b> ${slots[0].start_time} - ${slots[0].end_time}`
  }
  const lines = slots
    .map((s, i) => `   ${i + 1}. ${s.booking_date} (${s.start_time}-${s.end_time})`)
    .join('\n')
  return `📅 <b>Tarikh & Masa (${slots.length} slot):</b>\n${lines}`
}

// Normalize booking payload supaya boleh terima DUA bentuk:
// 1. Legacy/single-slot: { booking_date, start_time, end_time, id, ... }
// 2. Multi-slot: { slots: [...], groupId, ... } (tiada booking_date/id terus pada root)
const normalizeSlots = (booking: any): SlotLike[] => {
  if (Array.isArray(booking.slots) && booking.slots.length > 0) {
    return booking.slots.map((s: any) => ({
      booking_date: s.booking_date,
      start_time: s.start_time,
      end_time: s.end_time,
    }))
  }
  // fallback single-slot lama
  return [{
    booking_date: booking.booking_date,
    start_time: booking.start_time,
    end_time: booking.end_time,
  }]
}

const getReferenceId = (booking: any): string | undefined => {
  // multi-slot guna groupId, single-slot guna id
  return booking.groupId || booking.id
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, booking } = body

  let telegramMessage = ''
  let notification: { type: string; title: string; message: string; booking_id?: string } | null = null

  if (type === 'new_booking') {
    const slots = normalizeSlots(booking)
    const slotCount = slots.length

    telegramMessage = `
🔔 <b>Tempahan Baru!${slotCount > 1 ? ` (${slotCount} slot)` : ''}</b>

👤 <b>Nama:</b> ${booking.full_name}
🏢 <b>Organisasi:</b> ${booking.organization}
🎭 <b>Event:</b> ${booking.event_name}
${formatSlotsText(slots)}
📌 <b>Status:</b> Pending
    `.trim()

    notification = {
      type: 'new_booking',
      title: `Tempahan baru — ${booking.event_name}${slotCount > 1 ? ` (${slotCount} slot)` : ''}`,
      message: `${booking.full_name} · ${booking.organization} · ${slots[0].booking_date}${slotCount > 1 ? ` +${slotCount - 1} lagi` : ''}`,
      booking_id: getReferenceId(booking),
    }
  }

  if (type === 'status_changed') {
    const slots = normalizeSlots(booking)
    const slotCount = slots.length
    const emoji = booking.status === 'approved' ? '✅' : '❌'

    telegramMessage = `
${emoji} <b>Status Dikemaskini${slotCount > 1 ? ` (${slotCount} slot)` : ''}</b>

👤 <b>Nama:</b> ${booking.full_name}
🎭 <b>Event:</b> ${booking.event_name}
${formatSlotsText(slots)}
📌 <b>Status:</b> ${booking.status === 'approved' ? 'Diluluskan' : 'Ditolak'}
    `.trim()

    notification = {
      type: booking.status === 'approved' ? 'approved' : 'rejected',
      title: `Tempahan ${booking.status === 'approved' ? 'diluluskan' : 'ditolak'} — ${booking.event_name}${slotCount > 1 ? ` (${slotCount} slot)` : ''}`,
      message: `${booking.full_name} · ${slots[0].booking_date}${slotCount > 1 ? ` +${slotCount - 1} lagi` : ''}`,
      booking_id: getReferenceId(booking),
    }
  }

  if (type === 'admin_booking') {
    const slots = normalizeSlots(booking)
    const slotCount = slots.length

    telegramMessage = `
✅ <b>Tempahan Baru (Admin)${slotCount > 1 ? ` (${slotCount} slot)` : ''}</b>

👤 <b>Nama:</b> ${booking.full_name}
🏢 <b>Organisasi:</b> ${booking.organization}
🎭 <b>Event:</b> ${booking.event_name}
${formatSlotsText(slots)}
📌 <b>Status:</b> Diluluskan
    `.trim()

    notification = {
      type: 'approved',
      title: `Tempahan admin — ${booking.event_name}${slotCount > 1 ? ` (${slotCount} slot)` : ''}`,
      message: `${booking.full_name} · ${booking.organization} · ${slots[0].booking_date}${slotCount > 1 ? ` +${slotCount - 1} lagi` : ''}`,
      booking_id: getReferenceId(booking),
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