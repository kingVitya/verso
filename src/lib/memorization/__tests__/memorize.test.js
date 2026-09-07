import { describe, it, expect } from 'vitest'
import { getHiddenWordIndices } from '../hideWords'
import { calculateWordVisibility } from '../firstLetters'
import { shuffleArray } from '../shuffle'

describe('getHiddenWordIndices (Eraser mode)', () => {
  it('hides 0 words when slider is 0%', () => {
    const indices = [0, 2, 4, 6, 8]
    const hidden = getHiddenWordIndices(indices, 0)
    expect(hidden.size).toBe(0)
  })

  it('hides all words when slider is 100%', () => {
    const indices = [0, 2, 4, 6, 8]
    const hidden = getHiddenWordIndices(indices, 100)
    expect(hidden.size).toBe(5)
    expect(hidden).toEqual(new Set(indices))
  })

  it('hides half the words when slider is 50%', () => {
    const indices = [0, 1, 2, 3]
    const hidden = getHiddenWordIndices(indices, 50)
    expect(hidden.size).toBe(2)
    expect(hidden.has(0)).toBe(true)
    expect(hidden.has(1)).toBe(true)
  })

  it('handles negative or >100 slider values gracefully', () => {
    const indices = [0, 1]
    expect(getHiddenWordIndices(indices, -20).size).toBe(0)
    expect(getHiddenWordIndices(indices, 150).size).toBe(2)
  })
})

describe('calculateWordVisibility (First letters mode)', () => {
  it('returns full word when slider is 0%', () => {
    const { visiblePart, hiddenPart } = calculateWordVisibility('Привет', 0)
    expect(visiblePart).toBe('Привет')
    expect(hiddenPart).toBe('')
  })

  it('returns only the first letter when slider is 100%', () => {
    const { visiblePart, hiddenPart } = calculateWordVisibility('Привет', 100)
    expect(visiblePart).toBe('П')
    expect(hiddenPart).toBe('ривет')
  })

  it('leaves single-letter words visible even at 100%', () => {
    const { visiblePart, hiddenPart } = calculateWordVisibility('и', 100)
    expect(visiblePart).toBe('и')
    expect(hiddenPart).toBe('')
  })

  it('leaves two-letter words visible below 100%', () => {
    const { visiblePart, hiddenPart } = calculateWordVisibility('он', 50)
    expect(visiblePart).toBe('он')
    expect(hiddenPart).toBe('')
  })

  it('reduces two-letter words to 1 letter at 100%', () => {
    const { visiblePart, hiddenPart } = calculateWordVisibility('он', 100)
    expect(visiblePart).toBe('о')
    expect(hiddenPart).toBe('н')
  })
})

describe('shuffleArray', () => {
  it('preserves all elements and length', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const shuffled = shuffleArray(original)

    expect(shuffled.length).toBe(original.length)
    expect(new Set(shuffled)).toEqual(new Set(original))
    // Does not mutate original array
    expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
