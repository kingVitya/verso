import { useState, useEffect, useMemo } from 'react'
import { Search, X, BookOpen, Play, Plus, Check, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { fetchCatalogPoems } from '../lib/supabase'

const normalizeTextForMatch = (text) => {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]/gi, '')
    .slice(0, 80)
}

const normalizeTitleForMatch = (title) => {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]/gi, '')
}

export default function CatalogView({ onPractice, onAddToLibrary, userPoems = [] }) {
  const [poems, setPoems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('all')

  // Load catalog poems on mount
  const loadCatalog = async () => {
    setLoading(true)
    try {
      const data = await fetchCatalogPoems()
      setPoems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCatalog()
  }, [])

  // Purely derive library presence from userPoems (updates automatically when added or deleted)
  const userLibraryFingerprints = useMemo(() => {
    const textSet = new Set()
    const titleSet = new Set()

    for (const p of userPoems) {
      const textNorm = normalizeTextForMatch(p.text)
      if (textNorm) {
        textSet.add(textNorm)
      }
      const titleNorm = normalizeTitleForMatch(p.title)
      if (titleNorm) {
        titleSet.add(titleNorm)
      }
    }

    return { textSet, titleSet }
  }, [userPoems])

  const checkIsAlreadyAdded = (poem) => {
    const textNorm = normalizeTextForMatch(poem.text)
    if (textNorm && userLibraryFingerprints.textSet.has(textNorm)) {
      return true
    }

    const fullTitleNorm = normalizeTitleForMatch(`${poem.author} ${poem.title}`)
    if (fullTitleNorm && userLibraryFingerprints.titleSet.has(fullTitleNorm)) {
      return true
    }

    const titleNorm = normalizeTitleForMatch(poem.title)
    if (titleNorm && userLibraryFingerprints.titleSet.has(titleNorm)) {
      return true
    }

    return false
  }

  // Extract unique authors
  const authors = useMemo(() => {
    const list = Array.from(new Set(poems.map((p) => p.author).filter(Boolean))).sort()
    return ['all', ...list]
  }, [poems])

  // Filter poems based on search query and selected author
  const filteredPoems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return poems.filter((poem) => {
      // Author filter
      if (selectedAuthor !== 'all' && poem.author !== selectedAuthor) {
        return false
      }
      // Search filter
      if (!query) return true
      const matchTitle = (poem.title || '').toLowerCase().includes(query)
      const matchAuthor = (poem.author || '').toLowerCase().includes(query)
      const matchText = (poem.text || '').toLowerCase().includes(query)
      const matchTags = Array.isArray(poem.tags) && poem.tags.some((t) => String(t).toLowerCase().includes(query))
      return matchTitle || matchAuthor || matchText || matchTags
    })
  }, [poems, searchQuery, selectedAuthor])

  const handleAdd = (poem) => {
    onAddToLibrary({
      title: `${poem.author} - ${poem.title}`,
      text: poem.text,
    })
  }

  const handlePractice = (poem) => {
    onPractice({
      title: `${poem.author} - ${poem.title}`,
      text: poem.text,
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по автору, названию или строчке..."
            className="w-full pl-10.5 pr-10 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-sm focus:border-zinc-900 dark:focus:border-zinc-100 outline-none transition-all placeholder:text-zinc-400 dark:text-zinc-100 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Author Chips */}
        {authors.length > 1 && (
          <div
            className="flex overflow-x-auto pb-1 gap-2 hide-scrollbar overscroll-x-contain touch-pan-x"
            style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
          >
            {authors.map((author) => (
              <button
                key={author}
                onClick={() => setSelectedAuthor(author)}
                className={clsx(
                  "whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 border",
                  selectedAuthor === author
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                    : "bg-white text-zinc-600 border-zinc-200/80 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800"
                )}
              >
                {author === 'all' ? `Все авторы (${poems.length})` : author}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 animate-pulse"
            >
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-5/6" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPoems.length === 0 ? (
        <div className="text-center text-zinc-500 dark:text-zinc-400 py-16 flex flex-col items-center gap-3">
          <BookOpen className="w-12 h-12 opacity-20" />
          <p className="font-medium text-base">
            {searchQuery ? 'Ничего не найдено' : 'Каталог пуст'}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs">
            {searchQuery
              ? 'Попробуйте изменить поисковый запрос или выбрать другого автора'
              : 'Стихи ещё не добавлены в таблицу catalog_poems в Supabase'}
          </p>
          {!searchQuery && (
            <button
              onClick={loadCatalog}
              className="mt-2 flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Обновить</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPoems.map((poem) => {
            const isAlreadyAdded = checkIsAlreadyAdded(poem)

            return (
              <div
                key={poem.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                    {poem.author}
                  </span>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg leading-snug mt-0.5">
                    {poem.title}
                  </h3>
                </div>

                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed font-serif whitespace-pre-line">
                  {poem.text}
                </p>

                {Array.isArray(poem.tags) && poem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {poem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 rounded-md px-2 py-0.5 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-4 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800/50">
                  <button
                    onClick={() => handlePractice(poem)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Учить</span>
                  </button>

                  <button
                    onClick={() => handleAdd(poem)}
                    disabled={isAlreadyAdded}
                    className={clsx(
                      "flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl font-medium text-xs transition-all select-none",
                      isAlreadyAdded
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 cursor-default opacity-90"
                        : "bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer active:scale-[0.98]"
                    )}
                  >
                    {isAlreadyAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                        <span>В библиотеке</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Добавить</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
