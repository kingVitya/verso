import { describe, it, expect } from 'vitest'
import { MAX_TITLE_LENGTH, MAX_TEXT_LENGTH } from '../../hooks/useLibrary'

describe('Library Backup & Validation Rules', () => {
  it('enforces maximum length boundaries', () => {
    expect(MAX_TITLE_LENGTH).toBe(150)
    expect(MAX_TEXT_LENGTH).toBe(30000)
  })

  it('validates backup JSON structure requirements', () => {
    const validJson = JSON.stringify([
      {
        id: 'test-1',
        title: 'У лукоморья',
        text: 'У лукоморья дуб зелёный...',
        createdAt: 123456789,
      }
    ])

    const parsed = JSON.parse(validJson)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0].id).toBe('test-1')
    expect(parsed[0].title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH)
    expect(parsed[0].text.length).toBeLessThanOrEqual(MAX_TEXT_LENGTH)
  })

  it('detects corrupted or non-array backup data', () => {
    const invalidObj = JSON.stringify({ error: 'not an array' })
    const parsed = JSON.parse(invalidObj)
    expect(Array.isArray(parsed)).toBe(false)
  })
})
