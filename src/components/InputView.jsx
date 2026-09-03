import { useState, useRef } from 'react'
import { createWorker } from 'tesseract.js'
import { Camera, Loader2, Play } from 'lucide-react'
import clsx from 'clsx'

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
          className="text-gray-500 hover:text-gray-900 dark:hover:text-white self-start font-medium -mb-2"
        >
          ← Назад
        </button>
      )}

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
            "flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl font-medium text-lg text-white transition-all active:scale-[0.98]",
            loading ? "bg-purple-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Распознаем текст...</span>
            </>
          ) : (
            <>
              <Camera className="w-6 h-6" />
              <span>Сфотографировать текст</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-4 relative">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
            Название (необязательно)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Пушкин - Зимнее утро"
            className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-base font-medium"
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
            Текст для заучивания
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Вставьте текст стихотворения сюда, или сфотографируйте его..."
            className="w-full h-[40vh] min-h-[250px] p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 resize-none shadow-sm transition-all text-base leading-relaxed"
            disabled={loading}
          />
        </div>
      </div>

      <button
        onClick={() => onSave({ text, title })}
        disabled={loading || !text.trim()}
        className={clsx(
          "flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-[0.98]",
          !text.trim() || loading
            ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 shadow-lg"
        )}
      >
        <Play className="w-5 h-5 fill-current" />
        <span>Сохранить и начать</span>
      </button>
    </div>
  )
}
