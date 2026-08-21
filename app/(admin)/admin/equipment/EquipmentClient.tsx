'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'
import QRCode from 'qrcode'

type Venue = { id: string; name: string; code: string }

type Equipment = {
  id: string
  code: string
  name: string
  category: string
  venue_id: string | null
  status: string
  notes: string | null
  qr_slug: string | null
  quantity: number
  available_quantity: number
  manual_text: string | null
  manual_url: string | null
  video_url: string | null
  troubleshooting: string | null
  created_at: string
  venues?: { name: string; code: string } | null
}

type Loan = {
  id: string
  equipment_id: string
  booking_id: string | null
  borrower_name: string
  department: string | null
  phone: string | null
  checkout_date: string
  expected_return_date: string | null
  actual_return_date: string | null
  status: string
  quantity: number
  notes: string | null
  created_at: string
  equipment?: { code: string; name: string } | null
}

type Maintenance = {
  id: string
  equipment_id: string
  issue_description: string
  status: string
  quantity: number
  reported_by: string | null
  reported_at: string
  resolved_at: string | null
  equipment?: { code: string; name: string } | null
}

const categories = [
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'power', label: 'Power' },
  { value: 'tools', label: 'Tools' },
  { value: 'other', label: 'Other' },
]

const categoryIcon = (category: string) => {
  const common = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (category) {
    case 'audio':
      return <svg {...common}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
    case 'video':
      return <svg {...common}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
    case 'lighting':
      return <svg {...common}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.75.75 1.22 1.5 1.41 2.5"/></svg>
    case 'power':
      return <svg {...common}><path d="M22 9.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5"/><path d="M6 6v6"/><path d="M10 6v6"/><path d="M6 2v2"/><path d="M10 2v2"/></svg>
    case 'tools':
      return <svg {...common}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
    default:
      return <svg {...common}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  }
}

const equipmentStatusStyle = (status: string) => {
  if (status === 'available') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Available' }
  if (status === 'reserved') return { bg: '#eff6ff', color: '#2563eb', border: '#dbeafe', label: 'Reserved' }
  if (status === 'borrowed') return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Borrowed' }
  return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Maintenance' }
}

const card = {
  background: 'white',
  border: '1px solid #f3f4f6',
  borderRadius: '14px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600' as const,
  color: '#6b7280',
  marginBottom: '6px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const inputStyle = {
  width: '100%',
  border: '1.5px solid #e5e7eb',
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  color: '#111827',
  background: 'white',
}

const tabs = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'loans', label: 'Loans' },
  { id: 'maintenance', label: 'Maintenance' },
]

export default function EquipmentClient({
  equipment: initialEquipment,
  loans: initialLoans,
  maintenance: initialMaintenance,
  venues,
}: {
  equipment: Equipment[]
  loans: Loan[]
  maintenance: Maintenance[]
  venues: Venue[]
}) {
  const [activeTab, setActiveTab] = useState('inventory')
  const [equipment, setEquipment] = useState(initialEquipment)
  const [loans, setLoans] = useState(initialLoans)
  const [maintenance, setMaintenance] = useState(initialMaintenance)

  // ---- Inventory state ----
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [newEquipment, setNewEquipment] = useState({ code: '', name: '', category: 'audio', venue_id: '', notes: '', quantity: '1' })
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null)
  const [editEquipmentValue, setEditEquipmentValue] = useState({ code: '', name: '', category: 'audio', venue_id: '', notes: '', quantity: '1' })

  // ---- QR content panel ----
  const [qrPanelId, setQrPanelId] = useState<string | null>(null)
  const [qrContent, setQrContent] = useState({ manual_text: '', manual_url: '', video_url: '', troubleshooting: '' })
  const [savingQrContent, setSavingQrContent] = useState(false)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const confirmDeleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- Loan state ----
  const [showAddLoan, setShowAddLoan] = useState(false)
  const [newLoan, setNewLoan] = useState({ equipment_id: '', borrower_name: '', department: '', phone: '', expected_return_date: '', quantity: '1' })

  // ---- Maintenance state ----
  const [showAddMaintenance, setShowAddMaintenance] = useState(false)
  const [newMaintenance, setNewMaintenance] = useState({ equipment_id: '', issue_description: '', reported_by: '', quantity: '1' })

  const todayStr = new Date().toISOString().split('T')[0]

  // ================= EQUIPMENT (Inventory) =================
  const addEquipment = async () => {
    if (!newEquipment.code.trim() || !newEquipment.name.trim()) {
      showToast('Please fill in the equipment code and name.', 'error'); return
    }
    const qty = Math.max(0, parseInt(newEquipment.quantity, 10) || 0)
    const { data, error } = await supabase
      .from('equipment')
      .insert([{
        code: newEquipment.code.trim().toUpperCase(),
        name: newEquipment.name.trim(),
        category: newEquipment.category,
        venue_id: newEquipment.venue_id || null,
        notes: newEquipment.notes.trim() || null,
        quantity: qty,
        available_quantity: qty,
        status: qty > 0 ? 'available' : 'borrowed',
      }])
      .select('*, venues(name, code)')
      .single()
    if (!error && data) {
      setEquipment(prev => [...prev, data].sort((a, b) => a.code.localeCompare(b.code)))
      setNewEquipment({ code: '', name: '', category: 'audio', venue_id: '', notes: '', quantity: '1' })
      setShowAddEquipment(false)
      showToast('Equipment added successfully!', 'success')
    } else {
      showToast(error?.message.includes('duplicate') ? 'That equipment code already exists.' : 'Error while adding.', 'error')
    }
  }

  const handleDeleteClick = (id: string) => {
    if (confirmDeleteId === id) {
      if (confirmDeleteTimer.current) clearTimeout(confirmDeleteTimer.current)
      setConfirmDeleteId(null)
      deleteEquipment(id)
      return
    }
    setConfirmDeleteId(id)
    if (confirmDeleteTimer.current) clearTimeout(confirmDeleteTimer.current)
    confirmDeleteTimer.current = setTimeout(() => setConfirmDeleteId(null), 3000)
  }

  const deleteEquipment = async (id: string) => {
    const { error } = await supabase.from('equipment').delete().eq('id', id)
    if (!error) {
      setEquipment(prev => prev.filter(e => e.id !== id))
      showToast('Equipment deleted successfully.', 'success')
    } else {
      showToast('Error while deleting (there may be related loan/maintenance records).', 'error')
    }
  }

  const startEditEquipment = (eq: Equipment) => {
    setEditingEquipmentId(eq.id)
    setEditEquipmentValue({ code: eq.code, name: eq.name, category: eq.category, venue_id: eq.venue_id ?? '', notes: eq.notes ?? '', quantity: eq.quantity.toString() })
  }

  const saveEditEquipment = async (id: string) => {
    const code = editEquipmentValue.code.trim().toUpperCase()
    const name = editEquipmentValue.name.trim()
    if (!code || !name) { setEditingEquipmentId(null); return }

    const current = equipment.find(e => e.id === id)
    const newQuantity = Math.max(0, parseInt(editEquipmentValue.quantity, 10) || 0)
    // Keep the "currently out" count (borrowed/maintenance) constant when quantity changes
    const currentlyOut = current ? current.quantity - current.available_quantity : 0
    const newAvailable = Math.max(0, newQuantity - currentlyOut)

    const { error } = await supabase
      .from('equipment')
      .update({
        code, name, category: editEquipmentValue.category,
        venue_id: editEquipmentValue.venue_id || null,
        notes: editEquipmentValue.notes.trim() || null,
        quantity: newQuantity,
        available_quantity: newAvailable,
      })
      .eq('id', id)

    if (!error) {
      setEquipment(prev => prev.map(e => e.id === id
        ? { ...e, code, name, category: editEquipmentValue.category, venue_id: editEquipmentValue.venue_id || null, notes: editEquipmentValue.notes.trim() || null, quantity: newQuantity, available_quantity: newAvailable }
        : e))
      showToast('Equipment updated successfully!', 'success')
    } else {
      showToast('Error while updating.', 'error')
    }
    setEditingEquipmentId(null)
  }

  const changeEquipmentStatus = async (eq: Equipment, status: string) => {
    const { error } = await supabase.from('equipment').update({ status }).eq('id', eq.id)
    if (!error) {
      setEquipment(prev => prev.map(e => e.id === eq.id ? { ...e, status } : e))
      showToast('Status updated.', 'success')
    } else {
      showToast('Error updating status.', 'error')
    }
  }

  const filteredEquipment = equipment
    .filter(e => categoryFilter === 'all' || e.category === categoryFilter)
    .filter(e => statusFilter === 'all' || e.status === statusFilter)

  const qrPublicUrl = (code: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/guide/item/${code}` : `/guide/item/${code}`

  const openQrPanel = (eq: Equipment) => {
    setQrPanelId(eq.id)
    setEditingEquipmentId(null)
    setQrContent({
      manual_text: eq.manual_text ?? '',
      manual_url: eq.manual_url ?? '',
      video_url: eq.video_url ?? '',
      troubleshooting: eq.troubleshooting ?? '',
    })
  }

  const saveQrContent = async (eq: Equipment) => {
    setSavingQrContent(true)
    const patch = {
      manual_text: qrContent.manual_text.trim() || null,
      manual_url: qrContent.manual_url.trim() || null,
      video_url: qrContent.video_url.trim() || null,
      troubleshooting: qrContent.troubleshooting.trim() || null,
    }
    const { error } = await supabase.from('equipment').update(patch).eq('id', eq.id)
    if (!error) {
      setEquipment(prev => prev.map(e => e.id === eq.id ? { ...e, ...patch } : e))
      showToast('QR guide content saved!', 'success')
    } else {
      showToast('Error saving guide content.', 'error')
    }
    setSavingQrContent(false)
  }

  const downloadQrCode = (code: string) => {
    if (!qrCanvasRef.current) return
    const link = document.createElement('a')
    link.download = `qr-${code}.png`
    link.href = qrCanvasRef.current.toDataURL('image/png')
    link.click()
  }

  useEffect(() => {
    if (!qrPanelId || !qrCanvasRef.current) return
    const eq = equipment.find(e => e.id === qrPanelId)
    if (!eq) return
    QRCode.toCanvas(qrCanvasRef.current, qrPublicUrl(eq.code), { width: 160, margin: 1, color: { dark: '#111827', light: '#ffffff' } })
  }, [qrPanelId, equipment])

  useEffect(() => {
    return () => { if (confirmDeleteTimer.current) clearTimeout(confirmDeleteTimer.current) }
  }, [])

  // ================= LOANS =================
  const availableEquipment = equipment.filter(e => e.available_quantity > 0)

  const addLoan = async () => {
    if (!newLoan.equipment_id || !newLoan.borrower_name.trim()) {
      showToast('Please select equipment and enter the borrower name.', 'error'); return
    }
    const selectedEq = equipment.find(e => e.id === newLoan.equipment_id)
    const qty = Math.max(1, parseInt(newLoan.quantity, 10) || 1)
    if (selectedEq && qty > selectedEq.available_quantity) {
      showToast(`Only ${selectedEq.available_quantity} unit(s) available for this item.`, 'error'); return
    }
    const { data, error } = await supabase
      .from('equipment_loans')
      .insert([{
        equipment_id: newLoan.equipment_id,
        borrower_name: newLoan.borrower_name.trim(),
        department: newLoan.department.trim() || null,
        phone: newLoan.phone.trim() || null,
        checkout_date: todayStr,
        expected_return_date: newLoan.expected_return_date || null,
        quantity: qty,
        status: 'out',
      }])
      .select('*, equipment(code, name)')
      .single()
    if (!error && data) {
      setLoans(prev => [data, ...prev])
      setEquipment(prev => prev.map(e => {
        if (e.id !== newLoan.equipment_id) return e
        const newAvail = Math.max(0, e.available_quantity - qty)
        return { ...e, available_quantity: newAvail, status: newAvail <= 0 ? 'borrowed' : e.status }
      }))
      setNewLoan({ equipment_id: '', borrower_name: '', department: '', phone: '', expected_return_date: '', quantity: '1' })
      setShowAddLoan(false)
      showToast('Loan recorded successfully!', 'success')
    } else {
      showToast('Error recording the loan.', 'error')
    }
  }

  const approveLoan = async (loan: Loan) => {
    const eq = equipment.find(e => e.id === loan.equipment_id)
    if (eq && loan.quantity > eq.available_quantity) {
      showToast(`Tak boleh lulus -- cuma ${eq.available_quantity} unit tersedia sekarang.`, 'error')
      return
    }
    const { error } = await supabase
      .from('equipment_loans')
      .update({ status: 'out' })
      .eq('id', loan.id)
    if (!error) {
      setLoans(prev => prev.map(l => l.id === loan.id ? { ...l, status: 'out' } : l))
      setEquipment(prev => prev.map(e => {
        if (e.id !== loan.equipment_id) return e
        const newAvail = Math.max(0, e.available_quantity - loan.quantity)
        return { ...e, available_quantity: newAvail, status: newAvail <= 0 ? 'borrowed' : e.status }
      }))
      showToast('Permohonan diluluskan!', 'success')
    } else {
      showToast('Ralat semasa meluluskan.', 'error')
    }
  }

  const rejectLoan = async (loan: Loan) => {
    const { error } = await supabase
      .from('equipment_loans')
      .update({ status: 'rejected' })
      .eq('id', loan.id)
    if (!error) {
      setLoans(prev => prev.map(l => l.id === loan.id ? { ...l, status: 'rejected' } : l))
      showToast('Permohonan ditolak.', 'success')
    } else {
      showToast('Ralat semasa menolak.', 'error')
    }
  }

  const returnLoan = async (loan: Loan) => {
    const { error } = await supabase
      .from('equipment_loans')
      .update({ status: 'returned', actual_return_date: todayStr })
      .eq('id', loan.id)
    if (!error) {
      setLoans(prev => prev.map(l => l.id === loan.id ? { ...l, status: 'returned', actual_return_date: todayStr } : l))
      setEquipment(prev => prev.map(e => {
        if (e.id !== loan.equipment_id) return e
        const newAvail = Math.min(e.quantity, e.available_quantity + loan.quantity)
        return { ...e, available_quantity: newAvail, status: newAvail > 0 && e.status === 'borrowed' ? 'available' : e.status }
      }))
      showToast('Item marked as returned.', 'success')
    } else {
      showToast('Error while updating.', 'error')
    }
  }

  const loanStatusStyle = (loan: Loan) => {
    if (loan.status === 'pending') return { bg: '#eff6ff', color: '#2563eb', border: '#dbeafe', label: 'Menunggu Kelulusan' }
    if (loan.status === 'rejected') return { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb', label: 'Ditolak' }
    if (loan.status === 'returned') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Returned' }
    if (loan.expected_return_date && loan.expected_return_date < todayStr) return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Overdue' }
    return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Out' }
  }

  // ================= MAINTENANCE =================
  const addMaintenance = async () => {
    if (!newMaintenance.equipment_id || !newMaintenance.issue_description.trim()) {
      showToast('Please select equipment and describe the issue.', 'error'); return
    }
    const selectedEq = equipment.find(e => e.id === newMaintenance.equipment_id)
    const qty = Math.max(1, parseInt(newMaintenance.quantity, 10) || 1)
    if (selectedEq && qty > selectedEq.available_quantity) {
      showToast(`Only ${selectedEq.available_quantity} unit(s) available to send for maintenance.`, 'error'); return
    }
    const { data, error } = await supabase
      .from('equipment_maintenance')
      .insert([{
        equipment_id: newMaintenance.equipment_id,
        issue_description: newMaintenance.issue_description.trim(),
        reported_by: newMaintenance.reported_by.trim() || null,
        quantity: qty,
        status: 'reported',
      }])
      .select('*, equipment(code, name)')
      .single()
    if (!error && data) {
      setMaintenance(prev => [data, ...prev])
      setEquipment(prev => prev.map(e => {
        if (e.id !== newMaintenance.equipment_id) return e
        const newAvail = Math.max(0, e.available_quantity - qty)
        return { ...e, available_quantity: newAvail, status: 'maintenance' }
      }))
      setNewMaintenance({ equipment_id: '', issue_description: '', reported_by: '', quantity: '1' })
      setShowAddMaintenance(false)
      showToast('Maintenance report submitted successfully!', 'success')
    } else {
      showToast('Error submitting the report.', 'error')
    }
  }

  const updateMaintenanceStatus = async (report: Maintenance, status: string) => {
    const patch: { status: string; resolved_at?: string | null } = { status }
    if (status === 'fixed') patch.resolved_at = new Date().toISOString()
    const { error } = await supabase.from('equipment_maintenance').update(patch).eq('id', report.id)
    if (!error) {
      setMaintenance(prev => prev.map(m => m.id === report.id ? { ...m, ...patch } as Maintenance : m))
      if (status === 'fixed') {
        setEquipment(prev => prev.map(e => {
          if (e.id !== report.equipment_id) return e
          const newAvail = Math.min(e.quantity, e.available_quantity + report.quantity)
          return { ...e, available_quantity: newAvail, status: newAvail > 0 ? 'available' : e.status }
        }))
      }
      showToast('Maintenance status updated.', 'success')
    } else {
      showToast('Error while updating.', 'error')
    }
  }

  const maintenanceStatusStyle = (status: string) => {
    if (status === 'fixed') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Fixed' }
    if (status === 'in_repair') return { bg: '#eff6ff', color: '#2563eb', border: '#dbeafe', label: 'In Repair' }
    return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Reported' }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>Equipment</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Inventory, loans, and maintenance reports</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '2px', marginBottom: '20px',
        background: '#f3f4f6', padding: '4px', borderRadius: '10px',
        border: '1px solid #e5e7eb', maxWidth: '420px',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '8px 14px', borderRadius: '7px', border: 'none',
              fontSize: '13px', fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer', transition: 'all 0.15s',
              background: activeTab === tab.id ? '#8B0000' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6b7280',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============ INVENTORY TAB ============ */}
      {activeTab === 'inventory' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ ...inputStyle, width: 'auto', padding: '8px 12px', cursor: 'pointer' }}>
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                style={{ ...inputStyle, width: 'auto', padding: '8px 12px', cursor: 'pointer' }}>
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="borrowed">Borrowed</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddEquipment(v => !v)}
              style={{ background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              + Add Equipment
            </button>
          </div>

          {showAddEquipment && (
            <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Code</label>
                  <input type="text" placeholder="AUD-001" value={newEquipment.code}
                    onChange={(e) => setNewEquipment(p => ({ ...p, code: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input type="text" placeholder="Wireless Microphone" value={newEquipment.name}
                    onChange={(e) => setNewEquipment(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={newEquipment.category} onChange={(e) => setNewEquipment(p => ({ ...p, category: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Venue (optional)</label>
                  <select value={newEquipment.venue_id} onChange={(e) => setNewEquipment(p => ({ ...p, venue_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">-- None / All venues --</option>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Quantity</label>
                  <input type="number" min="0" value={newEquipment.quantity}
                    onChange={(e) => setNewEquipment(p => ({ ...p, quantity: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notes (optional)</label>
                  <input type="text" placeholder="e.g. purchased 2024, has a case" value={newEquipment.notes}
                    onChange={(e) => setNewEquipment(p => ({ ...p, notes: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={addEquipment} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setShowAddEquipment(false)} style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ ...card, overflow: 'hidden' }}>
            {filteredEquipment.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No equipment yet.</div>
            ) : (
              filteredEquipment.map(eq => {
                const sc = equipmentStatusStyle(eq.status)
                const isEditing = editingEquipmentId === eq.id
                return (
                  <div key={eq.id}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
                        <input value={editEquipmentValue.code} onChange={(e) => setEditEquipmentValue(p => ({ ...p, code: e.target.value }))} style={{ ...inputStyle, width: '110px' }} />
                        <input value={editEquipmentValue.name} onChange={(e) => setEditEquipmentValue(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, flex: 1, minWidth: '140px' }} />
                        <select value={editEquipmentValue.category} onChange={(e) => setEditEquipmentValue(p => ({ ...p, category: e.target.value }))} style={{ ...inputStyle, width: '140px', cursor: 'pointer' }}>
                          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        <select value={editEquipmentValue.venue_id} onChange={(e) => setEditEquipmentValue(p => ({ ...p, venue_id: e.target.value }))} style={{ ...inputStyle, width: '150px', cursor: 'pointer' }}>
                          <option value="">-- No venue --</option>
                          {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <input type="number" min="0" value={editEquipmentValue.quantity}
                          onChange={(e) => setEditEquipmentValue(p => ({ ...p, quantity: e.target.value }))} style={{ ...inputStyle, width: '80px' }} title="Quantity" />
                        <button onClick={() => saveEditEquipment(eq.id)} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => setEditingEquipmentId(null)} style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ minWidth: '80px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#8B0000', background: '#fef2f2', padding: '3px 8px', borderRadius: '999px' }}>{eq.code}</span>
                        </div>
                        <div style={{ color: '#8B0000', background: '#fef2f2', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {categoryIcon(eq.category)}
                        </div>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{eq.name}</p>
                          <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {categories.find(c => c.value === eq.category)?.label ?? eq.category}
                            {eq.venues && ` · ${eq.venues.name}`}
                            {eq.notes && ` · ${eq.notes}`}
                          </p>
                        </div>
                        <span style={{
                          fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '999px',
                          background: eq.available_quantity > 0 ? '#f9fafb' : '#fef2f2',
                          color: eq.available_quantity > 0 ? '#374151' : '#dc2626',
                          border: `1px solid ${eq.available_quantity > 0 ? '#e5e7eb' : '#fecaca'}`,
                        }}>
                          {eq.available_quantity}/{eq.quantity} unit{eq.quantity !== 1 ? 's' : ''}
                        </span>
                        <select
                          value={eq.status}
                          onChange={(e) => changeEquipmentStatus(eq, e.target.value)}
                          style={{
                            fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '999px',
                            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, cursor: 'pointer',
                          }}
                        >
                          <option value="available">Available</option>
                          <option value="reserved">Reserved</option>
                          <option value="borrowed">Borrowed</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                        <button onClick={() => openQrPanel(eq)} style={{ background: qrPanelId === eq.id ? '#fef2f2' : 'none', border: qrPanelId === eq.id ? '1px solid #fecaca' : 'none', cursor: 'pointer', color: qrPanelId === eq.id ? '#8B0000' : '#d1d5db', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                          onMouseEnter={(e) => { if (qrPanelId !== eq.id) e.currentTarget.style.color = '#8B0000' }} onMouseLeave={(e) => { if (qrPanelId !== eq.id) e.currentTarget.style.color = '#d1d5db' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                            <line x1="14" y1="14" x2="14" y2="21"/><line x1="21" y1="14" x2="21" y2="14.01"/><line x1="14" y1="17.5" x2="17.5" y2="17.5"/><line x1="21" y1="21" x2="17.5" y2="21"/><line x1="17.5" y1="17.5" x2="17.5" y2="21"/>
                          </svg>
                        </button>
                        <button onClick={() => startEditEquipment(eq)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#8B0000'} onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(eq.id)}
                          style={{
                            background: confirmDeleteId === eq.id ? '#fef2f2' : 'none',
                            border: confirmDeleteId === eq.id ? '1px solid #fecaca' : 'none',
                            cursor: 'pointer', color: confirmDeleteId === eq.id ? '#dc2626' : '#d1d5db',
                            padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px',
                            fontSize: '11px', fontWeight: '700', transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => { if (confirmDeleteId !== eq.id) e.currentTarget.style.color = '#dc2626' }}
                          onMouseLeave={(e) => { if (confirmDeleteId !== eq.id) e.currentTarget.style.color = '#d1d5db' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                          {confirmDeleteId === eq.id && 'Confirm?'}
                        </button>
                      </>
                    )}
                  </div>

                  {qrPanelId === eq.id && (
                    <div style={{ padding: '18px', background: '#fafafa', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={labelStyle}>Manual (text)</label>
                          <textarea value={qrContent.manual_text} onChange={(e) => setQrContent(p => ({ ...p, manual_text: e.target.value }))} rows={3}
                            placeholder="Step-by-step instructions..." style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                        <div>
                          <label style={labelStyle}>Manual URL (optional link)</label>
                          <input type="text" value={qrContent.manual_url} onChange={(e) => setQrContent(p => ({ ...p, manual_url: e.target.value }))}
                            placeholder="https://..." style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Video Tutorial URL (YouTube/Drive)</label>
                          <input type="text" value={qrContent.video_url} onChange={(e) => setQrContent(p => ({ ...p, video_url: e.target.value }))}
                            placeholder="https://youtube.com/watch?v=..." style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Troubleshooting (one step per line)</label>
                          <textarea value={qrContent.troubleshooting} onChange={(e) => setQrContent(p => ({ ...p, troubleshooting: e.target.value }))} rows={4}
                            placeholder={'Check the power cable.\nRestart the device.\nContact admin if issue persists.'} style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => saveQrContent(eq)} disabled={savingQrContent} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: savingQrContent ? 0.6 : 1 }}>
                            {savingQrContent ? 'Saving...' : 'Save Guide Content'}
                          </button>
                          <button onClick={() => setQrPanelId(null)} style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Close</button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <label style={labelStyle}>QR Code</label>
                        <canvas ref={qrCanvasRef} style={{ border: '1px solid #f3f4f6', borderRadius: '10px', background: 'white' }} />
                        <p style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', maxWidth: '160px', wordBreak: 'break-all' }}>{qrPublicUrl(eq.code)}</p>
                        <button onClick={() => downloadQrCode(eq.code)} style={{ background: 'white', color: '#8B0000', border: '1px solid #fecaca', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          Download PNG
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ============ LOANS TAB ============ */}
      {activeTab === 'loans' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={() => setShowAddLoan(v => !v)}
              style={{ background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              + Record Loan
            </button>
          </div>

          {showAddLoan && (
            <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Equipment</label>
                  <select value={newLoan.equipment_id} onChange={(e) => setNewLoan(p => ({ ...p, equipment_id: e.target.value, quantity: '1' }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">-- Select equipment (available only) --</option>
                    {availableEquipment.map(e => <option key={e.id} value={e.id}>{e.code} — {e.name} ({e.available_quantity} available)</option>)}
                  </select>
                  {availableEquipment.length === 0 && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>No equipment with &quot;available&quot; status right now.</p>}
                </div>
                <div>
                  <label style={labelStyle}>Quantity</label>
                  <input
                    type="number" min="1"
                    max={equipment.find(e => e.id === newLoan.equipment_id)?.available_quantity ?? undefined}
                    value={newLoan.quantity}
                    onChange={(e) => setNewLoan(p => ({ ...p, quantity: e.target.value }))} style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Borrower Name</label>
                  <input type="text" value={newLoan.borrower_name} onChange={(e) => setNewLoan(p => ({ ...p, borrower_name: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Department/Club</label>
                  <input type="text" value={newLoan.department} onChange={(e) => setNewLoan(p => ({ ...p, department: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input type="text" value={newLoan.phone} onChange={(e) => setNewLoan(p => ({ ...p, phone: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Expected Return Date</label>
                  <input type="date" value={newLoan.expected_return_date} onChange={(e) => setNewLoan(p => ({ ...p, expected_return_date: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={addLoan} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setShowAddLoan(false)} style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ ...card, overflow: 'hidden' }}>
            {loans.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No loan records yet.</div>
            ) : (
              loans.map(loan => {
                const ls = loanStatusStyle(loan)
                return (
                  <div key={loan.id} style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: '80px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#8B0000', background: '#fef2f2', padding: '3px 8px', borderRadius: '999px' }}>{loan.equipment?.code ?? '-'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{loan.equipment?.name ?? '-'} <span style={{ fontWeight: 400, color: '#6b7280' }}>× {loan.quantity} → {loan.borrower_name}</span></p>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {loan.department && `${loan.department} · `}
                        {loan.phone && `${loan.phone} · `}
                        Checked out: {loan.checkout_date}
                        {loan.expected_return_date && ` · Expected return: ${loan.expected_return_date}`}
                        {loan.actual_return_date && ` · Returned: ${loan.actual_return_date}`}
                        {loan.notes && ` · ${loan.notes}`}
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '999px', background: ls.bg, color: ls.color, border: `1px solid ${ls.border}` }}>
                      {ls.label}
                    </span>
                    {loan.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => approveLoan(loan)} style={{ background: 'white', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          Lulus
                        </button>
                        <button onClick={() => rejectLoan(loan)} style={{ background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          Tolak
                        </button>
                      </div>
                    )}
                    {loan.status === 'out' && (
                      <button onClick={() => returnLoan(loan)} style={{ background: 'white', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        Mark as Returned
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ============ MAINTENANCE TAB ============ */}
      {activeTab === 'maintenance' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={() => setShowAddMaintenance(v => !v)}
              style={{ background: 'linear-gradient(135deg, #8B0000, #a50000)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              + Report Issue
            </button>
          </div>

          {showAddMaintenance && (
            <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Equipment</label>
                  <select value={newMaintenance.equipment_id} onChange={(e) => setNewMaintenance(p => ({ ...p, equipment_id: e.target.value, quantity: '1' }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">-- Select equipment --</option>
                    {equipment.map(e => <option key={e.id} value={e.id}>{e.code} — {e.name} ({e.available_quantity} available)</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Quantity</label>
                  <input
                    type="number" min="1"
                    max={equipment.find(e => e.id === newMaintenance.equipment_id)?.available_quantity ?? undefined}
                    value={newMaintenance.quantity}
                    onChange={(e) => setNewMaintenance(p => ({ ...p, quantity: e.target.value }))} style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Issue</label>
                  <input type="text" placeholder="e.g. Noise on channel 2" value={newMaintenance.issue_description}
                    onChange={(e) => setNewMaintenance(p => ({ ...p, issue_description: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Reported By</label>
                  <input type="text" value={newMaintenance.reported_by} onChange={(e) => setNewMaintenance(p => ({ ...p, reported_by: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={addMaintenance} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Submit</button>
                <button onClick={() => setShowAddMaintenance(false)} style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ ...card, overflow: 'hidden' }}>
            {maintenance.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No maintenance reports yet.</div>
            ) : (
              maintenance.map(report => {
                const ms = maintenanceStatusStyle(report.status)
                return (
                  <div key={report.id} style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: '80px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#8B0000', background: '#fef2f2', padding: '3px 8px', borderRadius: '999px' }}>{report.equipment?.code ?? '-'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{report.equipment?.name ?? '-'} <span style={{ fontWeight: 400, color: '#6b7280' }}>× {report.quantity}</span></p>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>{report.issue_description}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {report.reported_by && `Reported by ${report.reported_by} · `}
                        {new Date(report.reported_at).toLocaleDateString('ms-MY')}
                        {report.resolved_at && ` · Resolved: ${new Date(report.resolved_at).toLocaleDateString('ms-MY')}`}
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '999px', background: ms.bg, color: ms.color, border: `1px solid ${ms.border}` }}>
                      {ms.label}
                    </span>
                    {report.status === 'reported' && (
                      <button onClick={() => updateMaintenanceStatus(report, 'in_repair')} style={{ background: 'white', color: '#2563eb', border: '1px solid #dbeafe', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        Start Repair
                      </button>
                    )}
                    {report.status === 'in_repair' && (
                      <button onClick={() => updateMaintenanceStatus(report, 'fixed')} style={{ background: 'white', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        Mark as Fixed
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}