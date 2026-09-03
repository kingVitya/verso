import { useState } from 'react'
import { Plus, BookOpen, Share2, Trash2, Edit } from 'lucide-react'
import LZString from 'lz-string'

export default function LibraryView({ poems, onOpen, onAdd, onEdit, onDelete }) {
  const [copiedId, setCopiedId] = useState(null)

  const handleShare = (e, poem) => {
    e.stopPropagation()
    // Compress poem text
    const compressed = LZString.compressToEncodedURIComponent(poem.text)
    const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(poem.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
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
        className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl font-medium text-[15px] text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all active:scale-[0.98]"
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
                  {poem.title}
                </h3>
              </div>
              
              <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed font-serif">
                {poem.text}
              </p>

              <div className="mt-auto pt-4 flex items-center justify-end gap-1.5 border-t border-zinc-100 dark:border-zinc-800/50">
                <button
                  onClick={(e) => handleEdit(e, poem)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  title="Редактировать"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleShare(e, poem)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors relative"
                  title="Поделиться"
                >
                  <Share2 className="w-4 h-4" />
                  {copiedId === poem.id && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow">
                      Скопировано!
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => handleDelete(e, poem.id)}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
