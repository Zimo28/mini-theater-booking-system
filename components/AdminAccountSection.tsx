'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'

export default function AdminAccountSection() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)

  const inputStyle = {
    width: '100%',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#111827',
    background: 'white',
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }

  const updateProfile = async () => {
    if (!fullName && !email) {
      showToast('Sila isi sekurang-kurangnya satu field.', 'error')
      return
    }

    setLoadingProfile(true)

    // Update email
    if (email) {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) {
        showToast('Ralat semasa update email: ' + error.message, 'error')
        setLoadingProfile(false)
        return
      }
    }

    // Update nama dalam profiles table
    if (fullName) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', user.id)
        if (error) {
          showToast('Ralat semasa update nama.', 'error')
          setLoadingProfile(false)
          return
        }
      }
    }

    showToast('Profil berjaya dikemaskini!', 'success')
    setFullName('')
    setEmail('')
    setLoadingProfile(false)
  }

  const updatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('Sila isi semua field password.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Password baru tidak sepadan.', 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast('Password mesti sekurang-kurangnya 6 aksara.', 'error')
      return
    }

    setLoadingPassword(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      showToast('Ralat semasa update password: ' + error.message, 'error')
    } else {
      showToast('Password berjaya dikemaskini!', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    setLoadingPassword(false)
  }

  return (
    <div>
      {/* Update Profile */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
          Kemaskini Profil
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Nama Penuh</label>
            <input
              type="text"
              placeholder="Nama baru..."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#8B0000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="Email baru..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#8B0000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>
        <button
          onClick={updateProfile}
          disabled={loadingProfile}
          style={{
            background: loadingProfile ? '#d1d5db' : 'linear-gradient(135deg, #8B0000, #a50000)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: loadingProfile ? 'not-allowed' : 'pointer',
            boxShadow: loadingProfile ? 'none' : '0 2px 8px rgba(139,0,0,0.2)',
          }}
        >
          {loadingProfile ? 'Menyimpan...' : 'Kemaskini Profil'}
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', marginBottom: '28px' }} />

      {/* Update Password */}
      <div>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
          Tukar Password
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Password Baru</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#8B0000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#8B0000'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>
        <button
          onClick={updatePassword}
          disabled={loadingPassword}
          style={{
            background: loadingPassword ? '#d1d5db' : '#111827',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: loadingPassword ? 'not-allowed' : 'pointer',
          }}
        >
          {loadingPassword ? 'Menyimpan...' : 'Tukar Password'}
        </button>
      </div>
    </div>
  )
}