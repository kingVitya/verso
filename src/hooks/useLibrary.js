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

  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem('verso_folders')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Failed to parse folders from localStorage', e)
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

  const isFoldersInitialMount = useRef(true)
  useEffect(() => {
    if (isFoldersInitialMount.current) {
      isFoldersInitialMount.current = false
      return
    }
    try {
      localStorage.setItem('verso_folders', JSON.stringify(folders))
    } catch (e) {
      console.error('Failed to save folders to localStorage', e)
    }
  }, [folders])

  // 3. Folder management updaters
  const createFolder = (name) => {
    const trimmed = (name || '').trim().slice(0, 60)
    if (!trimmed) {
      throw new Error('Название папки не может быть пустым')
    }
    const newId = uuidv4()
    const newFolder = {
      id: newId,
      name: trimmed,
      createdAt: Date.now(),
    }
    setFolders(prev => [...prev, newFolder])
    return newId
  }

  const renameFolder = (id, newName) => {
    const trimmed = (newName || '').trim().slice(0, 60)
    if (!trimmed) {
      throw new Error('Название папки не может быть пустым')
    }
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: trimmed } : f))
  }

  const deleteFolder = (id, deletePoems = false) => {
    setFolders(prev => prev.filter(f => f.id !== id))
    if (deletePoems) {
      setPoems(prev => prev.filter(p => p.folderId !== id))
    } else {
      setPoems(prev => prev.map(p => p.folderId === id ? { ...p, folderId: null } : p))
    }
  }

  const setPoemFolder = (poemId, folderId) => {
    setPoems(prev => prev.map(p => p.id === poemId ? { ...p, folderId: folderId || null } : p))
  }

  const addPoemsToFolder = (folderId, poemIds) => {
    const targetId = folderId || null
    const idSet = new Set(poemIds)
    setPoems(prev => prev.map(p => idSet.has(p.id) ? { ...p, folderId: targetId } : p))
  }

  const removePoemsFromFolder = (poemIds) => {
    const idSet = new Set(poemIds)
    setPoems(prev => prev.map(p => idSet.has(p.id) ? { ...p, folderId: null } : p))
  }

  // 4. Pure poem state updaters
  const addPoem = (text, title, folderId = null) => {
    const trimmedText = text.trim().slice(0, MAX_TEXT_LENGTH)
    const firstLine = trimmedText.split('\n')[0]
    const defaultTitle = firstLine.substring(0, 30) + (firstLine.length > 30 ? '...' : '')
    const trimmedTitle = (title?.trim() || defaultTitle).slice(0, MAX_TITLE_LENGTH)
    const newId = uuidv4()
    
    const newPoem = {
      id: newId,
      title: trimmedTitle,
      text: trimmedText,
      folderId: folderId || null,
      createdAt: Date.now(),
      lastPracticedAt: null,
      practiceCount: 0,
    }

    setPoems(prev => [newPoem, ...prev])
    return newId
  }

  const updatePoem = (id, text, title, folderId = undefined) => {
    const trimmedText = text.trim().slice(0, MAX_TEXT_LENGTH)
    setPoems(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          text: trimmedText,
          title: (title?.trim() || p.title).slice(0, MAX_TITLE_LENGTH),
          folderId: folderId !== undefined ? (folderId || null) : p.folderId,
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

  /**
   * Imports an entire folder and its poems at once.
   * If a folder with the same name already exists, reuses it or creates a new one.
   */
  const importFolder = (folderName, poemsList) => {
    const cleanName = (folderName || 'Папка со стихами').trim().slice(0, 60)
    
    let targetFolder = folders.find(f => f.name.toLowerCase() === cleanName.toLowerCase())
    let targetFolderId = targetFolder ? targetFolder.id : null

    if (!targetFolderId) {
      targetFolderId = uuidv4()
      const newFolder = {
        id: targetFolderId,
        name: cleanName,
        createdAt: Date.now(),
      }
      setFolders(prev => [...prev, newFolder])
    }

    const newPoems = (poemsList || []).map(p => {
      const trimmedText = (p.text || '').trim().slice(0, MAX_TEXT_LENGTH)
      const firstLine = trimmedText.split('\n')[0]
      const defaultTitle = firstLine.substring(0, 30) + (firstLine.length > 30 ? '...' : '')
      return {
        id: uuidv4(),
        title: (p.title || '').trim().slice(0, MAX_TITLE_LENGTH) || defaultTitle,
        text: trimmedText,
        folderId: targetFolderId,
        createdAt: Date.now(),
        lastPracticedAt: null,
        practiceCount: 0,
      }
    }).filter(p => p.text.length > 0)

    setPoems(prev => [...newPoems, ...prev])
    return { folderId: targetFolderId, name: cleanName, count: newPoems.length }
  }

  // 5. Export & Import Backup (supports both legacy flat array and structured folder backup)
  const exportLibrary = () => {
    if ((!poems || poems.length === 0) && (!folders || folders.length === 0)) {
      return false
    }
    const backupData = {
      version: 2,
      exportedAt: Date.now(),
      folders: folders || [],
      poems: poems || [],
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2))
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

    let poemsToImport = []
    let foldersToImport = []

    if (Array.isArray(imported)) {
      // Legacy format: raw array of poems
      poemsToImport = imported
    } else if (imported && typeof imported === 'object' && Array.isArray(imported.poems)) {
      // V2 format: { version, folders, poems }
      poemsToImport = imported.poems
      if (Array.isArray(imported.folders)) {
        foldersToImport = imported.folders
      }
    } else {
      throw new Error('Некорректный формат: файл должен содержать список стихов')
    }

    // Merge folders if present
    if (foldersToImport.length > 0) {
      setFolders(prev => {
        const existingIds = new Set(prev.map(f => f.id))
        const existingNames = new Set(prev.map(f => f.name.toLowerCase().trim()))
        const toAdd = []
        for (const f of foldersToImport) {
          if (!f || !f.name) continue
          const fId = f.id || uuidv4()
          if (existingIds.has(fId) || existingNames.has(String(f.name).toLowerCase().trim())) {
            continue
          }
          toAdd.push({
            id: fId,
            name: String(f.name).trim().slice(0, 60),
            createdAt: f.createdAt || Date.now(),
          })
          existingIds.add(fId)
        }
        return [...prev, ...toAdd]
      })
    }

    let importedCount = 0
    let skippedCount = 0

    setPoems(prev => {
      const existingIds = new Set(prev.map(p => p.id))
      const toAdd = []

      for (const item of poemsToImport) {
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
          folderId: item.folderId || null,
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
    folders,
    createFolder,
    renameFolder,
    deleteFolder,
    setPoemFolder,
    addPoemsToFolder,
    removePoemsFromFolder,
    importFolder,
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
