'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

type Facility = {
  id: string
  name: string
}

const DAYS = ['Ah', 'Is', 'Se', 'Ra', 'Kh', 'Ju', 'Sa']
const MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80',
  'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=800&q=80',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
  'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80',
  'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&q=80',
]

export default function LandingPage({
  bookings,
  settings,
  facilities,
}: {
  bookings: Booking[]
  settings: Record<string, string>
  facilities: Facility[]
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [today] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Booking[]>([])
  const [searched, setSearched] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeNav, setActiveNav] = useState('hero')
  const [mounted, setMounted] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [splashExit, setSplashExit] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => setSplashExit(true), 2200)
    const doneTimer = setTimeout(() => setSplashDone(true), 2800)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    const scrollTarget = sessionStorage.getItem('scrollTo')
    if (scrollTarget) {
      sessionStorage.removeItem('scrollTo')
      setTimeout(() => {
        document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      window.scrollTo(0, 0)
    }
    setTimeout(() => setMounted(true), 50)
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
      const sections = ['hero', 'availability', 'status', 'gallery', 'contact']
      const scrollY = window.scrollY + 100
      const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100
      if (isAtBottom) { setActiveNav('contact'); return }
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= scrollY) { setActiveNav(id); break }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const getDateStr = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  const getBookingsForDate = (date: Date) =>
    bookings.filter(b => b.booking_date === getDateStr(date))

  const getDateStatus = (date: Date) => {
    const dayBookings = bookings.filter(b => b.booking_date === getDateStr(date))
    if (dayBookings.some(b => b.status === 'approved')) return 'booked'
    if (dayBookings.some(b => b.status === 'pending')) return 'pending'
    return 'available'
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoadingSearch(true)
    setSearched(true)
    const { data } = await supabase
      .from('bookings')
      .select('id, full_name, organization, event_name, booking_date, start_time, end_time, status')
      .ilike('full_name', `%${searchQuery}%`)
    setSearchResults(data || [])
    setLoadingSearch(false)
  }

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)
  const selectedBookings = getBookingsForDate(selectedDate)

  const statusConfig = (status: string) => {
    if (status === 'approved') return { label: 'Approved', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }
    if (status === 'rejected') return { label: 'Rejected', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
    return { label: 'Pending', bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })

  const navLinks = [
    { label: 'Home', id: 'hero' },
    { label: 'Jadual', id: 'availability' },
    { label: 'Semakan', id: 'status' },
    { label: 'Galeri', id: 'gallery' },
    { label: 'Hubungi', id: 'contact' },
  ]

  const sectionCard = {
    background: 'white',
    border: '1px solid #f3f4f6',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#111827', background: '#f9fafb', minHeight: '100vh' }}>

      {/* ── SPLASH SCREEN ── */}
      {!splashDone && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: splashExit ? 'none' : 'all',
          overflow: 'hidden',
        }}>
          {/* Left curtain */}
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: '50%', height: '100%',
            background: 'white',
            transform: splashExit ? 'translateX(-100%)' : 'translateX(0)',
            transition: 'transform 0.7s cubic-bezier(0.76, 0, 0.24, 1)',
            zIndex: 2,
          }} />

          {/* Right curtain */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '50%', height: '100%',
            background: 'white',
            transform: splashExit ? 'translateX(100%)' : 'translateX(0)',
            transition: 'transform 0.7s cubic-bezier(0.76, 0, 0.24, 1)',
            zIndex: 2,
          }} />

          {/* Content — above curtain */}
          <div style={{
            position: 'relative', zIndex: 3,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            opacity: splashExit ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}>
            {/* Logo */}
            <div style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.7s ease',
              marginBottom: '20px',
            }}>
              <img
                src="/logo.png"
                alt="Mini Theater"
                style={{
                  height: '80px', width: 'auto', objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 24px rgba(139,0,0,0.15))',
                }}
              />
            </div>

            {/* Tagline */}
            <div style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(12px)',
              transition: 'all 0.7s ease 0.2s',
              textAlign: 'center', marginBottom: '32px',
            }}>
              <p style={{
                fontSize: '12px', fontWeight: '600', color: '#9ca3af',
                letterSpacing: '0.2em', textTransform: 'uppercase',
              }}>
                UiTM Cawangan Kelantan
              </p>
            </div>

            {/* Progress bar container */}
            <div style={{
              width: '120px', height: '2px',
              background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden',
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.5s ease 0.3s',
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #8B0000, #a50000)',
                borderRadius: '999px',
                animation: 'splashProgress 1.8s ease forwards',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid #f3f4f6' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 28px',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Mini Theater"
            style={{
              height: '42px', width: 'auto', objectFit: 'contain', cursor: 'pointer',
              filter: scrolled ? 'none' : 'brightness(0) invert(1)',
              opacity: 0.9,
              transition: 'filter 0.3s',
            }}
          />
        </a>

        {/* Desktop Nav */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navLinks.map(link => (
            <button key={link.id} onClick={() => scrollTo(link.id)} style={{
              background: activeNav === link.id
                ? scrolled ? '#fef2f2' : 'rgba(139,0,0,0.25)'
                : 'none',
              border: activeNav === link.id
                ? scrolled ? '1px solid #fecaca' : '1px solid rgba(139,0,0,0.4)'
                : '1px solid transparent',
              color: activeNav === link.id
                ? '#8B0000'
                : scrolled ? '#6b7280' : 'rgba(255,255,255,0.75)',
              fontWeight: activeNav === link.id ? '600' : '400',
              fontSize: '13px', cursor: 'pointer',
              padding: '7px 14px', borderRadius: '8px',
              transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => {
                if (activeNav !== link.id) {
                  e.currentTarget.style.background = scrolled ? '#f9fafb' : 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = scrolled ? '#374151' : 'white'
                }
              }}
              onMouseLeave={(e) => {
                if (activeNav !== link.id) {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = scrolled ? '#6b7280' : 'rgba(255,255,255,0.75)'
                }
              }}
            >{link.label}</button>
          ))}

          <a href="/login" style={{
            fontSize: '12px', color: scrolled ? '#9ca3af' : 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
            padding: '6px 12px', borderRadius: '6px',
            border: scrolled ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '8px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#6b7280'
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.background = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = scrolled ? '#9ca3af' : 'rgba(255,255,255,0.5)'
              e.currentTarget.style.borderColor = scrolled ? '#e5e7eb' : 'rgba(255,255,255,0.2)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Admin
          </a>

          <a href="/booking" style={{
            background: 'linear-gradient(135deg, #8B0000, #a50000)',
            color: 'white', textDecoration: 'none', border: 'none',
            borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: '600',
            marginLeft: '4px', boxShadow: '0 2px 12px rgba(139,0,0,0.3)',
            transition: 'all 0.2s',
          }}>Tempah Sekarang</a>
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: scrolled ? '#374151' : 'white',
          display: 'none',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 99,
          background: 'white', borderBottom: '1px solid #f3f4f6',
          padding: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          animation: 'menuSlideDown 0.2s ease',
        }}>
          {navLinks.map((link, i) => (
            <button key={link.id} onClick={() => scrollTo(link.id)} style={{
              display: 'flex', width: '100%', background: 'none', border: 'none',
              fontSize: '14px', fontWeight: '500', color: '#6b7280',
              cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', textAlign: 'left',
              alignItems: 'center', gap: '10px',
              animation: `menuItemFade 0.3s ease ${i * 0.05}s both`,
              transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fef2f2'
                e.currentTarget.style.color = '#8B0000'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8B0000', flexShrink: 0 }} />
              {link.label}
            </button>
          ))}
          <div style={{ height: '1px', background: '#f3f4f6', margin: '8px 0' }} />
          <a href="/login" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px', color: '#9ca3af',
            fontSize: '13px', fontWeight: '500', textDecoration: 'none',
            borderRadius: '8px', transition: 'all 0.15s',
            animation: 'menuItemFade 0.3s ease 0.25s both',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb'
              e.currentTarget.style.color = '#6b7280'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = '#9ca3af'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Admin Login
          </a>
          <a href="/booking" style={{
            display: 'block', background: 'linear-gradient(135deg, #8B0000, #a50000)',
            color: 'white', textDecoration: 'none', borderRadius: '8px',
            padding: '13px 16px', fontSize: '14px', fontWeight: '600', marginTop: '8px',
            textAlign: 'center', boxShadow: '0 2px 12px rgba(139,0,0,0.2)',
            animation: 'menuItemFade 0.3s ease 0.3s both',
          }}>Tempah Sekarang →</a>
        </div>
      )}

      {/* ── HERO ── */}
      <section id="hero" style={{
        position: 'relative', height: '100vh', minHeight: '600px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=1600&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.35)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(139,0,0,0.3) 0%, transparent 70%)',
        }} />

        <div style={{
          position: 'relative', textAlign: 'center', color: 'white',
          padding: '0 24px', maxWidth: '680px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.8s ease',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(139,0,0,0.2)', border: '1px solid rgba(139,0,0,0.4)',
            borderRadius: '999px', padding: '5px 14px',
            fontSize: '11px', fontWeight: '600', color: '#fecaca',
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '24px',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fca5a5' }} />
            UiTM Cawangan Kelantan
          </div>

          <h1 style={{
            fontSize: '60px', fontWeight: '800', letterSpacing: '-2px',
            marginBottom: '16px', lineHeight: 1.05,
            textShadow: '0 2px 40px rgba(0,0,0,0.5)',
          }}>
            {settings['hero_title'] ?? 'Mini Theater'}
          </h1>
          <p style={{ fontSize: '17px', opacity: 0.7, marginBottom: '40px', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 40px' }}>
            {settings['hero_subtitle'] ?? 'Tempah mini theater untuk acara anda dengan mudah dan pantas'}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('status')} style={{
              background: 'linear-gradient(135deg, #8B0000, #a50000)',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '13px 32px', fontSize: '14px', fontWeight: '700',
              cursor: 'pointer', boxShadow: '0 4px 24px rgba(139,0,0,0.4)',
              transition: 'all 0.2s',
            }}>Tempah Sekarang →</button>
            <button onClick={() => scrollTo('availability')} style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px', padding: '13px 32px', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>Semak Ketersediaan</button>
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.08em',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          textTransform: 'uppercase',
        }}>
          <span>Tatal ke bawah</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </section>

      {/* ── AVAILABILITY ── */}
      <section id="availability" style={{ padding: '96px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '999px', padding: '4px 12px',
              fontSize: '11px', fontWeight: '600', color: '#8B0000',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
            }}>Jadual</div>
            <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              Semak Ketersediaan
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Pilih tarikh untuk semak slot yang tersedia</p>
          </div>

          <div className="avail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Calendar */}
            <div style={{ ...sectionCard }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: '‹', fn: () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)) },
                    { label: '›', fn: () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)) },
                  ].map(btn => (
                    <button key={btn.label} onClick={btn.fn} style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      border: '1.5px solid #e5e7eb', background: 'white',
                      color: '#6b7280', cursor: 'pointer', fontSize: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{btn.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#9ca3af', padding: '4px 0' }}>{d}</div>)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                  const status = getDateStatus(date)
                  const isToday = date.toDateString() === today.toDateString()
                  const isSelected = date.toDateString() === selectedDate.toDateString()
                  return (
                    <button key={day} onClick={() => setSelectedDate(date)} style={{
                      width: '100%', aspectRatio: '1', borderRadius: '7px', border: 'none',
                      background: isSelected ? '#8B0000'
                        : status === 'booked' ? '#fee2e2'
                        : status === 'pending' ? '#fef9c3'
                        : isToday ? '#f3f4f6'
                        : 'transparent',
                      color: isSelected ? 'white'
                        : status === 'booked' ? '#dc2626'
                        : status === 'pending' ? '#d97706'
                        : '#374151',
                      cursor: 'pointer', fontSize: '12px',
                      fontWeight: isToday || isSelected ? '700' : '400',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', transition: 'all 0.15s',
                    }}>
                      {day}
                      {(status === 'booked' || status === 'pending') && (
                        <span style={{
                          position: 'absolute', bottom: '3px', left: '50%', transform: 'translateX(-50%)',
                          width: '14px', height: '2px', borderRadius: '2px',
                          background: isSelected ? 'white' : status === 'booked' ? '#dc2626' : '#d97706',
                          display: 'block',
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
                {[
                  { color: 'transparent', border: '#e5e7eb', label: 'Tersedia' },
                  { color: '#fef9c3', border: '#e5e7eb', label: 'Pending' },
                  { color: '#fee2e2', border: '#e5e7eb', label: 'Ditempah' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '11px', height: '11px', borderRadius: '3px', background: item.color, border: `1px solid ${item.border}` }} />
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected date info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ ...sectionCard, flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '14px' }}>
                  {selectedDate.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {selectedBookings.length === 0 ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a', marginBottom: '4px' }}>✓ Slot Tersedia</p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Tiada tempahan pada tarikh ini</p>
                  </div>
                ) : (
                  selectedBookings.map(b => {
                    const cfg = statusConfig(b.status)
                    return (
                      <div key={b.id} style={{ border: `1px solid ${cfg.border}`, borderRadius: '10px', padding: '12px 14px', background: cfg.bg, marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>{b.event_name}</p>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: cfg.color, background: 'white', padding: '2px 8px', borderRadius: '999px', border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{b.start_time} – {b.end_time}</p>
                      </div>
                    )
                  })
                )}
              </div>

              <div style={{ ...sectionCard }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Waktu Operasi
                </p>
                {[
                  { label: 'Setiap Hari', value: `${settings['operating_hours_start'] ?? '07:00'} – ${settings['operating_hours_end'] ?? '22:30'}` },
                  { label: 'Cuti Umum / Study Week / Semester Break', value: 'Tutup' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f9fafb', fontSize: '12px' }}>
                    <span style={{ color: '#6b7280' }}>{item.label}</span>
                    <span style={{ fontWeight: '600', color: item.value === 'Tutup' ? '#dc2626' : '#111827' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATUS ── */}
      <section id="status" style={{ padding: '96px 24px', background: 'white' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '999px', padding: '4px 12px',
              fontSize: '11px', fontWeight: '600', color: '#8B0000',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
            }}>Semakan</div>
            <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              Semak Status Tempahan
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Masukkan nama penuh untuk semak status tempahan anda</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Masukkan nama penuh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1, background: 'white', border: '1.5px solid #e5e7eb',
                borderRadius: '10px', padding: '12px 16px', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box', color: '#111827', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#8B0000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <button onClick={handleSearch} disabled={loadingSearch} style={{
              background: loadingSearch ? '#f3f4f6' : 'linear-gradient(135deg, #8B0000, #a50000)',
              color: loadingSearch ? '#9ca3af' : 'white',
              border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600',
              cursor: loadingSearch ? 'not-allowed' : 'pointer',
              boxShadow: loadingSearch ? 'none' : '0 2px 12px rgba(139,0,0,0.2)',
            }}>{loadingSearch ? '...' : 'Cari'}</button>
          </div>

          {searched && (
            searchResults.length === 0 ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px', fontSize: '14px', color: '#dc2626', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Tiada rekod untuk "<strong>{searchQuery}</strong>"
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchResults.map(b => {
                  const cfg = statusConfig(b.status)
                  return (
                    <div key={b.id} style={{ border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.color}`, borderRadius: '10px', padding: '16px', background: cfg.bg }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>{b.full_name}</p>
                          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{b.organization}</p>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '600', background: 'white', color: cfg.color, padding: '3px 12px', borderRadius: '999px', border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {formatDate(b.booking_date)}
                        <span style={{ color: '#e5e7eb' }}>|</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {b.start_time} – {b.end_time}
                      </p>
                      <p style={{ fontSize: '13px', color: cfg.color, fontWeight: '500', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {b.status === 'approved' && (<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Tempahan telah diluluskan.</>)}
                        {b.status === 'pending' && (<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Sedang dalam semakan admin.</>)}
                        {b.status === 'rejected' && (<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Tidak diluluskan. Sila hubungi admin.</>)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </section>

      {/* ── BOOKING CTA ── */}
      <section id="booking-cta" style={{
        padding: '96px 24px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(145deg, #1a0000 0%, #3d0000 40%, #8B0000 100%)',
        textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div style={{ position: 'relative', maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '38px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', marginBottom: '12px' }}>
            Sedia Untuk Membuat Tempahan?
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '36px', lineHeight: 1.7 }}>
            Isi borang tempahan kami dan kami akan mengesahkan dalam masa 24 jam.
          </p>
          <a href="/booking" style={{
            display: 'inline-block', background: 'white', color: '#8B0000',
            textDecoration: 'none', borderRadius: '10px', padding: '14px 40px',
            fontSize: '15px', fontWeight: '700', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>Buat Tempahan Sekarang →</a>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section id="gallery" style={{ padding: '96px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '999px', padding: '4px 12px',
              fontSize: '11px', fontWeight: '600', color: '#8B0000',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
            }}>Galeri</div>
            <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              Lihat Kemudahan Kami
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Fasiliti mini theater yang lengkap dan selesa</p>
          </div>

          <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {GALLERY_IMAGES.map((src, i) => (
              <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <img src={src} alt={`Gallery ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
            ))}
          </div>

          {facilities.length > 0 && (
            <div style={{ marginTop: '48px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px', textAlign: 'center' }}>
                Kemudahan Tersedia
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {facilities.map(f => (
                  <div key={f.id} style={{
                    background: 'white', borderRadius: '10px', padding: '12px 16px',
                    border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '13px', color: '#374151', fontWeight: '500',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#8B0000', flexShrink: 0 }} />
                    {f.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding: '96px 24px', background: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '999px', padding: '4px 12px',
              fontSize: '11px', fontWeight: '600', color: '#8B0000',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
            }}>Hubungi</div>
            <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              Hubungi Kami
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Ada pertanyaan? Jangan segan untuk menghubungi kami</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                label: 'Nama', value: settings['contact_name'] ?? '-',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>,
                label: 'Telefon', value: settings['contact_phone'] ?? '-',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                label: 'Email', value: settings['contact_email'] ?? '-',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                label: 'Waktu Operasi', value: settings['contact_hours'] ?? '7:00 AM – 10:30 PM',
              },
            ].map((item) => (
              <div key={item.label} style={{
                background: '#f9fafb', borderRadius: '14px', padding: '24px',
                border: '1px solid #f3f4f6', textAlign: 'center',
                transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#fecaca'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(139,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#f3f4f6'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{
                  width: '44px', height: '44px', background: '#fef2f2',
                  borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px', border: '1px solid #fecaca',
                }}>{item.icon}</div>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</p>
                <p style={{ fontSize: '13px', color: '#374151', fontWeight: '500', lineHeight: 1.5, wordBreak: 'break-all' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: '#111827', borderTop: '1px solid #1f2937',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <img src="/logo.png" alt="Mini Theater" style={{
            height: '40px', width: 'auto', objectFit: 'contain',
            display: 'block', margin: '0 auto 14px',
            filter: 'brightness(0) invert(1)', opacity: 0.5,
          }} />
          <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '6px' }}>
            {settings['theater_name'] ?? 'Mini Theater'} — {settings['contact_address'] ?? ''}
          </p>
          <p style={{ fontSize: '11px', color: '#374151' }}>
            © {new Date().getFullYear()} Mini Theater Booking System. All rights reserved.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes menuSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes menuItemFade {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes splashProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .avail-grid { grid-template-columns: 1fr !important; }
          .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .gallery-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}