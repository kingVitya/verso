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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Bar: Back & Toggle */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 self-start md:self-auto text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors py-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Назад</span>
        </button>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-gray-200 dark:bg-zinc-800 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setMode('eraser')}
            className={clsx(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all",
              mode === 'eraser' 
                ? "bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <Eraser className="w-4 h-4" />
            <span>Ластик</span>
          </button>
          <button
            onClick={() => setMode('first-letters')}
            className={clsx(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all",
              mode === 'first-letters' 
                ? "bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                  : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-800 hover:border-purple-300"
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
                ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-800 hover:border-indigo-300"
            )}
          >
            Выбрать все
          </button>
        </div>
      )}

      {/* Main Text Area */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-zinc-800 shadow-sm min-h-[40vh]">
        <MemorizeText 
          text={displayedText} 
          mode={mode} 
          sliderValue={sliderValue} 
        />
      </div>

      {/* Fixed Bottom Slider */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-gray-200 dark:border-zinc-800 p-4 md:p-6 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <span className="text-sm font-bold w-10 text-right text-purple-600 dark:text-purple-400">
            {sliderValue}%
          </span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full h-3 bg-gray-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-600 hover:accent-purple-500 transition-all"
          />
        </div>
      </div>
    </div>
  )
}
