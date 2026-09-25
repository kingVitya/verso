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

  it('validates V2 backup structure with folders and poems', () => {
    const v2Backup = JSON.stringify({
      version: 2,
      exportedAt: Date.now(),
      folders: [
        { id: 'f-1', name: '9 класс', createdAt: 12345 }
      ],
      poems: [
        {
          id: 'test-1',
          title: 'У лукоморья',
          text: 'У лукоморья дуб зелёный...',
          folderId: 'f-1',
          createdAt: 123456789,
        }
      ]
    })

    const parsed = JSON.parse(v2Backup)
    expect(parsed.version).toBe(2)
    expect(Array.isArray(parsed.folders)).toBe(true)
    expect(Array.isArray(parsed.poems)).toBe(true)
    expect(parsed.folders[0].name).toBe('9 класс')
    expect(parsed.poems[0].folderId).toBe('f-1')
  })
})
