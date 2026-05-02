import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      //persistSession: true,  // kekal login walaupun tutup browser
      persistSession: false, // logout bila close browser
      storageKey: 'mini-theater-admin',
    }
  }
)