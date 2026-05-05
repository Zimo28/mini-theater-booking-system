'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type BlackoutDate = { date: string; reason: string }

interface BlackoutCalendarProps {
  value: string
  onChange: (date: string) => void
  minDate?: string
  placeholder?: string
  isAdmin?: boolean // admin boleh pilih blackout date (dengan warning)
}

export default function BlackoutCalendar({
  value,
  onChange,
  minDate,
  placeholder = 'Pilih tarikh',
  isAdmin = false,
}: BlackoutCalendarProps) {
  const [open, setOpen] = useState(false)
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([])
  const [tooltip, setTooltip] = useState<{ date: string; reason: string; x: number; y: number } | null>(null)
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const ref = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('blackout_dates')
      .select('date, reason')
      .then(({ data }) => { if (data) setBlackoutDates(data) })
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setTooltip(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sync view to selected value
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  const blackoutMap = new Map(blackoutDates.map(b => [b.date, b.reason]))

  const isBlackout = (dateStr: string) => blackoutMap.has(dateStr)
  const isDisabled = (dateStr: string) => {
    if (minDate && dateStr < minDate) return true
    if (!isAdmin && isBlackout(dateStr)) return true
    return false
  }

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const toDateStr = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  const today = new Date().toISOString().split('T')[0]

  const MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']
  const DAYS = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab']

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const handleDayClick = (dateStr: string, e: React.MouseEvent) => {
    if (isDisabled(dateStr) && !isAdmin) return
    if (isBlackout(dateStr) && isAdmin) {
      // Admin gets a warning but can still pick
      const reason = blackoutMap.get(dateStr)
      if (!window.confirm(`⚠️ Tarikh ini adalah blackout date${reason ? ` (${reason})` : ''}.\nTeruskan sebagai admin?`)) return
    }
    onChange(dateStr)
    setOpen(false)
    setTooltip(null)
  }

  const handleDayHover = (dateStr: string, e: React.MouseEvent) => {
    if (isBlackout(dateStr)) {
      const rect = e.currentTarget.getBoundingClientRect()
      const calRect = calendarRef.current?.getBoundingClientRect()
      setTooltip({
        date: dateStr,
        reason: blackoutMap.get(dateStr) || 'Tarikh tidak tersedia',
        x: rect.left - (calRect?.left || 0) + rect.width / 2,
        y: rect.top - (calRect?.top || 0) - 4,
      })
    } else {
      setTooltip(null)
    }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: 'white',
          border: `1.5px solid ${open ? '#8B0000' : '#e5e7eb'}`,
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '14px',
          color: value ? '#111827' : '#9ca3af',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          transition: 'border-color 0.2s',
          boxShadow: open ? '0 0 0 3px rgba(139,0,0,0.08)' : 'none',
          textAlign: 'left',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div ref={calendarRef} style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 100,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '16px',
          minWidth: '300px',
          width: '100%',
        }}>
          {/* Tooltip */}
          {tooltip && (
            <div style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translate(-50%, -100%)',
              background: '#1f2937',
              color: 'white',
              fontSize: '11px',
              padding: '5px 10px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 200,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              {tooltip.reason}
              <div style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid #1f2937',
              }} />
            </div>
          )}

          {/* Header nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <button type="button" onClick={prevMonth} style={{
              background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px',
              width: '28px', height: '28px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#6b7280',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} style={{
              background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px',
              width: '28px', height: '28px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#6b7280',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '6px' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#9ca3af', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const dateStr = toDateStr(viewYear, viewMonth, day)
              const isSelected = dateStr === value
              const isToday = dateStr === today
              const blackout = isBlackout(dateStr)
              const disabled = isDisabled(dateStr)

              return (
                <div
                  key={dateStr}
                  onMouseEnter={(e) => handleDayHover(dateStr, e)}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={(e) => !disabled && handleDayClick(dateStr, e)}
                  style={{
                    position: 'relative',
                    textAlign: 'center',
                    padding: '6px 2px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: isSelected ? '700' : '400',
                    cursor: disabled && !isAdmin ? 'not-allowed' : (blackout && isAdmin ? 'pointer' : disabled ? 'not-allowed' : 'pointer'),
                    background: isSelected
                      ? '#8B0000'
                      : isToday && !isSelected
                      ? '#fef2f2'
                      : 'transparent',
                    color: isSelected
                      ? 'white'
                      : disabled && !blackout
                      ? '#d1d5db'
                      : blackout
                      ? '#8B0000'
                      : '#111827',
                    border: isToday && !isSelected ? '1px solid #fecaca' : '1px solid transparent',
                    transition: 'background 0.15s',
                    userSelect: 'none',
                    opacity: disabled && !blackout ? 0.4 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!disabled || (isAdmin && blackout)) {
                      const el = e.currentTarget
                      if (!isSelected) el.style.background = blackout ? '#fef2f2' : '#f3f4f6'
                    }
                  }}
                  onMouseOut={(e) => {
                    const el = e.currentTarget
                    if (!isSelected) el.style.background = isToday ? '#fef2f2' : 'transparent'
                  }}
                >
                  <span style={{
                    display: 'block',
                    textDecoration: blackout ? 'line-through' : 'none',
                    textDecorationColor: '#8B0000',
                    textDecorationThickness: '1.5px',
                  }}>
                    {day}
                  </span>
                  {/* Blackout dot indicator */}
                  {blackout && (
                    <span style={{
                      position: 'absolute',
                      bottom: '2px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: isSelected ? 'rgba(255,255,255,0.8)' : '#8B0000',
                      display: 'block',
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#6b7280' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#8B0000' }} />
              Dipilih
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#6b7280' }}>
              <span style={{ fontSize: '12px', textDecoration: 'line-through', color: '#8B0000', fontWeight: '600' }}>15</span>
              Blackout date
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#6b7280' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', border: '1px solid #fecaca', background: '#fef2f2' }} />
              Hari ini
            </div>
          </div>

          {blackoutDates.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
              {blackoutDates.length} tarikh diblok bulan ini
            </div>
          )}
        </div>
      )}
    </div>
  )
}