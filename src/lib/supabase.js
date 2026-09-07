const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://anbreuuaiooicttifajh.supabase.co'

const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuYnJldXVhaW9vaWN0dGlmYWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTQ5NjksImV4cCI6MjEwNDM3MDk2OX0.9D29b7uO25_xGkPHTt73zHTo_9fqd8_rSK8AiaCMZMc'

export function generateShortId(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const values = new Uint8Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (byte) => chars[byte % chars.length]).join('')
}

/**
 * Saves a shared poem to Supabase and returns its short ID.
 */
export async function sharePoemToSupabase(text, title = '') {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials are not configured')
  }

  const id = generateShortId(8)

  const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_poems`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      id,
      title: title || '',
      text,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to save poem to Supabase: ${errText}`)
  }

  return id
}

/**
 * Fetches a shared poem by short ID using the secure RPC function.
 * Direct table scans are strictly prohibited by RLS for data privacy.
 */
export async function fetchSharedPoemFromSupabase(id) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !id) {
    return null
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_shared_poem`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_id: id }),
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return data[0]
    }
  } catch (e) {
    console.error('Failed to fetch shared poem', e)
  }

  return null
}
