'use client'

type Event = {
  id: string
  full_name: string
  organization: string
  event_name: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
}

const monthNames = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const monthShort = ['JAN','FEB','MAR','APR','MAY','JUN',
  'JUL','AUG','SEP','OCT','NOV','DEC']

export default function UpcomingClient({ events }: { events: Event[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href="/admin/dashboard" style={{
          color: '#6b7280', fontSize: '13px', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>← Dashboard</a>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>
          Upcoming Events
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          {events.length} event dalam 30 hari akan datang
        </p>
      </div>

      {events.length === 0 ? (
        <div style={{
          background: '#161616', border: '1px solid #1f1f1f', borderRadius: '14px',
          padding: '60px', textAlign: 'center'
        }}>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Tiada upcoming events</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {events.map((event) => {
            const date = new Date(event.booking_date + 'T00:00:00')
            const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            const isToday = diffDays === 0
            const isTomorrow = diffDays === 1

            return (
              <a
                key={event.id}
                href={`/admin/tempahan?id=${event.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px 20px', borderRadius: '12px',
                  background: isToday ? 'rgba(139,0,0,0.15)' : '#161616',
                  border: `1px solid ${isToday ? 'rgba(139,0,0,0.3)' : '#1f1f1f'}`,
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = isToday ? 'rgba(139,0,0,0.2)' : '#1a1a1a'}
                onMouseLeave={e => e.currentTarget.style.background = isToday ? 'rgba(139,0,0,0.15)' : '#161616'}
              >
                {/* Date Badge */}
                <div style={{
                  flexShrink: 0, width: '52px', textAlign: 'center',
                  background: isToday ? '#8B0000' : '#1a1a1a',
                  border: `1px solid ${isToday ? '#8B0000' : '#2d2d2d'}`,
                  borderRadius: '10px', padding: '8px 4px',
                }}>
                  <p style={{ fontSize: '20px', fontWeight: '800', color: 'white', lineHeight: 1 }}>
                    {date.getDate()}
                  </p>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: isToday ? 'rgba(255,255,255,0.7)' : '#6b7280', textTransform: 'uppercase' }}>
                    {monthShort[date.getMonth()]}
                  </p>
                </div>

                {/* Event Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                    {event.event_name}
                  </p>
                  <p style={{ fontSize: '13px', color: '#6b7280' }}>
                    {event.organization} · {event.start_time} - {event.end_time}
                  </p>
                  <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>
                    {event.full_name}
                  </p>
                </div>

                {/* Status + Days Badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                    background: event.status === 'approved' ? '#dc2626' : 'rgba(217,119,6,0.15)',
                    color: event.status === 'approved' ? 'white' : '#fbbf24',
                    border: event.status === 'approved' ? 'none' : '1px solid rgba(217,119,6,0.25)',
                  }}>
                    {event.status === 'approved' ? 'Approved' : 'Pending'}
                  </span>
                  <span style={{
                    padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600',
                    background: isToday ? '#8B0000' : isTomorrow ? 'rgba(217,119,6,0.15)' : '#1f1f1f',
                    color: isToday ? 'white' : isTomorrow ? '#fbbf24' : '#6b7280',
                    border: `1px solid ${isToday ? '#8B0000' : isTomorrow ? 'rgba(217,119,6,0.25)' : '#2d2d2d'}`,
                  }}>
                    {isToday ? 'Hari Ini' : isTomorrow ? 'Esok' : `${diffDays} hari lagi`}
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}