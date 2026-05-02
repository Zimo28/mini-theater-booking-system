'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function LoadingBar() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    setLoading(true)
    setWidth(0)

    const t1 = setTimeout(() => setWidth(30), 50)
    const t2 = setTimeout(() => setWidth(60), 200)
    const t3 = setTimeout(() => setWidth(80), 500)
    const t4 = setTimeout(() => setWidth(100), 800)
    const t5 = setTimeout(() => setLoading(false), 1000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [pathname])

  if (!loading) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: `${width}%`,
      height: '3px',
      background: 'linear-gradient(90deg, #8B0000, #dc2626, #a50000)',
      zIndex: 99999,
      transition: 'width 0.3s ease',
      boxShadow: '0 0 8px rgba(139,0,0,0.5)',
      borderRadius: '0 2px 2px 0',
    }} />
  )
}