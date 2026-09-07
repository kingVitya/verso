import { describe, it, expect } from 'vitest'
import { tokenizeText, getWordIndices } from '../tokenizer'

describe('tokenizeText', () => {
  it('returns empty array for empty or non-string input', () => {
    expect(tokenizeText('')).toEqual([])
    expect(tokenizeText(null)).toEqual([])
    expect(tokenizeText(undefined)).toEqual([])
  })

  it('correctly tokenizes Russian words and punctuation', () => {
    const text = 'Мороз и солнце; день чудесный!'
    const tokens = tokenizeText(text)

    expect(tokens).toEqual([
      { type: 'word', value: 'Мороз' },
      { type: 'non-word', value: ' ' },
      { type: 'word', value: 'и' },
      { type: 'non-word', value: ' ' },
      { type: 'word', value: 'солнце' },
      { type: 'non-word', value: '; ' },
      { type: 'word', value: 'день' },
      { type: 'non-word', value: ' ' },
      { type: 'word', value: 'чудесный' },
      { type: 'non-word', value: '!' },
    ])
  })

  it('correctly tokenizes English words', () => {
    const text = 'Hello, world!'
    const tokens = tokenizeText(text)

    expect(tokens).toEqual([
      { type: 'word', value: 'Hello' },
      { type: 'non-word', value: ', ' },
      { type: 'word', value: 'world' },
      { type: 'non-word', value: '!' },
    ])
  })

  it('preserves multi-line structure and whitespace', () => {
    const text = 'Строка 1\n\nСтрока 2'
    const tokens = tokenizeText(text)
    const reconstituted = tokens.map((t) => t.value).join('')

    expect(reconstituted).toBe(text)
  })
})

describe('getWordIndices', () => {
  it('extracts correct word indices from tokens', () => {
    const tokens = [
      { type: 'word', value: 'Я' },
      { type: 'non-word', value: ' ' },
      { type: 'word', value: 'помню' },
      { type: 'non-word', value: '...' },
    ]
    expect(getWordIndices(tokens)).toEqual([0, 2])
  })
})
