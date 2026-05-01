'use client'

import { useSidebar } from '@/components/SidebarContext'

export default function HeaderClient({ userName, role }: { userName: string; role: string }) {
  const { collapsed, setCollapsed } = useSidebar()

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #f3f4f6',
      padding: '0 28px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#6b7280', padding: '8px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#8B0000' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {collapsed
            ? <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
          }
        </svg>
      </button>

      {/* User Info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '6px 12px', borderRadius: '999px',
        background: '#f9fafb', border: '1px solid #f3f4f6',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B0000, #a50000)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', color: 'white', fontWeight: '700',
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{userName}</span>
        <span style={{
          background: '#fef2f2', color: '#8B0000',
          padding: '2px 8px', borderRadius: '999px',
          fontSize: '10px', fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          border: '1px solid #fecaca',
        }}>
          {role}
        </span>
      </div>
    </header>
  )
}