'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'

type Link = {
  id: string
  title: string
  url: string
  icon_key: string
  style: 'primary' | 'default' | 'social'
  is_active: boolean
  position: number
}

const iconOptions = [
  { key: 'calendar', label: 'Calendar' },
  { key: 'search', label: 'Search' },
  { key: 'borrow', label: 'Borrow' },
  { key: 'qr', label: 'QR' },
  { key: 'lock', label: 'Lock' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'link', label: 'Generic Link' },
]

function LinkIcon({ iconKey, size = 16 }: { iconKey: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (iconKey) {
    case 'calendar': return <svg {...common} fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'search': return <svg {...common} fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    case 'borrow': return <svg {...common} fill="none" stroke="currentColor"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
    case 'qr': return <svg {...common} fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="21" y1="14" x2="21" y2="14.01"/><line x1="14" y1="17.5" x2="17.5" y2="17.5"/><line x1="21" y1="21" x2="17.5" y2="21"/><line x1="17.5" y1="17.5" x2="17.5" y2="21"/></svg>
    case 'lock': return <svg {...common} fill="none" stroke="currentColor"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    case 'instagram': return <svg {...common} fill="none" stroke="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
    case 'facebook': return <svg {...common} fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>
    case 'youtube': return <svg {...common} fill="none" stroke="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
    case 'x': return <svg {...common} fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-6.5L4.4 22H1.2l8.1-9.3L1 2h7l4.9 5.9L18.9 2zm-1.2 18h1.7L6.4 4H4.6L17.7 20z"/></svg>
    default: return <svg {...common} fill="none" stroke="currentColor"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  }
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', color: '#111827', background: 'white',
}

export default function LinksClient({ links: initialLinks }: { links: Link[] }) {
  const [links, setLinks] = useState(initialLinks)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState({ title: '', url: '', icon_key: 'link', style: 'default' as Link['style'] })
  const [showAdd, setShowAdd] = useState(false)
  const [newLink, setNewLink] = useState({ title: '', url: '', icon_key: 'link', style: 'default' as Link['style'] })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const toggleActive = async (link: Link) => {
    const { error } = await supabase.from('homepage_links').update({ is_active: !link.is_active }).eq('id', link.id)
    if (!error) {
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l))
    } else {
      showToast('Error updating link.', 'error')
    }
  }

  const startEdit = (link: Link) => {
    setEditingId(link.id)
    setEditValue({ title: link.title, url: link.url, icon_key: link.icon_key, style: link.style })
  }

  const saveEdit = async (id: string) => {
    if (!editValue.title.trim() || !editValue.url.trim()) { setEditingId(null); return }
    const patch = { title: editValue.title.trim(), url: editValue.url.trim(), icon_key: editValue.icon_key, style: editValue.style }
    const { error } = await supabase.from('homepage_links').update(patch).eq('id', id)
    if (!error) {
      setLinks(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
      showToast('Link updated!', 'success')
    } else {
      showToast('Error updating link.', 'error')
    }
    setEditingId(null)
  }

  const addLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      showToast('Please fill in title and URL.', 'error'); return
    }
    const { data, error } = await supabase
      .from('homepage_links')
      .insert([{ ...newLink, title: newLink.title.trim(), url: newLink.url.trim(), is_active: true, position: links.length }])
      .select()
      .single()
    if (!error && data) {
      setLinks(prev => [...prev, data])
      setNewLink({ title: '', url: '', icon_key: 'link', style: 'default' })
      setShowAdd(false)
      showToast('Link added!', 'success')
    } else {
      showToast('Error adding link.', 'error')
    }
  }

  const handleDeleteClick = (id: string) => {
    if (confirmDeleteId === id) {
      deleteLink(id)
      setConfirmDeleteId(null)
      return
    }
    setConfirmDeleteId(id)
    setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 3000)
  }

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from('homepage_links').delete().eq('id', id)
    if (!error) {
      setLinks(prev => prev.filter(l => l.id !== id))
      showToast('Link deleted.', 'success')
    } else {
      showToast('Error deleting link.', 'error')
    }
  }

  const handleDragStart = (index: number) => setDraggedIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    const reordered = [...links]
    const [moved] = reordered.splice(draggedIndex, 1)
    reordered.splice(index, 0, moved)
    setDraggedIndex(index)
    setLinks(reordered)
  }
  const handleDragEnd = async () => {
    setDraggedIndex(null)
    const updates = links.map((l, index) => ({ id: l.id, title: l.title, url: l.url, position: index }))
    const { error } = await supabase.from('homepage_links').upsert(updates)
    if (error) showToast('Error saving order.', 'error')
    else showToast('Order updated!', 'success')
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>
      {/* Left: manager */}
      <div>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>Homepage Links</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Drag untuk susun semula, toggle untuk sorok/papar, klik pensel untuk edit.</p>
        </div>

        <button
          onClick={() => setShowAdd(v => !v)}
          style={{ background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px' }}
        >
          + Add Link
        </button>

        {showAdd && (
          <div style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input type="text" value={newLink.title} onChange={(e) => setNewLink(p => ({ ...p, title: e.target.value }))} style={inputStyle} placeholder="cth: TikTok" />
              </div>
              <div>
                <label style={labelStyle}>URL</label>
                <input type="text" value={newLink.url} onChange={(e) => setNewLink(p => ({ ...p, url: e.target.value }))} style={inputStyle} placeholder="https://..." />
              </div>
              <div>
                <label style={labelStyle}>Icon</label>
                <select value={newLink.icon_key} onChange={(e) => setNewLink(p => ({ ...p, icon_key: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {iconOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Style</label>
                <select value={newLink.style} onChange={(e) => setNewLink(p => ({ ...p, style: e.target.value as Link['style'] }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="default">Default (card)</option>
                  <option value="primary">Primary (highlight merah)</option>
                  <option value="social">Social (icon bulat)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addLink} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setShowAdd(false)} style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {links.map((link, index) => {
            const isEditing = editingId === link.id
            return (
              <div
                key={link.id}
                draggable={!isEditing}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  background: draggedIndex === index ? '#fef2f2' : 'white',
                  border: '1px solid #f3f4f6', borderRadius: '12px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                  opacity: draggedIndex === index ? 0.6 : (link.is_active ? 1 : 0.5),
                  cursor: isEditing ? 'default' : 'grab',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                </svg>

                {isEditing ? (
                  <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
                    <input value={editValue.title} onChange={(e) => setEditValue(p => ({ ...p, title: e.target.value }))} style={{ ...inputStyle, flex: 1, minWidth: '120px' }} />
                    <input value={editValue.url} onChange={(e) => setEditValue(p => ({ ...p, url: e.target.value }))} style={{ ...inputStyle, flex: 1, minWidth: '140px' }} />
                    <select value={editValue.icon_key} onChange={(e) => setEditValue(p => ({ ...p, icon_key: e.target.value }))} style={{ ...inputStyle, width: '130px', cursor: 'pointer' }}>
                      {iconOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                    <select value={editValue.style} onChange={(e) => setEditValue(p => ({ ...p, style: e.target.value as Link['style'] }))} style={{ ...inputStyle, width: '130px', cursor: 'pointer' }}>
                      <option value="default">Default</option>
                      <option value="primary">Primary</option>
                      <option value="social">Social</option>
                    </select>
                    <button onClick={() => saveEdit(link.id)} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                      background: link.style === 'primary' ? '#fef2f2' : '#f3f4f6',
                      color: link.style === 'primary' ? '#8B0000' : '#374151',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <LinkIcon iconKey={link.icon_key} />
                    </div>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>{link.title}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</p>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '999px',
                      background: link.style === 'primary' ? '#fef2f2' : link.style === 'social' ? '#eff6ff' : '#f3f4f6',
                      color: link.style === 'primary' ? '#8B0000' : link.style === 'social' ? '#2563eb' : '#6b7280',
                      textTransform: 'uppercase',
                    }}>{link.style}</span>

                    <button
                      onClick={() => toggleActive(link)}
                      style={{
                        width: '38px', height: '22px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                        background: link.is_active ? '#16a34a' : '#e5e7eb', position: 'relative', transition: 'background 0.15s', flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: '2px', left: link.is_active ? '18px' : '2px',
                        width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.15s',
                      }} />
                    </button>

                    <button onClick={() => startEdit(link)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '4px' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#8B0000'} onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>

                    <button
                      onClick={() => handleDeleteClick(link.id)}
                      style={{
                        background: confirmDeleteId === link.id ? '#fef2f2' : 'none',
                        border: confirmDeleteId === link.id ? '1px solid #fecaca' : 'none',
                        cursor: 'pointer', color: confirmDeleteId === link.id ? '#dc2626' : '#d1d5db',
                        padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      {confirmDeleteId === link.id && 'Confirm?'}
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: live preview */}
      <div style={{ position: 'sticky', top: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', textAlign: 'center' }}>
          Live Preview
        </p>
        <div style={{
          background: '#111827', borderRadius: '32px', padding: '14px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #1a0000 0%, #3d0000 40%, #f9fafb 40%)',
            borderRadius: '20px', overflow: 'hidden', height: '560px', overflowY: 'auto',
            padding: '28px 16px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'inline-block', background: 'white', borderRadius: '12px', padding: '10px 14px', marginBottom: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                <div style={{ width: '80px', height: '32px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#9ca3af', fontWeight: 700 }}>LOGO</div>
              </div>
              <p style={{ fontSize: '15px', fontWeight: '800', color: 'white' }}>Unit Kebudayaan</p>
              <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>UiTM Cawangan Kelantan</p>
            </div>

            {links.filter(l => l.is_active && l.style === 'social').length > 0 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                {links.filter(l => l.is_active && l.style === 'social').map(l => (
                  <div key={l.id} style={{
                    width: '26px', height: '26px', borderRadius: '7px',
                    background: 'rgba(255,255,255,0.15)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><LinkIcon iconKey={l.icon_key} size={13} /></div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {links.filter(l => l.is_active && l.style !== 'social').map(l => (
                <div key={l.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '10px',
                  background: l.style === 'primary' ? 'linear-gradient(135deg, #8B0000, #a50000)' : 'white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  <span style={{ color: l.style === 'primary' ? 'white' : '#8B0000', flexShrink: 0 }}><LinkIcon iconKey={l.icon_key} size={13} /></span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: l.style === 'primary' ? 'white' : '#111827' }}>{l.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}