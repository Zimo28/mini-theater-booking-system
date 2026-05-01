import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MobileNav from '@/components/MobileNav'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { SidebarProvider } from '@/components/SidebarContext'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id)
    .single()

  const userName = profile?.full_name ?? user?.email ?? 'Admin'

  return (
    <SidebarProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f9fafb' }}>
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div className="mobile-nav-wrapper">
            <MobileNav userName={userName} />
          </div>

          <div className="desktop-header-wrapper">
            <Header />
          </div>

          <main style={{ flex: 1, padding: '32px', background: '#f9fafb', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}