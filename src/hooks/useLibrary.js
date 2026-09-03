import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

export function useLibrary() {
  const [poems, setPoems] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('lexis_poems')
    if (saved) {
      try {
        setPoems(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse poems', e)
      }
    }
  }, [])

  const savePoems = (newPoems) => {
    setPoems(newPoems)
    localStorage.setItem('lexis_poems', JSON.stringify(newPoems))
  }

  const addPoem = (text, title) => {
    const defaultTitle = text.trim().split('\n')[0].substring(0, 30) + (text.trim().split('\n')[0].length > 30 ? '...' : '')
    const newPoem = {
      id: uuidv4(),
      title: title?.trim() || defaultTitle,
      text: text,
      createdAt: Date.now()
    }
    savePoems([newPoem, ...poems])
    return newPoem.id
  }

  const updatePoem = (id, text, title) => {
    const newPoems = poems.map(p => {
      if (p.id === id) {
        return { ...p, text, title: title?.trim() || p.title, updatedAt: Date.now() }
      }
      return p
    })
    savePoems(newPoems)
  }

  const deletePoem = (id) => {
    savePoems(poems.filter(p => p.id !== id))
  }

  const getPoem = (id) => {
    return poems.find(p => p.id === id)
  }

  return { poems, addPoem, updatePoem, deletePoem, getPoem }
}
