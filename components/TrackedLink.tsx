'use client'

import { supabase } from '@/lib/supabase'

export default function TrackedLink({
  id, href, style, children, target, rel, ariaLabel,
}: {
  id: string
  href: string
  style?: React.CSSProperties
  children: React.ReactNode
  target?: string
  rel?: string
  ariaLabel?: string
}) {
  const handleClick = () => {
    // Fire-and-forget -- tak block navigation, tak guna await
    supabase.rpc('increment_link_click', { link_id: id }).then(() => {})
  }

  return (
    <a href={href} style={style} target={target} rel={rel} aria-label={ariaLabel} onClick={handleClick}>
      {children}
    </a>
  )
}