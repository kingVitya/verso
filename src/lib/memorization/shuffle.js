/**
 * Fisher-Yates shuffle algorithm that returns a new array without mutating input.
 */
export function shuffleArray(array) {
  const result = [...array]
  let currentIndex = result.length
  let randomIndex

  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--
    ;[result[currentIndex], result[randomIndex]] = [
      result[randomIndex],
      result[currentIndex],
    ]
  }

  return result
}
