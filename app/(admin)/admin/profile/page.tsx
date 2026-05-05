import AdminAccountSection from '@/components/AdminAccountSection'

export default function ProfilePage() {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>
          Profile
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          Kemaskini maklumat akaun admin
        </p>
      </div>
      <div style={{
        background: 'white', border: '1px solid #f3f4f6',
        borderRadius: '12px', padding: '28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <AdminAccountSection />
      </div>
    </div>
  )
}