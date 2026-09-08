import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCatalogPoems, fetchCatalogMetadata, normalizePoemText } from '../supabase'
import { 
  getCachedCatalogPage, 
  setCachedCatalogPage, 
  getCachedCatalogMetadata, 
  setCachedCatalogMetadata, 
  clearCatalogCache, 
  generateCatalogCacheKey 
} from '../catalogCache'

describe('normalizePoemText', () => {
  it('converts literal escaped \\n and \\r\\n to real newlines', () => {
    const raw = 'Строфа 1\\nСтрока 2\\n\\nСтрофа 2\\nСтрока 4'
    const normalized = normalizePoemText(raw)
    expect(normalized).toBe('Строфа 1\nСтрока 2\n\nСтрофа 2\nСтрока 4')
    expect(normalized.split(/\n\s*\n/).length).toBe(2)
  })

  it('converts Windows \\r\\n to \\n', () => {
    const raw = 'Строка 1\r\nСтрока 2\r\n\r\nСтрока 3'
    expect(normalizePoemText(raw)).toBe('Строка 1\nСтрока 2\n\nСтрока 3')
  })

  it('normalizes slash-n (/n) line breaks when used as delimiters', () => {
    expect(normalizePoemText('Белеет парус/nВ тумане моря')).toBe('Белеет парус\nВ тумане моря')
    expect(normalizePoemText('Белеет парус /n В тумане моря')).toBe('Белеет парус\nВ тумане моря')
    expect(normalizePoemText('Строфа 1/n/nСтрофа 2')).toBe('Строфа 1\n\nСтрофа 2')
  })

  it('automatically breaks single-spaced poems into quatrain stanzas when double newlines are missing', () => {
    const raw8 = 'Строка 1\nСтрока 2\nСтрока 3\nСтрока 4\nСтрока 5\nСтрока 6\nСтрока 7\nСтрока 8'
    const normalized = normalizePoemText(raw8)
    expect(normalized).toBe('Строка 1\nСтрока 2\nСтрока 3\nСтрока 4\n\nСтрока 5\nСтрока 6\nСтрока 7\nСтрока 8')
    expect(normalized.split(/\n\s*\n/).length).toBe(2)
  })

  it('preserves URLs and normal words that contain / without breaking them', () => {
    const textWithUrl = 'Источник: https://example.com/notes о поэзии'
    expect(normalizePoemText(textWithUrl)).toBe('Источник: https://example.com/notes о поэзии')
  })

  it('handles empty or undefined values gracefully', () => {
    expect(normalizePoemText('')).toBe('')
    expect(normalizePoemText(null)).toBe('')
    expect(normalizePoemText(undefined)).toBe('')
  })
})

describe('fetchCatalogPoems', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches catalog poems with pagination and parsed totalCount', async () => {
    const mockPoems = [
      { id: '1', title: 'Парус', author: 'Михаил Лермонтов', text: 'Белеет парус\\nВ тумане моря', tags: ['классика'] },
      { id: '2', title: 'Зимнее утро', author: 'Александр Пушкин', text: 'Мороз и солнце', tags: ['пейзаж'] },
    ]

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-range' ? '0-1/148' : null),
      },
      json: async () => mockPoems,
    })

    const { poems, totalCount } = await fetchCatalogPoems({ page: 1, pageSize: 2 })
    expect(poems[0].text).toBe('Белеет парус\nВ тумане моря')
    expect(poems[1].text).toBe('Мороз и солнце')
    expect(totalCount).toBe(148)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=2&offset=0'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Prefer': 'count=exact',
        }),
      })
    )
  })

  it('includes author, tag, and search query in URL parameters', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => '0-0/1' },
      json: async () => [{ id: '1', title: 'Парус', author: 'Михаил Лермонтов', text: 'Текст', tags: ['школа'] }],
    })

    await fetchCatalogPoems({
      page: 2,
      pageSize: 10,
      searchQuery: 'парус',
      selectedAuthor: 'Михаил Лермонтов',
      selectedTag: 'школа',
    })

    const calledUrl = globalThis.fetch.mock.calls[0][0]
    expect(calledUrl).toContain('limit=10&offset=10')
    expect(calledUrl).toContain('author=eq')
    expect(calledUrl).toContain('tags=cs')
    expect(calledUrl).toContain('or=')
  })

  it('returns empty array and 0 count when network fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    const result = await fetchCatalogPoems()
    expect(result).toEqual({ poems: [], totalCount: 0 })
  })

  it('handles exceptions gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await fetchCatalogPoems()
    expect(result).toEqual({ poems: [], totalCount: 0 })
  })
})

describe('fetchCatalogMetadata', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches distinct authors, counts, and tags without poem texts', async () => {
    const mockData = [
      { author: 'Александр Пушкин', tags: ['школа', 'любовь'] },
      { author: 'Александр Пушкин', tags: ['осень'] },
      { author: 'Михаил Лермонтов', tags: ['школа'] },
    ]

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    })

    const meta = await fetchCatalogMetadata()
    expect(meta.counts['Александр Пушкин']).toBe(2)
    expect(meta.counts['Михаил Лермонтов']).toBe(1)
    expect(meta.sortedAuthors).toEqual(['Александр Пушкин', 'Михаил Лермонтов'])
    expect(meta.tags).toContain('школа')
    expect(meta.tags).toContain('любовь')
    expect(meta.totalCount).toBe(3)
  })
})

describe('catalogCache', () => {
  beforeEach(() => {
    clearCatalogCache()
  })

  it('stores and retrieves cached catalog pages', () => {
    const key = generateCatalogCacheKey({ page: 1, pageSize: 12, searchQuery: 'весна' })
    expect(getCachedCatalogPage(key)).toBeNull()

    const data = { poems: [{ id: '1', title: 'Весна' }], totalCount: 1 }
    setCachedCatalogPage(key, data)

    expect(getCachedCatalogPage(key)).toEqual(data)
  })

  it('stores and retrieves cached metadata', () => {
    expect(getCachedCatalogMetadata()).toBeNull()

    const meta = { sortedAuthors: ['Есенин'], counts: { 'Есенин': 10 }, topAuthors: ['Есенин'], tags: ['природа'] }
    setCachedCatalogMetadata(meta)

    expect(getCachedCatalogMetadata()).toEqual(meta)
  })

  it('clears all cached items when clearCatalogCache is called', () => {
    const key = generateCatalogCacheKey({ page: 2 })
    setCachedCatalogPage(key, { poems: [], totalCount: 0 })
    setCachedCatalogMetadata({ sortedAuthors: [] })

    clearCatalogCache()
    expect(getCachedCatalogPage(key)).toBeNull()
    expect(getCachedCatalogMetadata()).toBeNull()
  })
})
