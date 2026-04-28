export const syncToGoogleSheet = async (booking: {
  //...
}) => {
  try {
    const { createBrowserClient } = await import('@supabase/ssr')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('id', 'google_sheet_url')
      .single()

    console.log('sheet url:', setting?.value)
    console.log('booking data:', booking)

    if (!setting?.value) {
      console.log('No URL found!')
      return
    }

    const response = await fetch(setting.value + '?data=' + encodeURIComponent(JSON.stringify(booking)), {
        method: 'GET',
        mode: 'no-cors',
    })

    console.log('fetch done:', response)
  } catch (err) {
    console.error('Google Sheet sync error:', err)
  }
}

export const deleteFromGoogleSheet = async (id: string) => {
  try {
    const { createBrowserClient } = await import('@supabase/ssr')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('id', 'google_sheet_url')
      .single()

    if (!setting?.value) return

    await fetch(`${setting.value}?action=delete&id=${id}`, {
      method: 'GET',
      mode: 'no-cors',
    })
  } catch (err) {
    console.error('Google Sheet delete error:', err)
  }
}