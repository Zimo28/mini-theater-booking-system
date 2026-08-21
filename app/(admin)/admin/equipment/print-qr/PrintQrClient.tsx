'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

type Equipment = { id: string; code: string; name: string; category: string }

export default function PrintQrClient({ equipment }: { equipment: Equipment[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(equipment.map(e => e.id)))
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const origin = window.location.origin
    equipment.forEach(eq => {
      if (!selected.has(eq.id)) return
      const canvas = canvasRefs.current[eq.id]
      if (canvas) {
        QRCode.toCanvas(canvas, `${origin}/guide/item/${eq.code}`, { width: 140, margin: 1, color: { dark: '#111827', light: '#ffffff' } })
      }
    })
  }, [equipment, selected])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(prev => prev.size === equipment.length ? new Set() : new Set(equipment.map(e => e.id)))
  }

  return (
    <div>
      {/* Controls -- hidden bila print */}
      <div className="no-print" style={{ maxWidth: '1000px', margin: '0 auto 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Print QR Codes</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Pilih equipment, lepas tu klik Print (atau Ctrl+P) untuk cetak / save PDF.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={toggleAll} style={{ background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              {selected.size === equipment.length ? 'Nyahpilih Semua' : 'Pilih Semua'}
            </button>
            <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              🖨️ Print ({selected.size})
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', marginBottom: '24px' }}>
          {equipment.map(eq => (
            <label key={eq.id} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
              background: 'white', border: '1px solid #f3f4f6', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
            }}>
              <input type="checkbox" checked={selected.has(eq.id)} onChange={() => toggle(eq.id)} />
              <span style={{ fontWeight: 600, color: '#8B0000' }}>{eq.code}</span>
              <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.name}</span>
            </label>
          ))}
        </div>
        {equipment.length === 0 && (
          <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>Tiada equipment lagi.</p>
        )}
      </div>

      {/* Printable grid */}
      <div className="qr-print-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
        maxWidth: '1000px', margin: '0 auto',
      }}>
        {equipment.filter(eq => selected.has(eq.id)).map(eq => (
          <div key={eq.id} style={{
            border: '1.5px dashed #d1d5db', borderRadius: '10px', padding: '16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            breakInside: 'avoid',
          }}>
            <canvas ref={(el) => { canvasRefs.current[eq.id] = el }} />
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827', marginTop: '8px' }}>{eq.code}</p>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>{eq.name}</p>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .qr-print-grid { gap: 12px !important; }
        }
      `}</style>
    </div>
  )
}