import { useState, useMemo } from 'react'
import { 
  Plus, 
  BookOpen, 
  Share2, 
  Trash2, 
  Edit, 
  Loader2, 
  X
} from 'lucide-react'
import clsx from 'clsx'
import LZString from 'lz-string'
import { sharePoemToSupabase } from '../lib/supabase'
import { copyToClipboard } from '../lib/clipboard'

export default function LibraryView({ 
  poems = [], 
  onOpen, 
  onAdd, 
  onEdit, 
  onDelete 
}) {
  const [copiedId, setCopiedId] = useState(null)
  const [sharingPoemId, setSharingPoemId] = useState(null)
  const [sharePoemModal, setSharePoemModal] = useState(null)

  const handleSharePoem = async (e, poem) => {
    e.stopPropagation()
    if (sharingPoemId) return
    setSharingPoemId(poem.id)

    let shareUrl = ''
    try {
      const shortId = await sharePoemToSupabase(poem.text, poem.title)
      shareUrl = `${window.location.origin}${window.location.pathname}?p=${shortId}`
    } catch (err) {
      console.warn('Supabase share error, falling back to local compression:', err)
      const payload = JSON.stringify({
        title: poem.title || '',
        text: poem.text
      })
      const compressed = LZString.compressToEncodedURIComponent(payload)
      shareUrl = `${window.location.origin}${window.location.pathname}?share=${compressed}`
    }

    const wasCopied = await copyToClipboard(shareUrl)
    if (wasCopied) {
      setCopiedId(poem.id)
      setTimeout(() => setCopiedId(null), 2500)
    }

    setSharePoemModal({
      poem,
      url: shareUrl,
      copied: wasCopied,
    })
    setSharingPoemId(null)
  }

  const handleDeletePoem = (e, id) => {
    e.stopPropagation()
    if (window.confirm('Точно удалить этот стих?')) {
      onDelete(id)
    }
  }

  const handleEditPoem = (e, poem) => {
    e.stopPropagation()
    onEdit(poem)
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      


      {/* Header Actions */}
      {poems.length > 0 && (
        <div className="flex items-center justify-between px-1 mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Ваша библиотека</h2>
            <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
              {poems.length} {poems.length === 1 ? 'стих' : (poems.length >= 2 && poems.length <= 4) ? 'стиха' : 'стихов'}
            </span>
          </div>
          <button
            id="btn-add-poem"
            type="button"
            onClick={() => onAdd()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить стих</span>
          </button>
        </div>
      )}

      {/* Main Poems Grid / Empty States */}
      {poems.length === 0 ? (
        <div className="text-center text-zinc-500 dark:text-zinc-400 mt-10 flex flex-col items-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-zinc-800 dark:text-zinc-200">Ваша библиотека пуста.</p>
          <p className="text-sm mt-1 mb-5">Добавьте первый стих, чтобы начать заучивание!</p>
          <button
            type="button"
            onClick={() => onAdd()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить стих</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {poems.map((poem) => (
            <div 
              key={poem.id}
              onClick={() => onOpen(poem)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm group relative"
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                  {poem.title || 'Без названия'}
                </h3>
              </div>
              
              <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed font-serif whitespace-pre-line">
                {poem.text}
              </p>

              <div className="mt-auto pt-3.5 flex items-center justify-end border-t border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleEditPoem(e, poem)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Редактировать"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSharePoem(e, poem)}
                    disabled={sharingPoemId === poem.id}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative cursor-pointer active:scale-90"
                    title="Поделиться стихом"
                  >
                    {sharingPoemId === poem.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-600 dark:text-zinc-300" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    {copiedId === poem.id && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-medium px-2.5 py-1 rounded-lg shadow whitespace-nowrap z-10 animate-in fade-in zoom-in-95">
                        Скопировано!
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeletePoem(e, poem.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
