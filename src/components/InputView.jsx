import { useState, useRef } from 'react'
import { createWorker } from 'tesseract.js'
import { Camera, Loader2, Play, Link2, Download, Check, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { parseAndFetchPoem } from '../lib/shareParser'

const preprocessImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_DIM = 2500
        let width = img.width
        let height = img.height
        
        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width)
          width = MAX_DIM
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height)
          height = MAX_DIM
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // Apply Grayscale and Contrast to improve OCR on skewed/shadowed photos
        const imgData = ctx.getImageData(0, 0, width, height)
        const data = imgData.data
        const contrast = 70 // High contrast
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
        
        for (let i = 0; i < data.length; i += 4) {
           const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
           const c = Math.min(255, Math.max(0, factor * (avg - 128) + 128))
           data[i] = c
           data[i+1] = c
           data[i+2] = c
        }
        ctx.putImageData(imgData, 0, 0)
        
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function InputView({ initialText = '', initialTitle = '', onSave, onCancel }) {
  const [text, setText] = useState(initialText)
  const [title, setTitle] = useState(initialTitle)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  // Link import state
  const [linkInput, setLinkInput] = useState('')
  const [loadingLink, setLoadingLink] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')

  const handleImportFromLink = async (e) => {
    if (e) e.preventDefault()
    if (!linkInput.trim() || loadingLink) return

    setLoadingLink(true)
    setLinkError('')
    setLinkSuccess('')

    try {
      const data = await parseAndFetchPoem(linkInput)
      setText(data.text)
      if (data.title) {
        setTitle(data.title)
      }
      setLinkSuccess(`Стих ${data.title ? `«${data.title}» ` : ''}успешно загружен!`)
      setLinkInput('')
    } catch (err) {
      setLinkError(err.message || 'Не удалось загрузить стих по этой ссылке')
    } finally {
      setLoadingLink(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const processedImage = await preprocessImage(file)
      
      const worker = await createWorker('rus', 1, {
        langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
        logger: (m) => console.log(m)
      })
      
      await worker.setParameters({
        tessedit_pageseg_mode: '1',
      })

      const { data } = await worker.recognize(processedImage)
      setText(prev => prev ? prev + '\n\n' + data.text : data.text)
      await worker.terminate()
    } catch (error) {
      console.error(error)
      alert('Ошибка при распознавании текста')
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {onCancel && (
        <button 
          onClick={onCancel}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white self-start font-medium -mb-2 transition-colors cursor-pointer"
        >
          ← Назад
        </button>
      )}

      {/* Import via link block */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4.5 sm:p-5 flex flex-col gap-3.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Вставить по ссылке
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Вставьте ссылку на стих или код (например: ?p=abc123)
            </p>
          </div>
        </div>

        <form onSubmit={handleImportFromLink} className="flex gap-2">
          <input 
            type="text"
            value={linkInput}
            onChange={(e) => {
              setLinkInput(e.target.value)
              setLinkError('')
              setLinkSuccess('')
            }}
            placeholder="Вставьте ссылку сюда..."
            disabled={loadingLink}
            className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 text-sm focus:border-zinc-900 dark:focus:border-zinc-100 outline-none transition-all placeholder:text-zinc-400 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={loadingLink || !linkInput.trim()}
            className="px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
          >
            {loadingLink ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Загрузить</span>
          </button>
        </form>

        {linkError && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{linkError}</span>
          </div>
        )}

        {linkSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{linkSuccess}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className={clsx(
            "flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-2xl font-medium text-[15px] transition-all active:scale-[0.98] cursor-pointer",
            loading 
              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed" 
              : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Распознаем текст...</span>
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              <span>Сфотографировать текст</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-4 relative">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">
            Название (необязательно)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Пушкин - Зимнее утро"
            className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 transition-all text-base font-medium placeholder:text-zinc-400 dark:text-zinc-100"
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">
            Текст для заучивания
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Вставьте текст стихотворения сюда, или загрузите его по ссылке выше..."
            className="w-full h-[40vh] min-h-[250px] p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 resize-none shadow-sm transition-all text-base leading-relaxed font-serif placeholder:font-sans placeholder:text-zinc-400 dark:text-zinc-100"
            disabled={loading}
          />
        </div>
      </div>

      <button
        onClick={() => onSave({ text, title })}
        disabled={loading || !text.trim()}
        className={clsx(
          "flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl font-bold text-[15px] transition-all active:scale-[0.98] cursor-pointer",
          !text.trim() || loading
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-sm"
        )}
      >
        <Play className="w-5 h-5 fill-current" />
        <span>Сохранить и начать</span>
      </button>
    </div>
  )
}
