/**
 * In-memory and sessionStorage cache for catalog pages and metadata.
 * Prevents re-downloading previously visited pages or metadata from Supabase.
 */

const memoryCache = new Map()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export function generateCatalogCacheKey({ page = 1, pageSize = 12, searchQuery = '', selectedAuthor = 'all', selectedTag = 'all' }) {
  const q = (searchQuery || '').trim().toLowerCase()
  const author = (selectedAuthor || 'all').trim()
  const tag = (selectedTag || 'all').trim()
  return `catalog_${page}_${pageSize}_${author}_${tag}_${q}`
}

export function getCachedCatalogPage(key) {
  // 1. Try memory
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key)
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data
    }
    memoryCache.delete(key)
  }

  // 2. Try sessionStorage
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(`verso_cache_${key}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          memoryCache.set(key, parsed)
          return parsed.data
        }
        sessionStorage.removeItem(`verso_cache_${key}`)
      }
    }
  } catch {
    // sessionStorage unavailable or quota exceeded
  }

  return null
}

export function setCachedCatalogPage(key, data) {
  const entry = { data, timestamp: Date.now() }
  memoryCache.set(key, entry)

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`verso_cache_${key}`, JSON.stringify(entry))
    }
  } catch {
    // sessionStorage quota exceeded or unavailable, memoryCache is sufficient
  }
}

const METADATA_KEY = 'verso_catalog_metadata'

export function getCachedCatalogMetadata() {
  if (memoryCache.has(METADATA_KEY)) {
    const entry = memoryCache.get(METADATA_KEY)
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data
    }
    memoryCache.delete(METADATA_KEY)
  }

  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(METADATA_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          memoryCache.set(METADATA_KEY, parsed)
          return parsed.data
        }
      }
    }
  } catch {
    // Ignore storage issues
  }

  return null
}

export function setCachedCatalogMetadata(data) {
  const entry = { data, timestamp: Date.now() }
  memoryCache.set(METADATA_KEY, entry)

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(METADATA_KEY, JSON.stringify(entry))
    }
  } catch {
    // Ignore storage issues
  }
}

export function clearCatalogCache() {
  memoryCache.clear()

  try {
    if (typeof sessionStorage !== 'undefined') {
      const keysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k && (k.startsWith('verso_cache_') || k === METADATA_KEY)) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k))
    }
  } catch {
    // Ignore storage issues
  }
}
