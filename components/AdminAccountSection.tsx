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
    color: '#6b7280',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }

  const updateProfile = async () => {
    if (!fullName && !email) {
      showToast('Please fill in at least one field.', 'error')
      return
    }

    setLoadingProfile(true)

    if (email) {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) {
        showToast('Error occurred while updating email: ' + error.message, 'error')
        setLoadingProfile(false)
        return
      }
    }

    if (fullName) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', user.id)
        if (error) {
          showToast('Error occurred while updating name.', 'error')
          setLoadingProfile(false)
          return
        }
      }
    }

    showToast('Profile updated successfully!', 'success')
    setFullName('')
    setEmail('')
    setLoadingProfile(false)
  }

  const updatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('Please fill in all password fields.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error')
      return
    }

    setLoadingPassword(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      showToast('Error occurred while updating password: ' + error.message, 'error')
    } else {
      showToast('Password updated successfully!', 'success')
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
          Update Profile
        </p>
        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              placeholder="New name..."
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
              placeholder="New email..."
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
          onMouseEnter={(e) => {
            if (!loadingProfile) {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,0,0,0.4)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loadingProfile) {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,0,0,0.2)'
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
        >
          {loadingProfile ? 'Saving...' : 'Update Profile'}
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', marginBottom: '28px' }} />

      {/* Update Password */}
      <div>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
          Change Password
        </p>
        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>New Password</label>
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
            background: loadingPassword ? '#f3f4f6' : 'white',
            border: loadingPassword ? '1px solid #e5e7eb' : '1px solid #d1d5db',
            color: loadingPassword ? '#9ca3af' : '#374151',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: loadingPassword ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!loadingPassword) {
              e.currentTarget.style.background = '#f9fafb'
              e.currentTarget.style.borderColor = '#9ca3af'
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(107,114,128,0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loadingPassword) {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          {loadingPassword ? 'Saving...' : 'Change Password'}
        </button>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .settings-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}