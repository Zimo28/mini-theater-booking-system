'use client'

import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type Booking = {
  id: string
  full_name: string
  organization: string
  event_name: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
}

type Upcoming = {
  id: string
  full_name: string
  organization: string
  event_name: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
}

type Stats = {
  total: number
  pending: number
  approved: number
  thisMonth: number
}

const IconDocument = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const IconCheck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

// Helper: get todayStr in local time
function getTodayStr() {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

// Helper: diff in days between two YYYY-MM-DD strings (positive = future)
function diffDaysFromToday(dateStr: string, todayStr: string) {
  return Math.round(
    (new Date(dateStr).setHours(12) - new Date(todayStr).setHours(12)) / (1000 * 60 * 60 * 24)
  )
}

function MonthlyTrendChart({ bookings }: { bookings: Booking[] }) {
  const today = new Date()
  const months: { label: string; year: number; month: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push({
      label: d.toLocaleDateString('en', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    })
  }

  const data = months.map(m => {
    const total = bookings.filter(b => {
      const d = new Date(b.booking_date + 'T00:00:00')
      return d.getFullYear() === m.year && d.getMonth() === m.month
    })
    return {
      name: m.label,
      Total: total.length,
      Approved: total.filter(b => b.status === 'approved').length,
      Pending: total.filter(b => b.status === 'pending').length,
      Rejected: total.filter(b => b.status === 'rejected').length,
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white', border: '1px solid #f3f4f6',
          borderRadius: '10px', padding: '12px 16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          fontSize: '13px',
        }}>
          <p style={{ fontWeight: '700', color: '#111827', marginBottom: '8px' }}>{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
              <span style={{ color: '#6b7280' }}>{entry.name}:</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const totalBookings = bookings.length
  const approvedCount = bookings.filter(b => b.status === 'approved').length
  const maxMonth = Math.max(...data.map(d => d.Total))

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Booking Trends
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>12 months ago</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { color: '#8B0000', label: 'Total' },
            { color: '#16a34a', label: 'Approved' },
            { color: '#f59e0b', label: 'Pending' },
            { color: '#f87171', label: 'Rejected' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B0000" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#8B0000" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="Total" stroke="#8B0000" strokeWidth={2} fill="url(#totalGrad)"
            dot={{ fill: 'white', stroke: '#8B0000', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: '#8B0000' }} />
          <Area type="monotone" dataKey="Approved" stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4 2"
            fill="url(#approvedGrad)" dot={{ fill: 'white', stroke: '#16a34a', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: '#16a34a' }} />
          <Area type="monotone" dataKey="Pending" stroke="#f59e0b" strokeWidth={1.5} fill="none"
            dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
          <Area type="monotone" dataKey="Rejected" stroke="#f87171" strokeWidth={1.5} fill="none"
            dot={false} activeDot={{ r: 4, fill: '#f87171' }} />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: '24px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
        {[
          { label: 'Average / month', value: (totalBookings / 12).toFixed(1) },
          { label: 'Highest month', value: maxMonth },
          { label: 'Approval rate', value: totalBookings > 0 ? `${Math.round((approvedCount / totalBookings) * 100)}%` : '0%' },
        ].map(item => (
          <div key={item.label}>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>{item.label}</p>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardClient({
  bookings,
  upcoming,
  stats,
}: {
  bookings: Booking[]
  upcoming: Upcoming[]
  stats: Stats
}) {
  const today = new Date()

  // Declare todayStr once — used everywhere in this component
  const todayStr = getTodayStr()

  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr)

  const statsConfig = [
    { label: 'Total Bookings', value: stats.total, Icon: IconDocument, bg: '#3b82f6' },
    { label: 'Pending Approval', value: stats.pending, Icon: IconClock, bg: '#f59e0b' },
    { label: 'Approved', value: stats.approved, Icon: IconCheck, bg: '#22c55e' },
    { label: 'This Month', value: stats.thisMonth, Icon: IconCalendar, bg: '#8B0000' },
  ]

  const getBookingsForDate = (dateStr: string) =>
    bookings.filter(b => b.booking_date === dateStr && b.status !== 'rejected')

  const getDateStatus = (dateStr: string) => {
    const dayBookings = getBookingsForDate(dateStr)
    if (dayBookings.length === 0) return null
    if (dayBookings.some(b => b.status === 'approved')) return 'booked'
    if (dayBookings.some(b => b.status === 'pending')) return 'pending'
    return null
  }

  const getDaysInMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevDays = new Date(year, month, 0).getDate()
    return { firstDay, daysInMonth, prevDays }
  }

  const { firstDay, daysInMonth, prevDays } = getDaysInMonth(currentMonth, currentYear)

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDate(null)
  }

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDate(null)
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const formatDate = (day: number) => {
    const month = String(currentMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${currentYear}-${month}-${d}`
  }

  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : []

  const formatSelectedDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const day = date.getDate()
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'
    return `${monthNames[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`
  }

  const card = {
    background: 'white',
    border: '1px solid #f3f4f6',
    borderRadius: '14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          Manage bookings and monitor theater availability
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }} className="stats-grid">
        {statsConfig.map((stat) => (
          <div key={stat.label} style={{
            ...card,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{stat.label}</p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827', lineHeight: 1 }}>{stat.value}</p>
            </div>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: stat.bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <stat.Icon />
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div style={{ ...card, overflow: 'hidden', marginBottom: '20px' }}>
        <MonthlyTrendChart bookings={bookings} />
      </div>

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <div style={{ ...card, overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{
            padding: '16px 24px', borderBottom: '1px solid #f3f4f6',
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>Upcoming Events</h2>
              <span style={{ background: '#fef2f2', color: '#8B0000', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', border: '1px solid #fecaca' }}>
                7 hari akan datang
              </span>
            </div>
            <a href="/admin/upcoming" style={{ fontSize: '13px', color: '#8B0000', fontWeight: '500', textDecoration: 'none' }}>
              See all →
            </a>
          </div>

          <div style={{ padding: '16px' }}>
            {upcoming.map((event) => {
              const date = new Date(event.booking_date + 'T00:00:00')
              // Use shared todayStr and helper — no duplicate calculation
              const diff = diffDaysFromToday(event.booking_date, todayStr)
              const isToday = diff === 0
              const isTomorrow = diff === 1

              return (
                <div key={event.id} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '12px 16px', borderRadius: '10px', marginBottom: '8px',
                  background: isToday ? '#fef2f2' : '#fafafa',
                  border: `1px solid ${isToday ? '#fecaca' : '#f3f4f6'}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    flexShrink: 0, width: '48px', textAlign: 'center',
                    background: isToday ? '#8B0000' : 'white',
                    border: `1px solid ${isToday ? '#8B0000' : '#e5e7eb'}`,
                    borderRadius: '10px', padding: '6px 4px',
                  }}>
                    <p style={{ fontSize: '18px', fontWeight: '800', color: isToday ? 'white' : '#111827', lineHeight: 1 }}>{date.getDate()}</p>
                    <p style={{ fontSize: '10px', fontWeight: '600', color: isToday ? 'rgba(255,255,255,0.7)' : '#9ca3af', textTransform: 'uppercase' }}>
                      {date.toLocaleDateString('en', { month: 'short' })}
                    </p>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>{event.event_name}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{event.organization} · {event.start_time} - {event.end_time}</p>
                  </div>

                  <span style={{
                    flexShrink: 0, padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                    background: isToday ? '#8B0000' : isTomorrow ? '#fffbeb' : '#f3f4f6',
                    color: isToday ? 'white' : isTomorrow ? '#d97706' : '#6b7280',
                    border: `1px solid ${isToday ? '#8B0000' : isTomorrow ? '#fde68a' : '#e5e7eb'}`,
                  }}>
                    {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : `${diff} days left`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Calendar Section */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>Mini Theater Availability</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr' }} className="calendar-grid">
          {/* Calendar */}
          <div style={{ padding: '20px', borderRight: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button onClick={prevMonth} style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '16px' }}>‹</button>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{monthNames[currentMonth]} {currentYear}</span>
              <button onClick={nextMonth} style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '16px' }}>›</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
              {dayNames.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#9ca3af', padding: '4px 0' }}>{d}</div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`prev-${i}`} style={{ aspectRatio: '1', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#d1d5db' }}>
                  {prevDays - firstDay + i + 1}
                </div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = formatDate(day)
                const status = getDateStatus(dateStr)
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = status === 'booked'
                          ? '#fecaca'
                          : status === 'pending'
                          ? '#fde68a'
                          : '#f3f4f6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isToday
                          ? '#f3f4f6'
                          : status === 'booked'
                          ? '#fee2e2'
                          : status === 'pending'
                          ? '#fef9c3'
                          : 'transparent'
                      }
                    }}
                    style={{
                      aspectRatio: '1', width: '100%', fontSize: '13px',
                      borderRadius: '8px', border: 'none', cursor: 'pointer',
                      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      background: isSelected
                        ? '#111827'
                        : isToday
                        ? '#f3f4f6'
                        : status === 'booked'
                        ? '#fee2e2'
                        : status === 'pending'
                        ? '#fef9c3'
                        : 'transparent',
                      color: isSelected
                        ? 'white'
                        : status === 'booked'
                        ? '#dc2626'
                        : status === 'pending'
                        ? '#d97706'
                        : '#374151',
                      fontWeight: isSelected ? '600' : isToday ? '700' : '400',
                    }}
                  >
                    {day}
                    {status && (
                      <span style={{
                        position: 'absolute', bottom: '3px', left: '50%', transform: 'translateX(-50%)',
                        width: '16px', height: '2px', borderRadius: '2px',
                        background: isSelected ? 'white' : status === 'booked' ? '#dc2626' : '#d97706',
                        display: 'block',
                      }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '420px' }}>
            <div style={{ padding: '24px 28px 16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                {selectedDate ? formatSelectedDate(selectedDate) : 'Select a date'}
              </h3>
            </div>

            <div style={{ flex: 1, padding: '0 28px 24px' }}>
              {!selectedDate ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af' }}>Select a date</p>
                  <p style={{ fontSize: '13px', color: '#d1d5db', marginTop: '4px' }}>Click pada tarikh untuk lihat tempahan</p>
                </div>
              ) : selectedBookings.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>Slot Available</p>
                  <p style={{ fontSize: '13px', color: '#9ca3af' }}>No approved bookings for this date.</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                    {selectedBookings.some(b => b.status === 'approved') ? 'Scheduled approved events:' : 'Pending approval:'}
                  </p>
                  {selectedBookings.map((booking) => {
                    const isApproved = booking.status === 'approved'
                    return (
                      <a
                        key={booking.id}
                        href={`/admin/bookings?id=${booking.id}`}
                        style={{
                          display: 'block',
                          border: `1px solid ${isApproved ? '#fecaca' : '#fde68a'}`,
                          borderRadius: '10px', padding: '14px 16px', marginBottom: '10px',
                          background: isApproved ? '#fef2f2' : '#fffbeb',
                          textDecoration: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isApproved ? '#fee2e2' : '#fef9c3'}
                        onMouseLeave={(e) => e.currentTarget.style.background = isApproved ? '#fef2f2' : '#fffbeb'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                            {booking.start_time} – {booking.end_time}
                          </span>
                          <span style={{
                            padding: '3px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700',
                            background: isApproved ? '#dc2626' : '#d97706', color: 'white',
                          }}>
                            {isApproved ? 'Booked' : 'Pending'}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: isApproved ? '#8B0000' : '#d97706', marginBottom: '10px' }}>
                          {booking.event_name}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#6b7280', alignItems: 'center' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          </svg>
                          <span>{booking.full_name}</span>
                          <span>·</span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                          <span>{booking.organization}</span>
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Operating Hours */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Operating Hours</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#6b7280' }}>Everyday:</span>
                <span style={{ color: '#111827', fontWeight: '500' }}>7:00 AM - 10:30 PM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', gap: '16px' }}>
                <span style={{ color: '#6b7280' }}>Special Holidays / Semester Break / Study Week:</span>
                <span style={{ color: '#dc2626', fontWeight: '600', flexShrink: 0 }}>Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .calendar-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-grid > div { padding: 14px 16px !important; }
        }
      `}</style>
    </div>
  )
}