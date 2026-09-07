import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

export const MAX_TITLE_LENGTH = 150
export const MAX_TEXT_LENGTH = 30000

export function useLibrary() {
  // 1. Lazy initialization from localStorage
  const [poems, setPoems] = useState(() => {
    try {
      const saved = localStorage.getItem('lexis_poems')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Failed to parse poems from localStorage', e)
      return []
    }
  })

  // 2. Pure persistence: keep state updaters pure, persist via useEffect
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    try {
      localStorage.setItem('lexis_poems', JSON.stringify(poems))
    } catch (e) {
      console.error('Failed to save poems to localStorage', e)
    }
  }, [poems])

  // 3. Pure state updaters
  const addPoem = (text, title) => {
    const trimmedText = text.trim().slice(0, MAX_TEXT_LENGTH)
    const firstLine = trimmedText.split('\n')[0]
    const defaultTitle = firstLine.substring(0, 30) + (firstLine.length > 30 ? '...' : '')
    const trimmedTitle = (title?.trim() || defaultTitle).slice(0, MAX_TITLE_LENGTH)
    const newId = uuidv4()
    
    const newPoem = {
      id: newId,
      title: trimmedTitle,
      text: trimmedText,
      createdAt: Date.now(),
      lastPracticedAt: null,
      practiceCount: 0,
    }

    setPoems(prev => [newPoem, ...prev])
    return newId
  }

  const updatePoem = (id, text, title) => {
    const trimmedText = text.trim().slice(0, MAX_TEXT_LENGTH)
    setPoems(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          text: trimmedText,
          title: (title?.trim() || p.title).slice(0, MAX_TITLE_LENGTH),
          updatedAt: Date.now()
        }
      }
      return p
    }))
  }

  const recordPracticeSession = (id) => {
    setPoems(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          lastPracticedAt: Date.now(),
          practiceCount: (p.practiceCount || 0) + 1,
        }
      }
      return p
    }))
  }

  const deletePoem = (id) => {
    setPoems(prev => prev.filter(p => p.id !== id))
  }

  const getPoem = (id) => {
    return poems.find(p => p.id === id)
  }

  // 4. Export & Import Backup
  const exportLibrary = () => {
    if (!poems || poems.length === 0) {
      return false
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(poems, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    const dateStr = new Date().toISOString().slice(0, 10)
    downloadAnchor.setAttribute('download', `verso_library_${dateStr}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    return true
  }

  const importLibrary = (jsonString) => {
    let imported
    try {
      imported = JSON.parse(jsonString)
    } catch {
      throw new Error('Файл не является корректным JSON')
    }

    if (!Array.isArray(imported)) {
      throw new Error('Некорректный формат: файл должен содержать список стихов')
    }

    let importedCount = 0
    let skippedCount = 0

    setPoems(prev => {
      const existingIds = new Set(prev.map(p => p.id))
      const toAdd = []

      for (const item of imported) {
        if (!item || typeof item.text !== 'string' || !item.text.trim()) {
          continue
        }
        const itemId = item.id || uuidv4()
        if (existingIds.has(itemId)) {
          skippedCount++
          continue
        }

        toAdd.push({
          id: itemId,
          title: String(item.title || '').trim().slice(0, MAX_TITLE_LENGTH) || 'Без названия',
          text: item.text.trim().slice(0, MAX_TEXT_LENGTH),
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || undefined,
          lastPracticedAt: item.lastPracticedAt || null,
          practiceCount: item.practiceCount || 0,
        })
        existingIds.add(itemId)
        importedCount++
      }

      return [...toAdd, ...prev]
    })

    return { importedCount, skippedCount }
  }

  return { 
    poems, 
    addPoem, 
    updatePoem, 
    deletePoem, 
    getPoem,
    recordPracticeSession,
    exportLibrary,
    importLibrary,
    MAX_TITLE_LENGTH,
    MAX_TEXT_LENGTH
  }
}
