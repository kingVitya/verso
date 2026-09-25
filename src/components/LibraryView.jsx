import { useState, useMemo } from 'react'
import { 
  Plus, 
  BookOpen, 
  Share2, 
  Trash2, 
  Edit, 
  Edit2, 
  Loader2, 
  X, 
  Copy, 
  Check, 
  Folder, 
  FolderPlus, 
  FolderInput, 
  ListPlus, 
  CheckSquare, 
  Square,
  ArrowRight
} from 'lucide-react'
import clsx from 'clsx'
import LZString from 'lz-string'
import { sharePoemToSupabase, shareFolderToSupabase } from '../lib/supabase'
import { copyToClipboard } from '../lib/clipboard'

export default function LibraryView({ 
  poems = [], 
  folders = [],
  activeFolderId = null,
  onSelectFolder = () => {},
  onCreateFolder = () => {},
  onRenameFolder = () => {},
  onDeleteFolder = () => {},
  onSetPoemFolder = () => {},
  onAddPoemsToFolder = () => {},
  onOpen, 
  onAdd, 
  onEdit, 
  onDelete 
}) {
  // Local state for active folder selection
  const [selectedFolderId, setSelectedFolderId] = useState(activeFolderId)

  // Feedback states
  const [copiedId, setCopiedId] = useState(null)
  const [sharingPoemId, setSharingPoemId] = useState(null)
  const [sharingFolder, setSharingFolder] = useState(false)

  // Modals state
  const [sharePoemModal, setSharePoemModal] = useState(null) // { poem, url, copied }
  const [shareFolderModal, setShareFolderModal] = useState(null) // { folder, poems, url, copied }
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameFolderModal, setRenameFolderModal] = useState(null) // folder object
  const [deleteFolderModal, setDeleteFolderModal] = useState(null) // folder object
  const [assignFolderPoem, setAssignFolderPoem] = useState(null) // poem object
  const [managePoemsModal, setManagePoemsModal] = useState(false) // true if managing poems for active folder
  const [selectedPoemIdsForFolder, setSelectedPoemIdsForFolder] = useState([])
  const [searchManagePoems, setSearchManagePoems] = useState('')

  // Current active folder object (if any)
  const activeFolder = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === 'uncategorized') return null
    return folders.find(f => f.id === selectedFolderId) || null
  }, [folders, selectedFolderId])

  // Filter poems according to active folder selection
  const filteredPoems = useMemo(() => {
    if (selectedFolderId === 'uncategorized') {
      return poems.filter(p => !p.folderId)
    }
    if (selectedFolderId) {
      return poems.filter(p => p.folderId === selectedFolderId)
    }
    return poems
  }, [poems, selectedFolderId])

  // Count poems in uncategorized
  const uncategorizedCount = useMemo(() => {
    return poems.filter(p => !p.folderId).length
  }, [poems])

  // Map for fast folder lookup by ID
  const folderMap = useMemo(() => {
    const map = new Map()
    folders.forEach(f => map.set(f.id, f))
    return map
  }, [folders])

  // Handler for sharing an individual poem
  const handleSharePoem = async (e, poem) => {
    e.stopPropagation()
    if (sharingPoemId) return
    setSharingPoemId(poem.id)

    let shareUrl = ''
    try {
      const shortId = await sharePoemToSupabase(poem.text, poem.title)
      shareUrl = `${window.location.origin}${window.location.pathname}?p=${shortId}`
    } catch (err) {
      console.warn('Supabase share error, falling back to local compression:', err)
      const payload = JSON.stringify({
        title: poem.title || '',
        text: poem.text
      })
      const compressed = LZString.compressToEncodedURIComponent(payload)
      shareUrl = `${window.location.origin}${window.location.pathname}?share=${compressed}`
    }

    const wasCopied = await copyToClipboard(shareUrl)
    if (wasCopied) {
      setCopiedId(poem.id)
      setTimeout(() => setCopiedId(null), 2500)
    }

    setSharePoemModal({
      poem,
      url: shareUrl,
      copied: wasCopied,
    })
    setSharingPoemId(null)
  }

  // Handler for sharing the currently viewed folder
  const handleShareCurrentFolder = async () => {
    if (!activeFolder || sharingFolder) return
    const folderPoems = poems.filter(p => p.folderId === activeFolder.id)
    if (folderPoems.length === 0) {
      alert(`В папке «${activeFolder.name}» пока нет стихов. Добавьте стихи, чтобы поделиться папкой.`)
      return
    }

    setSharingFolder(true)
    let shareUrl = ''
    try {
      const shortId = await shareFolderToSupabase(activeFolder.name, folderPoems)
      shareUrl = `${window.location.origin}${window.location.pathname}?f=${shortId}`
    } catch (err) {
      console.warn('Supabase folder share error, falling back to local compression:', err)
      const payload = JSON.stringify({
        type: 'folder',
        v: 1,
        name: activeFolder.name,
        poems: folderPoems.map(p => ({
          title: p.title || '',
          text: p.text
        }))
      })
      const compressed = LZString.compressToEncodedURIComponent(payload)
      shareUrl = `${window.location.origin}${window.location.pathname}?folder_share=${compressed}`
    }

    const wasCopied = await copyToClipboard(shareUrl)
    setShareFolderModal({
      folder: activeFolder,
      poems: folderPoems,
      url: shareUrl,
      copied: wasCopied,
    })
    setSharingFolder(false)
  }

  const handleDeletePoem = (e, id) => {
    e.stopPropagation()
    if (window.confirm('Точно удалить этот стих?')) {
      onDelete(id)
    }
  }

  const handleEditPoem = (e, poem) => {
    e.stopPropagation()
    onEdit(poem)
  }

  // Create folder action
  const handleCreateFolder = (e) => {
    e.preventDefault()
    const trimmed = newFolderName.trim()
    if (!trimmed) return
    const newId = onCreateFolder(trimmed)
    setNewFolderName('')
    setCreateFolderModalOpen(false)
    if (newId) {
      setSelectedFolderId(newId)
      onSelectFolder(newId)
    }
  }

  // Rename folder action
  const handleRenameFolder = (e) => {
    e.preventDefault()
    if (!renameFolderModal) return
    const trimmed = renameFolderModal.name.trim()
    if (!trimmed) return
    onRenameFolder(renameFolderModal.id, trimmed)
    setRenameFolderModal(null)
  }

  // Delete folder confirmation
  const handleConfirmDeleteFolder = (deletePoemsWithFolder) => {
    if (!deleteFolderModal) return
    onDeleteFolder(deleteFolderModal.id, deletePoemsWithFolder)
    if (selectedFolderId === deleteFolderModal.id) {
      setSelectedFolderId(null)
      onSelectFolder(null)
    }
    setDeleteFolderModal(null)
  }

  // Open manage poems dialog for current active folder
  const handleOpenManagePoems = () => {
    if (!activeFolder) return
    const currentInFolder = poems.filter(p => p.folderId === activeFolder.id).map(p => p.id)
    setSelectedPoemIdsForFolder(currentInFolder)
    setSearchManagePoems('')
    setManagePoemsModal(true)
  }

  // Save selected poems into current active folder
  const handleSaveManagePoems = () => {
    if (!activeFolder) return
    const selectedSet = new Set(selectedPoemIdsForFolder)
    // Add checked poems to this folder
    onAddPoemsToFolder(activeFolder.id, selectedPoemIdsForFolder)
    // Any poem previously in this folder but now unchecked gets removed from folder
    const toRemove = poems.filter(p => p.folderId === activeFolder.id && !selectedSet.has(p.id)).map(p => p.id)
    if (toRemove.length > 0) {
      toRemove.forEach(id => onSetPoemFolder(id, null))
    }
    setManagePoemsModal(false)
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      
      {/* Top Action Row: Add Poem & Create Folder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button 
          id="btn-add-poem"
          type="button"
          onClick={() => onAdd(activeFolder ? activeFolder.id : null)}
          className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-2xl font-medium text-sm text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeFolder ? `Добавить стих в «${activeFolder.name}»` : 'Добавить новый стих'}
          </span>
        </button>

        <button 
          id="btn-create-folder"
          type="button"
          onClick={() => {
            setNewFolderName('')
            setCreateFolderModalOpen(true)
          }}
          className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-2xl font-medium text-sm bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <FolderPlus className="w-4 h-4 text-zinc-500" />
          <span>Создать папку</span>
        </button>
      </div>

      {/* Horizontal Folders Bar (Chips) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
        {/* All Poems Chip */}
        <button
          type="button"
          onClick={() => {
            setSelectedFolderId(null)
            onSelectFolder(null)
          }}
          className={clsx(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none shrink-0",
            selectedFolderId === null
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
              : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
          )}
        >
          <BookOpen className="w-3.5 h-3.5 opacity-80" />
          <span>Все стихи</span>
          <span className={clsx(
            "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
            selectedFolderId === null
              ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          )}>
            {poems.length}
          </span>
        </button>

        {/* Custom Folder Chips */}
        {folders.map(folder => {
          const count = poems.filter(p => p.folderId === folder.id).length
          const isSelected = selectedFolderId === folder.id

          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => {
                setSelectedFolderId(folder.id)
                onSelectFolder(folder.id)
              }}
              className={clsx(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none shrink-0",
                isSelected
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                  : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              <Folder className={clsx("w-3.5 h-3.5", isSelected ? "text-amber-300 dark:text-amber-500 fill-current" : "text-amber-500/80")} />
              <span className="max-w-[130px] truncate">{folder.name}</span>
              <span className={clsx(
                "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                isSelected
                  ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              )}>
                {count}
              </span>
            </button>
          )
        })}

        {/* Uncategorized Chip (if any exist and there is at least one folder) */}
        {folders.length > 0 && uncategorizedCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectedFolderId('uncategorized')
              onSelectFolder('uncategorized')
            }}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer select-none shrink-0",
              selectedFolderId === 'uncategorized'
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
            )}
          >
            <span>Без папки</span>
            <span className="text-[10px] opacity-75 font-mono">({uncategorizedCount})</span>
          </button>
        )}

        {/* Small Add Folder Button at end of bar */}
        <button
          type="button"
          onClick={() => {
            setNewFolderName('')
            setCreateFolderModalOpen(true)
          }}
          className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors shrink-0 cursor-pointer"
          title="Создать новую папку"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Папка</span>
        </button>
      </div>

      {/* Active Folder Header Banner (when inside a folder) */}
      {activeFolder && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-400/10 dark:via-zinc-900/60 dark:to-zinc-900 border border-amber-500/20 dark:border-amber-400/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Folder className="w-6 h-6 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {activeFolder.name}
                </h2>
                <button
                  onClick={() => setRenameFolderModal({ ...activeFolder })}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Переименовать папку"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {filteredPoems.length} {filteredPoems.length === 1 ? 'стих' : (filteredPoems.length >= 2 && filteredPoems.length <= 4) ? 'стиха' : 'стихов'} в подборке
              </p>
            </div>
          </div>

          {/* Folder Action Buttons: Share Folder, Manage Poems, Delete */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-share-folder"
              type="button"
              onClick={handleShareCurrentFolder}
              disabled={sharingFolder || filteredPoems.length === 0}
              className={clsx(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer",
                filteredPoems.length === 0
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                  : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
              )}
              title={filteredPoems.length === 0 ? "Сначала добавьте стихи в папку" : "Поделиться всей папкой"}
            >
              {sharingFolder ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>Поделиться папкой</span>
            </button>

            <button
              type="button"
              onClick={handleOpenManagePoems}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer"
              title="Выбрать стихи из библиотеки"
            >
              <ListPlus className="w-4 h-4 text-zinc-500" />
              <span className="hidden sm:inline">Выбрать стихи</span>
            </button>

            <button
              type="button"
              onClick={() => setDeleteFolderModal(activeFolder)}
              className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              title="Удалить папку"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Poems Grid / Empty States */}
      {filteredPoems.length === 0 ? (
        activeFolder ? (
          /* Empty Folder State */
          <div className="text-center p-8 sm:p-12 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl mt-2 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Folder className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 mb-1">
              В папке «{activeFolder.name}» пока пусто
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
              Вы можете добавить сюда новый стих или выбрать уже сохранённые стихи из вашей библиотеки.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs sm:max-w-md justify-center">
              <button
                type="button"
                onClick={() => onAdd(activeFolder.id)}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Создать новый стих</span>
              </button>
              {poems.length > 0 && (
                <button
                  type="button"
                  onClick={handleOpenManagePoems}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                >
                  <ListPlus className="w-4 h-4 text-zinc-500" />
                  <span>Выбрать из библиотеки</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Empty Library State */
          <div className="text-center text-zinc-500 dark:text-zinc-400 mt-10">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-zinc-800 dark:text-zinc-200">Ваша библиотека пуста.</p>
            <p className="text-sm mt-1">Добавьте первый стих, чтобы начать заучивание!</p>
          </div>
        )
      ) : (
        /* Poems Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPoems.map((poem) => {
            const poemFolder = poem.folderId ? folderMap.get(poem.folderId) : null

            return (
              <div 
                key={poem.id}
                onClick={() => onOpen(poem)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm group relative"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                    {poem.title || 'Без названия'}
                  </h3>

                  {/* Folder Tag on poem card if viewed in "Все стихи" or if categorized */}
                  {poemFolder && selectedFolderId !== poem.folderId && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFolderId(poemFolder.id)
                        onSelectFolder(poemFolder.id)
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors shrink-0"
                      title={`В папке «${poemFolder.name}»`}
                    >
                      <Folder className="w-2.5 h-2.5 fill-current" />
                      <span className="max-w-[80px] truncate">{poemFolder.name}</span>
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed font-serif whitespace-pre-line">
                  {poem.text}
                </p>

                {/* Footer Actions */}
                <div className="mt-auto pt-3.5 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/50">
                  {/* Folder assignment button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setAssignFolderPoem(poem)
                    }}
                    className={clsx(
                      "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                      poemFolder
                        ? "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                        : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                    title={poemFolder ? `Папка: ${poemFolder.name}. Нажмите, чтобы сменить` : "Добавить в папку"}
                  >
                    <FolderInput className="w-3.5 h-3.5" />
                    <span className="text-[11px] truncate max-w-[110px]">
                      {poemFolder ? poemFolder.name : 'В папку...'}
                    </span>
                  </button>

                  {/* Edit, Share, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleEditPoem(e, poem)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSharePoem(e, poem)}
                      disabled={sharingPoemId === poem.id}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative cursor-pointer active:scale-90"
                      title="Поделиться стихом"
                    >
                      {sharingPoemId === poem.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-600 dark:text-zinc-300" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                      {copiedId === poem.id && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-medium px-2.5 py-1 rounded-lg shadow whitespace-nowrap z-10 animate-in fade-in zoom-in-95">
                          Скопировано!
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeletePoem(e, poem.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Create New Folder                                                */}
      {/* ========================================================================= */}
      {createFolderModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setCreateFolderModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Новая папка
                </h3>
              </div>
              <button 
                onClick={() => setCreateFolderModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1.5">
                  Название папки:
                </label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Например: 9 класс, Экзамен, Любимое..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  maxLength={60}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCreateFolderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 transition-all cursor-pointer active:scale-95"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Rename Folder                                                    */}
      {/* ========================================================================= */}
      {renameFolderModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setRenameFolderModal(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Переименовать папку
              </h3>
              <button 
                onClick={() => setRenameFolderModal(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameFolder} className="flex flex-col gap-4">
              <div>
                <input 
                  autoFocus
                  type="text"
                  value={renameFolderModal.name}
                  onChange={(e) => setRenameFolderModal({ ...renameFolderModal, name: e.target.value })}
                  maxLength={60}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameFolderModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!renameFolderModal.name.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Delete Folder Confirmation                                       */}
      {/* ========================================================================= */}
      {deleteFolderModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setDeleteFolderModal(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Удалить папку «{deleteFolderModal.name}»?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Выберите, как поступить со стихами из этой папки:
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmDeleteFolder(false)}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-left flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-semibold">Сохранить стихи в библиотеке</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Удалится только папка, стихи останутся</div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                type="button"
                onClick={() => handleConfirmDeleteFolder(true)}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-medium bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-left flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-semibold">Удалить папку и все стихи в ней</div>
                  <div className="text-[11px] text-red-400/80">Стихи из этой папки будут безвозвратно удалены</div>
                </div>
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>

              <button
                type="button"
                onClick={() => setDeleteFolderModal(null)}
                className="w-full py-2.5 text-center text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer mt-1"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Share Entire Folder                                              */}
      {/* ========================================================================= */}
      {shareFolderModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShareFolderModal(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Folder className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                    Поделиться папкой
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    «{shareFolderModal.folder.name}» • {shareFolderModal.poems.length} {shareFolderModal.poems.length === 1 ? 'стих' : 'стихов'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShareFolderModal(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Included poems preview preview pills */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-200/70 dark:border-zinc-800 max-h-36 overflow-y-auto">
              <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                Стихи в этой папке:
              </div>
              <ul className="flex flex-col gap-1 text-xs text-zinc-700 dark:text-zinc-300">
                {shareFolderModal.poems.map((p, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 truncate">
                    <span className="text-zinc-400 font-mono text-[10px] w-4 shrink-0">{idx + 1}.</span>
                    <span className="truncate font-medium">{p.title || 'Без названия'}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Share Link Input with Copy Button */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Ссылка на папку:
              </label>
              <div className="flex gap-2 items-center">
                <input 
                  readOnly
                  value={shareFolderModal.url}
                  onClick={(e) => e.target.select()}
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-800 dark:text-zinc-200 select-all outline-none"
                />
                <button
                  onClick={async () => {
                    const ok = await copyToClipboard(shareFolderModal.url)
                    if (ok) {
                      setShareFolderModal(prev => ({ ...prev, copied: true }))
                      setTimeout(() => setShareFolderModal(prev => prev ? { ...prev, copied: false } : null), 2500)
                    }
                  }}
                  className="px-3.5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-medium text-xs hover:bg-zinc-800 dark:hover:bg-white transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                >
                  {shareFolderModal.copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Копировать</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Native Share button */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: `Папка стихов «${shareFolderModal.folder.name}» в Verso`,
                      text: `Подборка стихов «${shareFolderModal.folder.name}» (${shareFolderModal.poems.length} стихов) для заучивания в приложении Verso:`,
                      url: shareFolderModal.url,
                    })
                  } catch (err) {
                    if (err.name !== 'AbortError') {
                      console.warn('Native share failed', err)
                    }
                  }
                }}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium text-xs sm:text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 text-zinc-800 dark:text-zinc-200 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Отправить через Telegram / WhatsApp</span>
              </button>
            )}

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed text-center">
              {shareFolderModal.copied 
                ? 'Ссылка уже в буфере обмена! Отправьте её одноклассникам или друзьям.' 
                : 'Любой, кто откроет ссылку, сможет в один клик импортировать всю папку и все стихи в свою библиотеку.'}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Assign Poem to Folder                                            */}
      {/* ========================================================================= */}
      {assignFolderPoem && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setAssignFolderPoem(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Переместить в папку
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs mt-0.5">
                  «{assignFolderPoem.title || 'Без названия'}»
                </p>
              </div>
              <button 
                onClick={() => setAssignFolderPoem(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pt-1">
              {/* Option: Uncategorized / No Folder */}
              <button
                type="button"
                onClick={() => {
                  onSetPoemFolder(assignFolderPoem.id, null)
                  setAssignFolderPoem(null)
                }}
                className={clsx(
                  "flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer",
                  !assignFolderPoem.folderId
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs sm:text-sm">Без папки</span>
                </div>
                {!assignFolderPoem.folderId && <Check className="w-4 h-4 text-emerald-500" />}
              </button>

              {/* Folders List */}
              {folders.map(f => {
                const isCurrent = assignFolderPoem.folderId === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      onSetPoemFolder(assignFolderPoem.id, f.id)
                      setAssignFolderPoem(null)
                    }}
                    className={clsx(
                      "flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer",
                      isCurrent
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <Folder className="w-4 h-4 text-amber-500 fill-current shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{f.name}</span>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </button>
                )
              })}
            </div>

            {/* Quick button to create a new folder from this modal */}
            <button
              type="button"
              onClick={() => {
                setAssignFolderPoem(null)
                setNewFolderName('')
                setCreateFolderModalOpen(true)
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-dashed border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Создать новую папку...</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Manage Poems for Current Folder (Pick from Library)              */}
      {/* ========================================================================= */}
      {managePoemsModal && activeFolder && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setManagePoemsModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[85vh] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Стихи в папке «{activeFolder.name}»
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Отметьте стихи, которые должны быть в этой папке
                </p>
              </div>
              <button 
                onClick={() => setManagePoemsModal(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick search input */}
            {poems.length > 5 && (
              <input 
                type="text"
                placeholder="Поиск по названию или тексту..."
                value={searchManagePoems}
                onChange={(e) => setSearchManagePoems(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
              />
            )}

            {/* Poems selection list */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 min-h-[160px] max-h-[300px]">
              {poems
                .filter(p => {
                  if (!searchManagePoems.trim()) return true
                  const q = searchManagePoems.toLowerCase()
                  return (p.title || '').toLowerCase().includes(q) || (p.text || '').toLowerCase().includes(q)
                })
                .map(poem => {
                  const isChecked = selectedPoemIdsForFolder.includes(poem.id)

                  return (
                    <div
                      key={poem.id}
                      onClick={() => {
                        setSelectedPoemIdsForFolder(prev => 
                          isChecked ? prev.filter(id => id !== poem.id) : [...prev, poem.id]
                        )
                      }}
                      className={clsx(
                        "flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none",
                        isChecked
                          ? "bg-amber-500/10 border-amber-500/30 text-zinc-900 dark:text-zinc-100"
                          : "bg-zinc-50/50 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      <div className="shrink-0 text-amber-500">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-semibold truncate">
                          {poem.title || 'Без названия'}
                        </div>
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-1 mt-0.5">
                          {poem.text}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Quick bulk action buttons & Save */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPoemIdsForFolder(poems.map(p => p.id))}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Выбрать все
                </button>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedPoemIdsForFolder([])}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Снять выбор
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setManagePoemsModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSaveManagePoems}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Сохранить ({selectedPoemIdsForFolder.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: Share Single Poem Modal                                          */}
      {/* ========================================================================= */}
      {sharePoemModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSharePoemModal(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Поделиться стихом
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                  «{sharePoemModal.poem.title || 'Без названия'}»
                </p>
              </div>
              <button 
                onClick={() => setSharePoemModal(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Короткая ссылка:
              </label>
              <div className="flex gap-2 items-center">
                <input 
                  readOnly
                  value={sharePoemModal.url}
                  onClick={(e) => e.target.select()}
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-800 dark:text-zinc-200 select-all outline-none"
                />
                <button
                  onClick={async () => {
                    const ok = await copyToClipboard(sharePoemModal.url)
                    if (ok) {
                      setSharePoemModal(prev => ({ ...prev, copied: true }))
                      setTimeout(() => setSharePoemModal(prev => prev ? { ...prev, copied: false } : null), 2500)
                    }
                  }}
                  className="px-3.5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-medium text-xs hover:bg-zinc-800 dark:hover:bg-white transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                >
                  {sharePoemModal.copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Копировать</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: sharePoemModal.poem.title || 'Стих в Verso',
                      text: `Стих «${sharePoemModal.poem.title || 'Без названия'}» для заучивания в Verso:`,
                      url: sharePoemModal.url,
                    })
                  } catch (err) {
                    if (err.name !== 'AbortError') {
                      console.warn('Native share failed', err)
                    }
                  }
                }}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 text-zinc-800 dark:text-zinc-200 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Открыть меню «Поделиться»</span>
              </button>
            )}

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed text-center">
              {sharePoemModal.copied 
                ? 'Ссылка уже скопирована в буфер обмена! Отправьте её друзьям.' 
                : 'Любой, кто откроет ссылку, сразу получит этот стих в приложении.'}
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
