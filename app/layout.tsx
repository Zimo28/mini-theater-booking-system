import type { Metadata, Viewport } from 'next'
import ToastProvider from '@/components/Toast'
import LoadingBar from '@/components/LoadingBar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mini Theater Booking System',
  description: 'Admin panel untuk Mini Theater Booking System',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mini Theater',
  },
}

export const viewport: Viewport = {
  themeColor: '#8B0000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mini Theater" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning>
        <LoadingBar />
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}