import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCatalogPoems, normalizePoemText } from '../supabase'

describe('normalizePoemText', () => {
  it('converts literal escaped \\n and \\r\\n to real newlines', () => {
    const raw = 'Строфа 1\\nСтрока 2\\n\\nСтрофа 2\\nСтрока 4'
    const normalized = normalizePoemText(raw)
    expect(normalized).toBe('Строфа 1\nСтрока 2\n\nСтрофа 2\nСтрока 4')
    expect(normalized.split(/\n\s*\n/).length).toBe(2)
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

  it('fetches catalog poems and normalizes literal newlines', async () => {
    const mockPoems = [
      { id: '1', title: 'Парус', author: 'Михаил Лермонтов', text: 'Белеет парус\\nВ тумане моря\\n\\nИграют волны', tags: ['классика'] },
      { id: '2', title: 'Зимнее утро', author: 'Александр Пушкин', text: 'Мороз и солнце', tags: ['пейзаж'] },
    ]

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPoems,
    })

    const poems = await fetchCatalogPoems()
    expect(poems[0].text).toBe('Белеет парус\nВ тумане моря\n\nИграют волны')
    expect(poems[1].text).toBe('Мороз и солнце')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/catalog_poems'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Accept': 'application/json',
        }),
      })
    )
  })

  it('returns empty array when network fails or response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    const poems = await fetchCatalogPoems()
    expect(poems).toEqual([])
  })

  it('handles exceptions gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const poems = await fetchCatalogPoems()
    expect(poems).toEqual([])
  })
})
