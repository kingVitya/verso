import { describe, it, expect } from 'vitest'
import LZString from 'lz-string'
import { parseAndFetchPoem } from '../shareParser'

describe('parseAndFetchPoem', () => {
  it('throws an error for empty input', async () => {
    await expect(parseAndFetchPoem('')).rejects.toThrow('Пожалуйста, введите ссылку или код стиха')
    await expect(parseAndFetchPoem('   ')).rejects.toThrow('Пожалуйста, введите ссылку или код стиха')
  })

  it('decompresses legacy plain-text LZString link (?share=...) with title fallback', async () => {
    const rawPoem = 'Белеет парус одинокий\nВ тумане моря голубом...'
    const compressed = LZString.compressToEncodedURIComponent(rawPoem)
    const url = `https://verso.app/?share=${compressed}`

    const result = await parseAndFetchPoem(url)
    expect(result.text).toBe(rawPoem)
    expect(result.title).toBe('')
    expect(result.source).toBe('compressed')
  })

  it('decompresses new JSON format {title, text} from LZString link', async () => {
    const poemData = {
      title: 'Парус',
      text: 'Белеет парус одинокий\nВ тумане моря голубом...'
    }
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(poemData))
    const url = `https://verso-school.vercel.app/?share=${compressed}`

    const result = await parseAndFetchPoem(url)
    expect(result.text).toBe(poemData.text)
    expect(result.title).toBe(poemData.title)
    expect(result.source).toBe('compressed')
  })

  it('handles relative query parameters for ?share=', async () => {
    const poemData = {
      title: 'Утёс',
      text: 'Ночевала тучка золотая...'
    }
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(poemData))
    const query = `?share=${compressed}`

    const result = await parseAndFetchPoem(query)
    expect(result.title).toBe('Утёс')
    expect(result.text).toBe('Ночевала тучка золотая...')
  })

  it('decompresses folder JSON format from LZString link (?folder_share=...)', async () => {
    const folderData = {
      type: 'folder',
      name: '9 класс',
      poems: [
        { title: 'Узник', text: 'Сижу за решёткой в темнице сырой...' },
        { title: 'Бородино', text: 'Скажи-ка, дядя, ведь не даром...' }
      ]
    }
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(folderData))
    const url = `https://verso.app/?folder_share=${compressed}`

    const result = await parseAndFetchPoem(url)
    expect(result.type).toBe('folder')
    expect(result.name).toBe('9 класс')
    expect(result.poems).toHaveLength(2)
    expect(result.poems[0].title).toBe('Узник')
    expect(result.poems[1].title).toBe('Бородино')
    expect(result.source).toBe('compressed')
  })

  it('throws an error when invalid string is passed', async () => {
    await expect(parseAndFetchPoem('not a valid url or code !@#$%')).rejects.toThrow()
  })
})
