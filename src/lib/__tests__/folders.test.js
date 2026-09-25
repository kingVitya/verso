import { describe, it, expect, vi, beforeEach } from 'vitest'
import LZString from 'lz-string'
import { parseAndFetchPoem } from '../shareParser'
import { shareFolderToSupabase } from '../supabase'

describe('Folders and Collections Sharing', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('decompresses folder JSON payload with ?f_share= parameter', async () => {
    const folderPayload = {
      type: 'folder',
      v: 1,
      name: '9 класс Литература',
      poems: [
        { title: 'Узник', text: 'Сижу за решёткой в темнице сырой...' },
        { title: 'И скучно и грустно', text: 'И скучно и грустно, и некому руку подать...' }
      ]
    }

    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(folderPayload))
    const url = `https://verso.app/?f_share=${compressed}`

    const result = await parseAndFetchPoem(url)
    expect(result.type).toBe('folder')
    expect(result.name).toBe('9 класс Литература')
    expect(result.poems).toHaveLength(2)
    expect(result.poems[0].title).toBe('Узник')
    expect(result.poems[1].title).toBe('И скучно и грустно')
  })

  it('decompresses folder payload with ?folder_share= parameter', async () => {
    const folderPayload = {
      type: 'folder',
      v: 1,
      name: 'Серебряный век',
      poems: [
        { title: 'Незнакомка', text: 'По вечерам над ресторанами...' }
      ]
    }

    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(folderPayload))
    const result = await parseAndFetchPoem(`?folder_share=${compressed}`)
    expect(result.type).toBe('folder')
    expect(result.name).toBe('Серебряный век')
    expect(result.poems[0].title).toBe('Незнакомка')
  })

  it('shareFolderToSupabase posts folder payload to shared_poems table', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    })
    global.fetch = fetchMock

    const poems = [
      { title: 'Парус', text: 'Белеет парус одинокий' },
      { title: 'Тучи', text: 'Тучки небесные, вечные странники' }
    ]

    const shortId = await shareFolderToSupabase('9 класс', poems)
    expect(typeof shortId).toBe('string')
    expect(shortId.length).toBe(8)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('/rest/v1/shared_poems')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.id).toBe(shortId)
    expect(body.title).toBe('📁 9 класс')

    const folderContent = JSON.parse(body.text)
    expect(folderContent.type).toBe('folder')
    expect(folderContent.name).toBe('9 класс')
    expect(folderContent.poems).toHaveLength(2)
    expect(folderContent.poems[0].title).toBe('Парус')
  })

  it('rejects folder sharing if total text exceeds 30000 characters limit', async () => {
    const hugeText = 'a'.repeat(30001)
    const poems = [{ title: 'Huge', text: hugeText }]

    await expect(shareFolderToSupabase('Huge Folder', poems)).rejects.toThrow(
      'Размер папки слишком велик'
    )
  })
})
