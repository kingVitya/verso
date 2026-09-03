import { useState, useMemo } from 'react'
import { ArrowLeft, Eraser, Type } from 'lucide-react'
import clsx from 'clsx'
import MemorizeText from './MemorizeText'

export default function PracticeView({ text, onBack }) {
  const [sliderValue, setSliderValue] = useState(0)
  const [mode, setMode] = useState('eraser') // 'eraser' | 'first-letters'

  // Split into chunks by double newline
  const chunks = useMemo(() => {
    // Normalize newlines, then split by 2 or more newlines
    const normalizedText = text.replace(/\r\n/g, '\n').trim()
    const parts = normalizedText.split(/\n\s*\n/)
    return parts.filter(p => p.trim().length > 0)
  }, [text])

  const [activeChunkIndices, setActiveChunkIndices] = useState(new Set([0])) // Set of active chunk indices

  const displayedText = useMemo(() => {
    // If all selected, or specific selection, join them in order
    const indices = Array.from(activeChunkIndices).sort((a, b) => a - b)
    if (indices.length === 0) return ''
    return indices.map(i => chunks[i]).join('\n\n')
  }, [chunks, activeChunkIndices])

  const toggleChunk = (index) => {
    setActiveChunkIndices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
        // ensure at least one is selected if possible
        if (newSet.size === 0 && chunks.length > 0) {
          newSet.add(0)
        }
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const selectAllChunks = () => {
    setActiveChunkIndices(new Set(chunks.map((_, i) => i)))
  }

  const isAllSelected = activeChunkIndices.size === chunks.length

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Top Bar: Back & Toggle */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 self-start md:self-auto text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Назад</span>
        </button>

        {/* Mode Toggle (Segmented Control) */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setMode('eraser')}
            className={clsx(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm transition-all",
              mode === 'eraser'
                ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white font-medium"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            )}
          >
            <Eraser className="w-4 h-4" />
            <span>Ластик</span>
          </button>
          <button
            onClick={() => setMode('first-letters')}
            className={clsx(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm transition-all",
              mode === 'first-letters'
                ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white font-medium"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            )}
          >
            <Type className="w-4 h-4" />
            <span>Первые буквы</span>
          </button>
        </div>
      </div>

      {/* Parts Navigation */}
      {chunks.length > 1 && (
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar gap-2">
          {chunks.map((_, i) => (
            <button
              key={i}
              onClick={() => toggleChunk(i)}
              className={clsx(
                "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 border",
                activeChunkIndices.has(i)
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                  : "bg-zinc-100 text-zinc-600 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              Часть {i + 1}
            </button>
          ))}
          <button
            onClick={selectAllChunks}
            className={clsx(
              "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 border ml-2",
              isAllSelected
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                : "bg-zinc-100 text-zinc-600 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            Выбрать все
          </button>
        </div>
      )}

      {/* Main Text Area */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-sm min-h-[40vh] font-serif leading-relaxed">
        <MemorizeText
          text={displayedText}
          mode={mode}
          sliderValue={sliderValue}
        />
      </div>

      {/* Fixed Bottom Slider */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-zinc-200/70 dark:border-zinc-800 p-4 pb-12 md:p-6 z-20">
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-4 w-full">
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100 transition-all"
            />
            <span className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1 rounded-full text-xs font-semibold min-w-[3.5rem] text-center">
              {sliderValue}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
