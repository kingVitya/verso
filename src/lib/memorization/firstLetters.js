/**
 * Calculates visible and hidden parts of a word in 'first-letters' mode.
 * Based on slider value (0 to 100), reveals progressively fewer letters
 * until only the first letter is visible at 100%.
 */
export function calculateWordVisibility(word, sliderValue) {
  if (!word || typeof word !== 'string') {
    return { visiblePart: '', hiddenPart: '' }
  }

  const safeSlider = Math.max(0, Math.min(100, Number(sliderValue) || 0))
  let visibleLength = word.length

  if (word.length <= 2) {
    if (safeSlider === 100) {
      visibleLength = 1
    } else {
      visibleLength = word.length
    }
  } else {
    const factor = 1 - safeSlider / 100
    visibleLength = Math.max(1, Math.round(1 + (word.length - 1) * factor))
  }

  return {
    visiblePart: word.substring(0, visibleLength),
    hiddenPart: word.substring(visibleLength),
  }
}
