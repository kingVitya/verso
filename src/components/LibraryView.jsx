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
        className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98]"
      >
        <Plus className="w-6 h-6" />
        <span>Добавить новый стих</span>
      </button>

      {poems.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>Ваша библиотека пуста.</p>
          <p className="text-sm">Добавьте первый стих, чтобы начать заучивание!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {poems.map((poem) => (
            <div 
              key={poem.id}
              onClick={() => onOpen(poem)}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors shadow-sm group"
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 leading-tight">
                  {poem.title}
                </h3>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                {poem.text}
              </p>

              <div className="mt-auto pt-4 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  onClick={(e) => handleEdit(e, poem)}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => handleShare(e, poem)}
                  className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors relative"
                  title="Поделиться"
                >
                  <Share2 className="w-5 h-5" />
                  {copiedId === poem.id && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow">
                      Скопировано!
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => handleDelete(e, poem.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
