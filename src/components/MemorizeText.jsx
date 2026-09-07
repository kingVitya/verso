import { useMemo, useEffect, useState, useRef } from 'react'
import clsx from 'clsx'
import { tokenizeText, getWordIndices } from '../lib/memorization/tokenizer'
import { shuffleArray } from '../lib/memorization/shuffle'
import { getHiddenWordIndices } from '../lib/memorization/hideWords'
import { calculateWordVisibility } from '../lib/memorization/firstLetters'

export default function MemorizeText({ text, mode, sliderValue, revealDuration = 5 }) {
  // We need deterministic shuffling per text chunk for the eraser mode
  // so the hidden words don't jump around when the slider moves.
  const [shuffledWordIndices, setShuffledWordIndices] = useState([])
  const [revealedIndices, setRevealedIndices] = useState(new Set())
  const timeoutsRef = useRef(new Map())
  
  const tokens = useMemo(() => {
    return tokenizeText(text)
  }, [text])

  // Get total number of words and generate a shuffled list of their indices
  useEffect(() => {
    const wordIndices = getWordIndices(tokens)
    setShuffledWordIndices(shuffleArray(wordIndices))
    setRevealedIndices(new Set())
    timeoutsRef.current.forEach((timer) => clearTimeout(timer))
    timeoutsRef.current.clear()
  }, [tokens])

  // Reset revealed words and clear timers when mode changes
  useEffect(() => {
    setRevealedIndices(new Set())
    timeoutsRef.current.forEach((timer) => clearTimeout(timer))
    timeoutsRef.current.clear()
  }, [mode])

  // Cleanup all active timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      timeouts.forEach((timer) => clearTimeout(timer))
      timeouts.clear()
    }
  }, [])

  const toggleRevealWord = (index) => {
    setRevealedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        // If clicked again while revealed, hide immediately and cancel timer
        if (timeoutsRef.current.has(index)) {
          clearTimeout(timeoutsRef.current.get(index))
          timeoutsRef.current.delete(index)
        }
        next.delete(index)
      } else {
        // Reveal word
        next.add(index)

        // Clear existing timer for this index if any
        if (timeoutsRef.current.has(index)) {
          clearTimeout(timeoutsRef.current.get(index))
        }

        // If revealDuration > 0, auto-hide after revealDuration seconds
        if (revealDuration > 0) {
          const timerId = setTimeout(() => {
            setRevealedIndices((current) => {
              const updated = new Set(current)
              updated.delete(index)
              return updated
            })
            timeoutsRef.current.delete(index)
          }, revealDuration * 1000)

          timeoutsRef.current.set(index, timerId)
        }
      }
      return next
    })
  }

  const renderTokens = () => {
    if (shuffledWordIndices.length === 0 && tokens.length > 0) {
      // Fallback before shuffle happens
      return tokens.map((t, i) => <span key={i}>{t.value}</span>)
    }

    const hiddenIndices = getHiddenWordIndices(shuffledWordIndices, sliderValue)

    return tokens.map((token, index) => {
      if (token.type === 'non-word') {
        return <span key={index}>{token.value}</span>
      }

      const word = token.value
      const isRevealed = revealedIndices.has(index)
      
      if (mode === 'eraser') {
        if (hiddenIndices.has(index)) {
          if (isRevealed) {
            return (
              <span
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => toggleRevealWord(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleRevealWord(index)
                  }
                }}
                className={clsx(
                  "relative inline-block cursor-pointer select-none px-0.5 text-zinc-900 dark:text-zinc-100 hover:opacity-80 transition-opacity",
                  revealDuration === 0 && "underline decoration-dashed decoration-zinc-400 dark:decoration-zinc-500 underline-offset-4"
                )}
                title={revealDuration > 0 ? `Нажмите, чтобы скрыть раньше (исчезнет через ${revealDuration} сек)` : "Нажмите, чтобы скрыть обратно"}
              >
                <span>{word}</span>
                {revealDuration > 0 && (
                  <span
                    className="absolute bottom-0 left-0 h-[2px] w-full bg-zinc-900 dark:bg-zinc-100 rounded-full origin-left pointer-events-none"
                    style={{
                      animation: `shrinkUnderline ${revealDuration}s linear forwards`,
                    }}
                  />
                )}
              </span>
            )
          }

          return (
            <span
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => toggleRevealWord(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleRevealWord(index)
                }
              }}
              className="cursor-pointer select-none text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 px-1 py-0.5 rounded transition-all inline-block font-mono tracking-wider"
              title={revealDuration > 0 ? `Нажмите, чтобы подсмотреть на ${revealDuration} сек` : "Нажмите, чтобы подсмотреть"}
            >
              {'___'}
            </span>
          )
        }
        return <span key={index}>{word}</span>
      } 
      
      if (mode === 'first-letters') {
        if (isRevealed) {
          return (
            <span
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => toggleRevealWord(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleRevealWord(index)
                }
              }}
              className={clsx(
                "relative inline-block cursor-pointer select-none px-0.5 text-zinc-900 dark:text-zinc-100 hover:opacity-80 transition-opacity",
                revealDuration === 0 && "underline decoration-dashed decoration-zinc-400 dark:decoration-zinc-500 underline-offset-4"
              )}
              title={revealDuration > 0 ? `Нажмите, чтобы скрыть раньше (исчезнет через ${revealDuration} сек)` : "Нажмите, чтобы скрыть обратно"}
            >
              <span>{word}</span>
              {revealDuration > 0 && (
                <span
                  className="absolute bottom-0 left-0 h-[2px] w-full bg-zinc-900 dark:bg-zinc-100 rounded-full origin-left pointer-events-none"
                  style={{
                    animation: `shrinkUnderline ${revealDuration}s linear forwards`,
                  }}
                />
              )}
            </span>
          )
        }

        const { visiblePart, hiddenPart } = calculateWordVisibility(word, sliderValue)

        return (
          <span
            key={index}
            role={hiddenPart.length > 0 ? "button" : undefined}
            tabIndex={hiddenPart.length > 0 ? 0 : undefined}
            onClick={hiddenPart.length > 0 ? () => toggleRevealWord(index) : undefined}
            onKeyDown={hiddenPart.length > 0 ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleRevealWord(index)
              }
            } : undefined}
            className={clsx(
              hiddenPart.length > 0 && "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded px-0.5 transition-colors"
            )}
            title={hiddenPart.length > 0 ? "Нажмите, чтобы подсмотреть на время" : undefined}
          >
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
