import LZString from 'lz-string'
import { fetchSharedPoemFromSupabase } from './supabase'

/**
 * Parses an input string (full URL, query string, or short code)
 * and retrieves the poem data from Supabase or decompresses legacy shares.
 * 
 * Supported formats:
 * - http://192.168.x.x:5173/?p=abcdef12
 * - https://verso.app/?p=abcdef12
 * - ?p=abcdef12 or p=abcdef12
 * - abcdef12 (raw 8-character ID)
 * - http://.../?share=compressedData
 * - ?share=compressedData
 */
export async function parseAndFetchPoem(input) {
  if (!input || !input.trim()) {
    throw new Error('Пожалуйста, введите ссылку или код стиха')
  }

  const raw = input.trim()
  let shortId = null
  let compressedData = null

  // 1. Try URL parsing
  try {
    const urlString = raw.startsWith('http://') || raw.startsWith('https://') 
      ? raw 
      : `https://verso.app/${raw.startsWith('?') ? raw : '?' + raw}`
    const url = new URL(urlString)
    shortId = url.searchParams.get('p') || url.searchParams.get('f') || url.searchParams.get('folder')
    compressedData = url.searchParams.get('share') || url.searchParams.get('folder_share') || url.searchParams.get('f_share')
  } catch {
    // URL constructor failed, continue with regex parsing
  }

  // 2. Fallback regex checks
  if (!shortId && !compressedData) {
    const pMatch = raw.match(/[?&](?:p|f|folder)=([a-zA-Z0-9_-]+)/)
    if (pMatch) {
      shortId = pMatch[1]
    } else {
      const shareMatch = raw.match(/[?&](?:share|folder_share|f_share)=([a-zA-Z0-9_.~+-]+)/)
      if (shareMatch) {
        compressedData = shareMatch[1]
      } else if (/^[a-zA-Z0-9_-]{5,24}$/.test(raw)) {
        // Direct ID without URL formatting
        shortId = raw
      }
    }
  }

  // 3. Retrieve from Supabase if shortId exists
  if (shortId) {
    const data = await fetchSharedPoemFromSupabase(shortId)
    if (data && data.text) {
      // Check if this is a shared folder payload
      try {
        const parsed = JSON.parse(data.text)
        if (parsed && (parsed.type === 'folder' || Array.isArray(parsed.poems))) {
          return {
            type: 'folder',
            name: parsed.name || (data.title || '').replace(/^📁\s*/, '').trim() || 'Папка со стихами',
            poems: Array.isArray(parsed.poems) ? parsed.poems : [],
            source: 'supabase',
          }
        }
      } catch {
        // Not a JSON folder, standard poem
      }

      return {
        type: 'poem',
        text: data.text,
        title: data.title || '',
        source: 'supabase',
      }
    }
    throw new Error(`Стих или папка с кодом «${shortId}» не найдены в базе данных. Проверьте правильность ссылки.`)
  }

  // 4. Decompress from LZString fallback (supports folders, JSON {title, text}, and legacy plain text)
  if (compressedData) {
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(compressedData)
      if (decompressed) {
        // Try parsing JSON format
        try {
          const parsed = JSON.parse(decompressed)
          if (parsed && (parsed.type === 'folder' || Array.isArray(parsed.poems))) {
            return {
              type: 'folder',
              name: parsed.name || 'Папка со стихами',
              poems: Array.isArray(parsed.poems) ? parsed.poems : [],
              source: 'compressed',
            }
          }
          if (parsed && typeof parsed.text === 'string') {
            return {
              type: 'poem',
              text: parsed.text,
              title: parsed.title || '',
              source: 'compressed',
            }
          }
        } catch {
          // Backward compatibility: old format was a raw text string
        }

        return {
          type: 'poem',
          text: decompressed,
          title: '',
          source: 'compressed',
        }
      }
    } catch (e) {
      console.warn('Failed to decompress LZString', e)
    }
    throw new Error('Не удалось расшифровать данные из ссылки')
  }

  throw new Error('Не удалось распознать ссылку или код. Вставьте ссылку вида ?p=... или ?f=...')
}
