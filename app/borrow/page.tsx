/* eslint-disable @next/next/no-html-link-for-pages -- intentional: plain <a> tags force full page reload */
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'

type Equipment = {
  id: string
  code: string
  name: string
  category: string
  available_quantity: number
}

const categoryLabels: Record<string, string> = {
  audio: 'Audio', video: 'Video', lighting: 'Lighting', power: 'Power', tools: 'Tools', other: 'Lain-lain',
}

export default function BorrowPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    equipment_id: '', quantity: '1', borrower_name: '', department: '', phone: '',
    expected_return_date: '', notes: '',
  })

  useEffect(() => {
    supabase
      .from('equipment')
      .select('id, code, name, category, available_quantity')
      .gt('available_quantity', 0)
      .order('code', { ascending: true })
      .then(({ data }) => { if (data) setEquipment(data) })
  }, [])

  const selectedEquipment = equipment.find(e => e.id === form.equipment_id)

  const handleSubmit = async () => {
    if (!form.equipment_id || !form.borrower_name.trim() || !form.phone.trim()) {
      showToast('Sila lengkapkan borang: equipment, nama, dan telefon.', 'error')
      return
    }
    const qty = Math.max(1, parseInt(form.quantity, 10) || 1)
    if (selectedEquipment && qty > selectedEquipment.available_quantity) {
      showToast(`Cuma ${selectedEquipment.available_quantity} unit tersedia untuk barang ni.`, 'error')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('equipment_loans').insert([{
      equipment_id: form.equipment_id,
      quantity: qty,
      borrower_name: form.borrower_name.trim(),
      department: form.department.trim() || null,
      phone: form.phone.trim(),
      expected_return_date: form.expected_return_date || null,
      notes: form.notes.trim() || null,
      status: 'pending',
      checkout_date: new Date().toISOString().split('T')[0],
    }])
    setLoading(false)

    if (!error) {
      setSuccess(true)
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'equipment_loan_request',
          booking: {
            equipment_name: selectedEquipment?.name ?? '',
            equipment_code: selectedEquipment?.code ?? '',
            quantity: qty,
            borrower_name: form.borrower_name.trim(),
            department: form.department.trim(),
            phone: form.phone.trim(),
            expected_return_date: form.expected_return_date,
          },
        }),
      }).catch(() => {})
    } else {
      showToast('Ralat semasa menghantar permohonan. Sila cuba lagi.', 'error')
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: 'white', borderRadius: '16px', padding: '40px 28px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style={{ fontSize: '19px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Permohonan Dihantar!</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px', lineHeight: 1.6 }}>
            Permohonan pinjaman equipment anda sedang menunggu kelulusan admin. Anda akan dihubungi melalui telefon yang diberikan.
          </p>
          <a href="/" style={{
            display: 'inline-block', background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white',
            textDecoration: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '13px', fontWeight: '600',
          }}>Kembali ke Laman Utama</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f5f5 0%, #fef2f2 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#111827' }}>

      {/* Navbar */}
      <nav style={{
        background: 'white', borderBottom: '1px solid #f3f4f6',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <a href="/"><img src="/logo.png" alt="Unit Kebudayaan" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} /></a>
        <a href="/" style={{
          fontSize: '13px', color: '#8B0000', textDecoration: 'none',
          fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px',
          padding: '7px 14px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Kembali
        </a>
      </nav>

      {/* Hero Strip */}
      <div style={{
        position: 'relative', padding: '40px 24px', textAlign: 'center', overflow: 'hidden',
        background: 'linear-gradient(145deg, #1a0000 0%, #3d0000 40%, #8B0000 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '999px', padding: '4px 14px',
            fontSize: '11px', fontWeight: '600', color: '#fecaca',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fca5a5' }} />
            Unit Kebudayaan — UiTM Cawangan Kelantan
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', marginBottom: '6px' }}>Pinjam Equipment</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Isi borang di bawah -- admin akan semak & luluskan permohonan anda</p>
        </div>
      </div>

      <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '520px', background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Equipment <span style={{ color: '#dc2626' }}>*</span></label>
            <select
              value={form.equipment_id}
              onChange={(e) => setForm(p => ({ ...p, equipment_id: e.target.value, quantity: '1' }))}
              style={inputStyle}
            >
              <option value="">-- Pilih equipment --</option>
              {equipment.map(e => (
                <option key={e.id} value={e.id}>
                  {e.code} — {e.name} ({categoryLabels[e.category] ?? e.category}) · {e.available_quantity} tersedia
                </option>
              ))}
            </select>
            {equipment.length === 0 && (
              <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>Tiada equipment tersedia buat masa ini.</p>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Kuantiti <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              type="number" min="1" max={selectedEquipment?.available_quantity ?? undefined}
              value={form.quantity}
              onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Nama Penuh <span style={{ color: '#dc2626' }}>*</span></label>
            <input type="text" placeholder="Nama penuh anda" value={form.borrower_name}
              onChange={(e) => setForm(p => ({ ...p, borrower_name: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Jabatan / Kelab</label>
            <input type="text" placeholder="Jabatan atau kelab anda" value={form.department}
              onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>No. Telefon <span style={{ color: '#dc2626' }}>*</span></label>
            <input type="text" placeholder="012-3456789" value={form.phone}
              onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Jangka Tarikh Pulang</label>
            <input type="date" value={form.expected_return_date}
              onChange={(e) => setForm(p => ({ ...p, expected_return_date: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Catatan (opsyenal)</label>
            <textarea rows={3} placeholder="Tujuan pinjaman, acara berkaitan, dsb." value={form.notes}
              onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#f3f4f6' : 'linear-gradient(135deg, #8B0000, #a50000)',
              color: loading ? '#9ca3af' : 'white', border: 'none', borderRadius: '10px',
              padding: '13px', fontSize: '14px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 2px 12px rgba(139,0,0,0.25)',
            }}
          >
            {loading ? 'Menghantar...' : 'Hantar Permohonan'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px',
  padding: '10px 12px', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', color: '#111827', background: 'white',
}