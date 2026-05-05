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

  // Declare todayStr once at the top
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Filter out past events
  const filteredEvents = events.filter(e => e.booking_date >= todayStr)

  // Group using filteredEvents
  const grouped = filteredEvents.reduce((acc, event) => {
    const date = new Date(event.booking_date + 'T00:00:00')
    const key = `${date.getFullYear()}-${date.getMonth()}`
    if (!acc[key]) acc[key] = { label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`, events: [] }
    acc[key].events.push(event)
    return acc
  }, {} as Record<string, { label: string; events: Event[] }>)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href="/admin" style={{
          color: '#9ca3af', fontSize: '13px', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '6px 10px', borderRadius: '6px', border: '1px solid #f3f4f6',
          background: 'white', transition: 'all 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#e5e7eb' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#f3f4f6' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Dashboard
        </a>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>
          Upcoming Events
        </h1>
        {/* Use filteredEvents.length for accurate count */}
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          {filteredEvents.length} event akan datang
        </p>
      </div>

      {/* Use filteredEvents for empty check */}
      {filteredEvents.length === 0 ? (
        <div style={{
          background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px',
          padding: '60px', textAlign: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Tiada upcoming events</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {Object.values(grouped).map((group) => (
            <div key={group.label}>
              {/* Month Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '13px', fontWeight: '700', color: '#8B0000',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {group.label}
                </span>
                <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
                <span style={{
                  fontSize: '11px', color: '#9ca3af', fontWeight: '500',
                  background: 'white', border: '1px solid #f3f4f6',
                  padding: '2px 8px', borderRadius: '999px',
                }}>
                  {group.events.length} event
                </span>
              </div>

              {/* Events */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.events.map((event) => {
                  const date = new Date(event.booking_date + 'T00:00:00')
                  // Use todayStr from outer scope — no duplicate declaration
                  const diffDays = Math.round(
                    (new Date(event.booking_date).setHours(12) - new Date(todayStr).setHours(12)) / (1000 * 60 * 60 * 24)
                  )
                  const isToday = diffDays === 0
                  const isTomorrow = diffDays === 1

                  return (
                    <a
                      key={event.id}
                      href={`/admin/tempahan?id=${event.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        padding: '16px 20px', borderRadius: '12px',
                        background: isToday ? '#fef2f2' : 'white',
                        border: `1px solid ${isToday ? '#fecaca' : '#f3f4f6'}`,
                        textDecoration: 'none', transition: 'all 0.15s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isToday ? '#fee2e2' : '#fafafa'
                        e.currentTarget.style.borderColor = isToday ? '#fca5a5' : '#e5e7eb'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isToday ? '#fef2f2' : 'white'
                        e.currentTarget.style.borderColor = isToday ? '#fecaca' : '#f3f4f6'
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                      }}
                    >
                      {/* Date Badge */}
                      <div style={{
                        flexShrink: 0, width: '52px', textAlign: 'center',
                        background: isToday ? '#8B0000' : 'white',
                        border: `1px solid ${isToday ? '#8B0000' : '#e5e7eb'}`,
                        borderRadius: '10px', padding: '8px 4px',
                      }}>
                        <p style={{ fontSize: '20px', fontWeight: '800', color: isToday ? 'white' : '#111827', lineHeight: 1 }}>
                          {date.getDate()}
                        </p>
                        <p style={{ fontSize: '10px', fontWeight: '600', color: isToday ? 'rgba(255,255,255,0.7)' : '#9ca3af', textTransform: 'uppercase' }}>
                          {monthShort[date.getMonth()]}
                        </p>
                      </div>

                      {/* Event Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.event_name}
                        </p>
                        <p style={{ fontSize: '13px', color: '#6b7280' }}>
                          {event.organization} · {event.start_time} - {event.end_time}
                        </p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                          {event.full_name}
                        </p>
                      </div>

                      {/* Status + Days Badge */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                          background: event.status === 'approved' ? '#dc2626' : '#fffbeb',
                          color: event.status === 'approved' ? 'white' : '#d97706',
                          border: event.status === 'approved' ? 'none' : '1px solid #fde68a',
                        }}>
                          {event.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                        <span style={{
                          padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600',
                          background: isToday ? '#8B0000' : isTomorrow ? '#fffbeb' : '#f3f4f6',
                          color: isToday ? 'white' : isTomorrow ? '#d97706' : '#6b7280',
                          border: `1px solid ${isToday ? '#8B0000' : isTomorrow ? '#fde68a' : '#e5e7eb'}`,
                        }}>
                          {isToday ? 'Hari Ini' : isTomorrow ? 'Esok' : `${diffDays} hari lagi`}
                        </span>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}