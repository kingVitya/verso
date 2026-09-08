import { useState } from 'react'
import { Plus, BookOpen, Share2, Trash2, Edit, Loader2, X, Copy, Check } from 'lucide-react'
import LZString from 'lz-string'
import { sharePoemToSupabase } from '../lib/supabase'
import { copyToClipboard } from '../lib/clipboard'

export default function LibraryView({ poems, onOpen, onAdd, onEdit, onDelete }) {
  const [copiedId, setCopiedId] = useState(null)
  const [sharingId, setSharingId] = useState(null)
  const [shareModal, setShareModal] = useState(null) // { poem, url, copied }

  const handleShare = async (e, poem) => {
    e.stopPropagation()
    if (sharingId) return
    setSharingId(poem.id)

    let shareUrl = ''

    // 1. Try to create ultra-short link in Supabase
    try {
      const shortId = await sharePoemToSupabase(poem.text, poem.title)
      shareUrl = `${window.location.origin}${window.location.pathname}?p=${shortId}`
    } catch (err) {
      console.warn('Supabase share error, falling back to local compression:', err)
      // Fallback: local compression with both title and text
      const payload = JSON.stringify({
        title: poem.title || '',
        text: poem.text
      })
      const compressed = LZString.compressToEncodedURIComponent(payload)
      shareUrl = `${window.location.origin}${window.location.pathname}?share=${compressed}`
    }

    // 2. Automatically copy to clipboard
    const wasCopied = await copyToClipboard(shareUrl)
    if (wasCopied) {
      setCopiedId(poem.id)
      setTimeout(() => setCopiedId(null), 2500)
    }

    // 3. Open share modal so user always sees the link and has direct controls
    setShareModal({
      poem,
      url: shareUrl,
      copied: wasCopied,
    })
    setSharingId(null)
  }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (window.confirm('Точно удалить этот стих?')) {
      onDelete(id)
    }
  }

  const handleEdit = (e, poem) => {
    e.stopPropagation()
    onEdit(poem)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <button 
        onClick={onAdd}
        className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl font-medium text-[15px] text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all active:scale-[0.98] cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        <span>Добавить новый стих</span>
      </button>

      {poems.length === 0 ? (
        <div className="text-center text-zinc-500 dark:text-zinc-400 mt-10">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Ваша библиотека пуста.</p>
          <p className="text-sm">Добавьте первый стих, чтобы начать заучивание!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {poems.map((poem) => (
            <div 
              key={poem.id}
              onClick={() => onOpen(poem)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm group"
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                  {poem.title || 'Без названия'}
                </h3>
              </div>
              
              <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed font-serif whitespace-pre-line">
                {poem.text}
              </p>

              <div className="mt-auto pt-4 flex items-center justify-end gap-1.5 border-t border-zinc-100 dark:border-zinc-800/50">
                <button
                  onClick={(e) => handleEdit(e, poem)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                  title="Редактировать"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleShare(e, poem)}
                  disabled={sharingId === poem.id}
                  className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors relative cursor-pointer active:scale-90"
                  title="Поделиться"
                >
                  {sharingId === poem.id ? (
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
                  onClick={(e) => handleDelete(e, poem.id)}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal Dialog */}
      {shareModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShareModal(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Поделиться стихом
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                  «{shareModal.poem.title || 'Без названия'}»
                </p>
              </div>
              <button 
                onClick={() => setShareModal(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Короткая ссылка:
              </label>
              <div className="flex gap-2 items-center">
                <input 
                  readOnly
                  value={shareModal.url}
                  onClick={(e) => e.target.select()}
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-800 dark:text-zinc-200 select-all outline-none"
                />
                <button
                  onClick={async () => {
                    const ok = await copyToClipboard(shareModal.url)
                    if (ok) {
                      setShareModal(prev => ({ ...prev, copied: true }))
                      setTimeout(() => setShareModal(prev => prev ? { ...prev, copied: false } : null), 2500)
                    }
                  }}
                  className="px-3.5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-medium text-xs hover:bg-zinc-800 dark:hover:bg-white transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                >
                  {shareModal.copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Копировать</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: shareModal.poem.title || 'Стих в Verso',
                      text: `Стих «${shareModal.poem.title || 'Без названия'}» для заучивания в Verso:`,
                      url: shareModal.url,
                    })
                  } catch (err) {
                    if (err.name !== 'AbortError') {
                      console.warn('Native share failed', err)
                    }
                  }
                }}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 text-zinc-800 dark:text-zinc-200 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Открыть меню «Поделиться»</span>
              </button>
            )}

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed text-center">
              {shareModal.copied 
                ? 'Ссылка уже скопирована в буфер обмена! Отправьте её друзьям.' 
                : 'Любой, кто откроет ссылку, сразу получит этот стих в приложении.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
