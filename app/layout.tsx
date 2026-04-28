import type { Metadata } from 'next'
import ToastProvider from '@/components/Toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mini Theater Booking System',
  description: 'Sistem tempahan mini theater',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}