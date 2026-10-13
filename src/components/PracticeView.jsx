import { useState, useMemo, useEffect, useRef } from 'react'
import { ArrowLeft, Eraser, Type, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import MemorizeText from './MemorizeText'
import { normalizePoemText } from '../lib/supabase'

export default function PracticeView({ 
  text, 
  onBack, 
  sliderStep = 5, 
  revealDuration = 5,
  fontSize = 15,
  setFontSize = () => {},
  onCompleteSession = () => {}
}) {
  const [sliderValue, setSliderValue] = useState(0)
  const [mode, setMode] = useState('eraser') // 'eraser' | 'first-letters'
  const hasTrainedRef = useRef(false)

  // Track semantic training: reached at least 70% difficulty during session
  useEffect(() => {
    if (sliderValue >= 70) {
      hasTrainedRef.current = true
    }
  }, [sliderValue])

  const handleBack = () => {
    if (hasTrainedRef.current) {
      onCompleteSession()
    }
    onBack()
  }

  // Split into chunks by double newline
  const chunks = useMemo(() => {
    // Universal newline normalization (standard \n, \r\n, literal \n, /n line delimiters)
    const normalizedText = normalizePoemText(text)
    const parts = normalizedText.split(/\n\s*\n/)
    return parts.filter(p => p.trim().length > 0)
  }, [text])

  const [activeChunkIndices, setActiveChunkIndices] = useState(new Set([0])) // Set of active chunk indices

  // Reset active chunk to the first chunk when poem/text changes, while keeping difficulty level
  useEffect(() => {
    setActiveChunkIndices(new Set([0]))
    hasTrainedRef.current = false
  }, [text])

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
    <>
      <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-300 pb-36 sm:pb-32">

        {/* Top Bar: Back, Font Size & Toggle */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center justify-between">
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-2 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Назад</span>
            </button>

            {/* Font size quick adjuster */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                disabled={fontSize <= 12}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                title="Уменьшить шрифт"
                aria-label="Уменьшить шрифт"
              >
                A-
              </button>
              <span className="text-[11px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 px-1 min-w-[26px] text-center select-none">
                {fontSize}
              </span>
              <button
                type="button"
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                disabled={fontSize >= 24}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                title="Увеличить шрифт"
                aria-label="Увеличить шрифт"
              >
                A+
              </button>
            </div>
          </div>

          {/* Mode Toggle (Segmented Control) */}
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setMode('eraser')}
              className={clsx(
                "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm transition-all border",
                mode === 'eraser'
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-sm font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              )}
            >
              <Eraser className="w-4 h-4" />
              <span>Ластик</span>
            </button>
            <button
              onClick={() => setMode('first-letters')}
              className={clsx(
                "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm transition-all border",
                mode === 'first-letters'
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-sm font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              )}
            >
              <Type className="w-4 h-4" />
              <span>Первые буквы</span>
            </button>
          </div>
        </div>

        {/* Parts Navigation */}
        {chunks.length > 1 && (
          <div 
            className="flex overflow-x-auto pb-2 w-full max-w-full hide-scrollbar gap-2 overscroll-x-contain touch-pan-x"
            style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
          >
            {chunks.map((_, i) => (
              <button
                key={i}
                onClick={() => toggleChunk(i)}
                className={clsx(
                  "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 border shrink-0",
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
                "whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 border ml-1 shrink-0",
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
        <div 
          className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 md:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-sm min-h-[40vh] font-serif leading-relaxed overflow-x-auto overscroll-x-contain touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <MemorizeText
            text={displayedText}
            mode={mode}
            sliderValue={sliderValue}
            revealDuration={revealDuration}
            fontSize={fontSize}
          />
        </div>
      </div>

      {/* Fixed Bottom Slider */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 p-3.5 md:p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] z-30 shadow-lg">
        <div className="max-w-2xl mx-auto flex flex-col gap-2.5">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs md:text-sm font-medium text-zinc-600 dark:text-zinc-400">Скрыто</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setSliderValue(prev => Math.max(0, prev - sliderStep))}
                className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-xs md:text-sm font-medium transition-colors active:scale-95 cursor-pointer"
              >
                -{sliderStep}%
              </button>
              <button 
                onClick={() => setSliderValue(prev => Math.min(100, prev + sliderStep))}
                className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-xs md:text-sm font-medium transition-colors active:scale-95 cursor-pointer"
              >
                +{sliderStep}%
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full pt-1">
            <Eye className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100 transition-all touch-none"
            />
            <EyeOff className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-2.5 py-0.5 rounded-full text-xs font-semibold min-w-[3.25rem] text-center shrink-0 ml-1">
              {sliderValue}%
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
