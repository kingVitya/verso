/**
 * Given a deterministic shuffled list of word indices and a slider value (0 - 100),
 * computes the Set of token indices that should be hidden in 'eraser' mode.
 */
export function getHiddenWordIndices(shuffledWordIndices, sliderValue) {
  if (!shuffledWordIndices || shuffledWordIndices.length === 0) {
    return new Set()
  }

  const safeSlider = Math.max(0, Math.min(100, Number(sliderValue) || 0))
  const totalWords = shuffledWordIndices.length
  const wordsToHideCount = Math.floor((safeSlider / 100) * totalWords)

  return new Set(shuffledWordIndices.slice(0, wordsToHideCount))
}
