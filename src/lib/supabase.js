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
      text: normalizePoemText(text),
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to save poem to Supabase: ${errText}`)
  }

  return id
}

/**
 * Automatically groups lines into 4-line stanzas (quatrains) if the text has NO stanza breaks at all.
 * If the poem already contains stanza breaks (\n\n), it preserves the original formatting intact.
 */
export function ensureStanzas(text) {
  if (!text || typeof text !== 'string') return ''

  // If text already has double newlines / stanza breaks, keep intact
  if (/\n\s*\n/.test(text)) {
    return text
  }

  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  if (lines.length <= 4) {
    return lines.join('\n')
  }

  const stanzas = []
  for (let i = 0; i < lines.length; i += 4) {
    stanzas.push(lines.slice(i, i + 4).join('\n'))
  }
  return stanzas.join('\n\n')
}

/**
 * Normalizes poem text:
 * - Replaces CRLF (\r\n) and literal escaped \\r\\n with real newlines
 * - Replaces literal escaped \\n with real newlines
 * - Normalizes typed /n line breaks (e.g. "строка1/nстрока2" or "строка1 /n строка2")
 *   while safely preserving URLs (e.g. https://.../notes)
 * - Automatically ensures stanzas for single-spaced walls of text
 * - Preserves stanzas (double newlines) and trims outer whitespace
 */
export function normalizePoemText(text) {
  if (!text) return ''
  const cleaned = text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/(?<!https?:\/\/\S*)\/n(?![a-zA-Z0-9])/g, '\n')
    .trim()

  return ensureStanzas(cleaned)
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
      const item = data[0]
      return {
        ...item,
        text: normalizePoemText(item.text),
      }
    }
  } catch (e) {
    console.error('Failed to fetch shared poem', e)
  }

  return null
}

/**
 * Fetches public poems from the Supabase catalog with server-side pagination, search, and filtering.
 * Returns { poems: Array, totalCount: number }
 */
export async function fetchCatalogPoems({
  page = 1,
  pageSize = 12,
  searchQuery = '',
  selectedAuthor = 'all',
  selectedTag = 'all',
} = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { poems: [], totalCount: 0 }
  }

  try {
    const offset = Math.max(0, (page - 1) * pageSize)
    const params = new URLSearchParams()
    params.set('select', 'id,title,author,text,tags,created_at')
    params.set('order', 'author.asc,title.asc')
    params.set('limit', String(pageSize))
    params.set('offset', String(offset))

    // Author filter
    if (selectedAuthor && selectedAuthor !== 'all') {
      params.set('author', `eq.${selectedAuthor}`)
    }

    // Tag filter
    if (selectedTag && selectedTag !== 'all') {
      params.set('tags', `cs.{${selectedTag}}`)
    }

    // Search query across title, author, and text
    const cleanQuery = (searchQuery || '').replace(/[(),]/g, ' ').trim()
    if (cleanQuery) {
      const q = `*${cleanQuery}*`
      params.set('or', `(title.ilike.${q},author.ilike.${q},text.ilike.${q})`)
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/catalog_poems?${params.toString()}`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept': 'application/json',
        'Prefer': 'count=exact',
      },
    })

    if (!res.ok) {
      console.warn('Failed to fetch catalog poems from Supabase:', res.status)
      return { poems: [], totalCount: 0 }
    }

    // Extract total count from Content-Range header (e.g. "0-11/16693" or "*/0")
    let totalCount = 0
    const contentRange = res.headers.get('content-range')
    if (contentRange) {
      const parts = contentRange.split('/')
      if (parts[1] && parts[1] !== '*') {
        totalCount = parseInt(parts[1], 10) || 0
      }
    }

    const data = await res.json()
    if (!Array.isArray(data)) {
      return { poems: [], totalCount: 0 }
    }

    const poems = data.map((poem) => ({
      ...poem,
      text: normalizePoemText(poem.text),
    }))

    if (!totalCount && poems.length > 0) {
      totalCount = poems.length
    }

    return { poems, totalCount }
  } catch (err) {
    console.error('Error fetching catalog poems:', err)
    return { poems: [], totalCount: 0 }
  }
}

/**
 * Fetches lightweight catalog metadata (distinct authors and tags) without poem texts.
 */
export async function fetchCatalogMetadata() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { sortedAuthors: [], counts: {}, topAuthors: [], tags: [], totalCount: 0 }
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/catalog_poems?select=author,tags&order=author.asc`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!res.ok) {
      return { sortedAuthors: [], counts: {}, topAuthors: [], tags: [], totalCount: 0 }
    }

    const data = await res.json()
    if (!Array.isArray(data)) {
      return { sortedAuthors: [], counts: {}, topAuthors: [], tags: [], totalCount: 0 }
    }

    const counts = {}
    const tagsSet = new Set()

    for (const item of data) {
      if (item.author) {
        counts[item.author] = (counts[item.author] || 0) + 1
      }
      if (Array.isArray(item.tags)) {
        for (const t of item.tags) {
          if (t && typeof t === 'string' && t.trim()) {
            tagsSet.add(t.trim())
          }
        }
      }
    }

    const sortedAuthors = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'ru'))
    const topAuthors = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name]) => name)
    const tags = Array.from(tagsSet).sort((a, b) => a.localeCompare(b, 'ru'))

    return { sortedAuthors, counts, topAuthors, tags, totalCount: data.length }
  } catch (err) {
    console.error('Error fetching catalog metadata:', err)
    return { sortedAuthors: [], counts: {}, topAuthors: [], tags: [], totalCount: 0 }
  }
}

