import { useMemo, useEffect, useState } from 'react'
import clsx from 'clsx'

// Match words (Russian and English letters) and non-words (punctuation, spaces, newlines)
const TOKENIZER_REGEX = /([а-яА-ЯёЁa-zA-Z]+)|([^а-яА-ЯёЁa-zA-Z]+)/g

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export default function MemorizeText({ text, mode, sliderValue }) {
  // We need deterministic shuffling per text chunk for the eraser mode
  // so the hidden words don't jump around when the slider moves.
  const [shuffledWordIndices, setShuffledWordIndices] = useState([])
  
  const tokens = useMemo(() => {
    if (!text) return []
    const result = []
    let match
    
    // Reset lastIndex just in case
    TOKENIZER_REGEX.lastIndex = 0
    
    while ((match = TOKENIZER_REGEX.exec(text)) !== null) {
      if (match[1]) {
        result.push({ type: 'word', value: match[1] })
      } else if (match[2]) {
        result.push({ type: 'non-word', value: match[2] })
      }
    }
    return result
  }, [text])

  // Get total number of words and generate a shuffled list of their indices
  useEffect(() => {
    const wordIndices = tokens
      .map((t, i) => t.type === 'word' ? i : -1)
      .filter(i => i !== -1)
    
    setShuffledWordIndices(shuffle([...wordIndices]))
  }, [tokens])

  const renderTokens = () => {
    if (shuffledWordIndices.length === 0 && tokens.length > 0) {
        // Fallback before shuffle happens
        return tokens.map((t, i) => <span key={i}>{t.value}</span>)
    }

    const totalWords = shuffledWordIndices.length
    // Number of words to hide based on slider (0 to totalWords)
    const wordsToHideCount = Math.floor((sliderValue / 100) * totalWords)
    // The indices of the words that should be hidden
    const hiddenIndices = new Set(shuffledWordIndices.slice(0, wordsToHideCount))

    return tokens.map((token, index) => {
      if (token.type === 'non-word') {
        return <span key={index}>{token.value}</span>
      }

      const word = token.value
      
      if (mode === 'eraser') {
        if (hiddenIndices.has(index)) {
          return (
            <span key={index} className="text-gray-300 dark:text-zinc-600 transition-colors">
              {'___'}
            </span>
          )
        }
        return <span key={index}>{word}</span>
      } 
      
      if (mode === 'first-letters') {
        // For first-letters:
        // Words 1-2 letters long stay full until 100%. At 100% they become 1 letter (which they might already be).
        // Words > 2 letters long gradually lose letters from the end based on slider.
        // length at 0% = word.length
        // length at 100% = 1
        
        let visibleLength = word.length
        
        if (word.length <= 2) {
          if (sliderValue === 100) {
            visibleLength = 1
          } else {
            visibleLength = word.length
          }
        } else {
          // linear interpolation between word.length and 1
          // if slider is 0 -> word.length
          // if slider is 100 -> 1
          const factor = 1 - (sliderValue / 100)
          visibleLength = Math.max(1, Math.round(1 + (word.length - 1) * factor))
        }

        const visiblePart = word.substring(0, visibleLength)
        // We use transparent text for the rest to keep the sizing the same
        const hiddenPart = word.substring(visibleLength)

        return (
          <span key={index}>
            {visiblePart}
            {hiddenPart.length > 0 && (
              <span className="opacity-0">{hiddenPart}</span>
            )}
          </span>
        )
      }

      return null
    })
  }

  return (
    <div className="whitespace-pre-wrap text-lg md:text-xl leading-relaxed text-left font-medium">
      {renderTokens()}
    </div>
  )
}
