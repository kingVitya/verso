import { useState, useEffect, useMemo } from 'react'
import { 
  Search, 
  X, 
  BookOpen, 
  Play, 
  Plus, 
  Check, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Tag, 
  User
} from 'lucide-react'
import clsx from 'clsx'
import { fetchCatalogPoems, fetchCatalogMetadata } from '../lib/supabase'
import { 
  generateCatalogCacheKey, 
  getCachedCatalogPage, 
  setCachedCatalogPage, 
  getCachedCatalogMetadata, 
  setCachedCatalogMetadata, 
  clearCatalogCache 
} from '../lib/catalogCache'

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

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages = [1]
  if (currentPage > 3) {
    pages.push('...')
  }
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  if (currentPage < totalPages - 2) {
    pages.push('...')
  }
  pages.push(totalPages)
  return pages
}

export default function CatalogView({ onPractice, onAddToLibrary, userPoems = [] }) {
  const [poems, setPoems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters and pagination state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('all')
  const [selectedTag, setSelectedTag] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  // Metadata: unique authors and tags
  const [metadata, setMetadata] = useState({
    sortedAuthors: [],
    counts: {},
    topAuthors: [],
    tags: [],
    totalCount: 0,
  })

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, selectedAuthor, selectedTag, pageSize])

  // Load catalog metadata (authors and tags) on mount (cached in session/memory)
  const loadMetadata = async (force = false) => {
    if (!force) {
      const cached = getCachedCatalogMetadata()
      if (cached) {
        setMetadata(cached)
        return
      }
    }

    try {
      const data = await fetchCatalogMetadata()
      setMetadata(data)
      setCachedCatalogMetadata(data)
    } catch (e) {
      console.warn('Failed to load catalog metadata', e)
    }
  }

  useEffect(() => {
    loadMetadata()
  }, [])

  // Load active page of poems with Cache-First strategy
  useEffect(() => {
    let isCancelled = false

    const loadPage = async () => {
      const cacheKey = generateCatalogCacheKey({
        page,
        pageSize,
        searchQuery: debouncedQuery,
        selectedAuthor,
        selectedTag,
      })

      // 1. Check local cache first: if already downloaded, serve immediately with 0 network requests
      const cached = getCachedCatalogPage(cacheKey)
      if (cached) {
        setPoems(cached.poems)
        setTotalCount(cached.totalCount)
        setLoading(false)
        return
      }

      // 2. Fetch from Supabase with server pagination and filtering
      setLoading(true)
      try {
        const result = await fetchCatalogPoems({
          page,
          pageSize,
          searchQuery: debouncedQuery,
          selectedAuthor,
          selectedTag,
        })

        if (!isCancelled) {
          setPoems(result.poems)
          setTotalCount(result.totalCount)
          setCachedCatalogPage(cacheKey, result)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadPage()

    return () => {
      isCancelled = true
    }
  }, [page, pageSize, debouncedQuery, selectedAuthor, selectedTag])

  // Force refresh: clear local cache and re-fetch both metadata and current page
  const handleForceRefresh = async () => {
    setRefreshing(true)
    clearCatalogCache()
    await loadMetadata(true)
    const result = await fetchCatalogPoems({
      page,
      pageSize,
      searchQuery: debouncedQuery,
      selectedAuthor,
      selectedTag,
    })
    const cacheKey = generateCatalogCacheKey({
      page,
      pageSize,
      searchQuery: debouncedQuery,
      selectedAuthor,
      selectedTag,
    })
    setCachedCatalogPage(cacheKey, result)
    setPoems(result.poems)
    setTotalCount(result.totalCount)
    setRefreshing(false)
  }

  // Derive library presence from userPoems
  const userLibraryFingerprints = useMemo(() => {
    const textSet = new Set()
    const titleSet = new Set()

    for (const p of userPoems) {
      const textNorm = normalizeTextForMatch(p.text)
      if (textNorm) textSet.add(textNorm)
      const titleNorm = normalizeTitleForMatch(p.title)
      if (titleNorm) titleSet.add(titleNorm)
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

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safeCurrentPage = Math.min(page, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalCount)

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === safeCurrentPage) return
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

  const hasActiveFilters = searchQuery !== '' || selectedAuthor !== 'all' || selectedTag !== 'all'

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedAuthor('all')
    setSelectedTag('all')
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-3">
        {/* Search Bar with Refresh Button */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по автору, названию, строчке или тегу..."
              className="w-full pl-10.5 pr-10 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-sm focus:border-zinc-900 dark:focus:border-zinc-100 outline-none transition-all placeholder:text-zinc-400 dark:text-zinc-100 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title="Очистить поиск"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={handleForceRefresh}
            disabled={refreshing}
            className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
            title="Обновить каталог из Supabase"
          >
            <RefreshCw className={clsx("w-5 h-5", refreshing && "animate-spin text-zinc-900 dark:text-zinc-100")} />
          </button>
        </div>

        {/* Authors Row: Quick Chips + Full Dropdown Selector */}
        {metadata.sortedAuthors.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            {/* Quick chips container */}
            <div
              className="flex items-center overflow-x-auto pb-1 gap-2 hide-scrollbar overscroll-x-contain touch-pan-x flex-1"
              style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
            >
              <button
                onClick={() => setSelectedAuthor('all')}
                className={clsx(
                  "whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 border",
                  selectedAuthor === 'all'
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                    : "bg-white text-zinc-600 border-zinc-200/80 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800"
                )}
              >
                Все авторы ({metadata.totalCount || totalCount})
              </button>

              {metadata.topAuthors.map((author) => (
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
                  {author} ({metadata.counts[author] || 0})
                </button>
              ))}

              {/* If active author is not in top authors, show it as an active chip */}
              {selectedAuthor !== 'all' && !metadata.topAuthors.includes(selectedAuthor) && (
                <button
                  onClick={() => setSelectedAuthor(selectedAuthor)}
                  className="whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shrink-0 border cursor-pointer"
                >
                  {selectedAuthor} ({metadata.counts[selectedAuthor] || 1})
                </button>
              )}
            </div>

            {/* Author Dropdown selector for all authors */}
            {metadata.sortedAuthors.length > 5 && (
              <div className="relative inline-flex items-center shrink-0">
                <select
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="appearance-none w-full sm:w-auto pl-8 pr-8 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <option value="all">Выбрать автора из {metadata.sortedAuthors.length}...</option>
                  {metadata.sortedAuthors.map((author) => (
                    <option key={author} value={author}>
                      {author} ({metadata.counts[author] || 0})
                    </option>
                  ))}
                </select>
                <User className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 pointer-events-none" />
              </div>
            )}
          </div>
        )}

        {/* Tags Row */}
        {metadata.tags.length > 0 && (
          <div
            className="flex items-center overflow-x-auto pb-1 gap-1.5 hide-scrollbar overscroll-x-contain touch-pan-x"
            style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
          >
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Тема:
            </span>

            <button
              onClick={() => setSelectedTag('all')}
              className={clsx(
                "whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0",
                selectedTag === 'all'
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:text-zinc-300"
              )}
            >
              Все темы
            </button>

            {metadata.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={clsx(
                  "whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0",
                  selectedTag === tag
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:text-zinc-300"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Active Filters Summary & Reset */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <span>Найдено: <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{totalCount}</strong></span>
              {selectedAuthor !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  {selectedAuthor}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-red-500" 
                    onClick={() => setSelectedAuthor('all')} 
                  />
                </span>
              )}
              {selectedTag !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  #{selectedTag}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-red-500" 
                    onClick={() => setSelectedTag('all')} 
                  />
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  «{searchQuery}»
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-red-500" 
                    onClick={() => setSearchQuery('')} 
                  />
                </span>
              )}
            </div>

            <button
              onClick={resetFilters}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium cursor-pointer underline underline-offset-2"
            >
              Сбросить фильтры
            </button>
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
      ) : poems.length === 0 ? (
        <div className="text-center text-zinc-500 dark:text-zinc-400 py-16 flex flex-col items-center gap-3">
          <BookOpen className="w-12 h-12 opacity-20" />
          <p className="font-medium text-base">
            {hasActiveFilters ? 'Ничего не найдено' : 'Каталог пуст'}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs">
            {hasActiveFilters
              ? 'Попробуйте изменить поисковый запрос, автора или сбросить фильтры'
              : 'Стихи ещё не добавлены в таблицу catalog_poems в Supabase'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="mt-2 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Сбросить все фильтры
            </button>
          ) : (
            <button
              onClick={handleForceRefresh}
              className="mt-2 flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Обновить</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Poems Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {poems.map((poem) => {
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
                        <button
                          type="button"
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTag(tag)
                          }}
                          className={clsx(
                            "text-[10px] rounded-md px-2 py-0.5 font-medium transition-colors cursor-pointer",
                            selectedTag === tag
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                              : "bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                          )}
                          title={`Показать все стихи с тегом #${tag}`}
                        >
                          #{tag}
                        </button>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-zinc-200/80 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Показано <span className="font-semibold text-zinc-800 dark:text-zinc-200">{startIndex + 1}–{endIndex}</span> из <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalCount}</span> стихов
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer border border-zinc-200/80 dark:border-zinc-800"
                  title="Предыдущая страница"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`dots-${idx}`} className="px-1.5 text-xs text-zinc-400 select-none">
                        …
                      </span>
                    )
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={clsx(
                        "min-w-[34px] h-8.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
                        safeCurrentPage === p
                          ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-xs"
                          : "bg-white text-zinc-700 border-zinc-200/80 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800"
                      )}
                    >
                      {p}
                    </button>
                  )
                })}

                <button
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer border border-zinc-200/80 dark:border-zinc-800"
                  title="Следующая страница"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Items per page selector */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span>По:</span>
                <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-0.5 rounded-lg">
                  {[12, 24, 48].map((size) => (
                    <button
                      key={size}
                      onClick={() => setPageSize(size)}
                      className={clsx(
                        "px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                        pageSize === size
                          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
