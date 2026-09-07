import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('verso_theme') || 'system'
  })

  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (currentTheme) => {
      if (currentTheme === 'dark') {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else if (currentTheme === 'light') {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      } else {
        // 'system'
        if (mediaQuery.matches) {
          root.classList.add('dark')
          root.style.colorScheme = 'dark'
        } else {
          root.classList.remove('dark')
          root.style.colorScheme = 'light'
        }
      }
    }

    applyTheme(theme)
    localStorage.setItem('verso_theme', theme)

    const handleSystemChange = (e) => {
      if (theme === 'system') {
        if (e.matches) {
          root.classList.add('dark')
          root.style.colorScheme = 'dark'
        } else {
          root.classList.remove('dark')
          root.style.colorScheme = 'light'
        }
      }
    }

    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [theme])

  return { theme, setTheme }
}
