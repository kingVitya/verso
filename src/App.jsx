import { useState, useEffect } from 'react'
import { Home, User, BookOpen, Folder, X, CheckSquare, Square, Check } from 'lucide-react'
import clsx from 'clsx'
import InputView from './components/InputView'
import PracticeView from './components/PracticeView'
import LibraryView from './components/LibraryView'
import ProfileView from './components/ProfileView'
import CatalogView from './components/CatalogView'
import { useLibrary } from './hooks/useLibrary'
import { useTheme } from './hooks/useTheme'
import { useSettings } from './hooks/useSettings'
import { parseAndFetchPoem } from './lib/shareParser'

function App() {
  const { 
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
    recordPracticeSession, 
    exportLibrary, 
    importLibrary 
  } = useLibrary()
  const { theme, setTheme } = useTheme()
  const { sliderStep, setSliderStep, revealDuration, setRevealDuration } = useSettings()
  
  // Navigation tabs: 'main' | 'catalog' | 'profile'
  const [activeTab, setActiveTab] = useState('main')

  // Routes within Main tab: 'library', 'input', 'practice'
  const [route, setRoute] = useState('library')
  
  // Active folder selection for library
  const [activeFolderId, setActiveFolderId] = useState(null)

  // State for Practice & Edit mode
  const [activePoem, setActivePoem] = useState(null)

  // Shared folder modal & selection state
  const [sharedFolderData, setSharedFolderData] = useState(null) // { name, poems }
  const [selectedSharedPoemIndices, setSelectedSharedPoemIndices] = useState([])

  // Global toast notification
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev))
    }, 4000)
  }
  
  // Check for shared poem or folder in URL on mount (?p=shortId, ?f=shortId, ?share=..., ?folder_share=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hasShareParam = 
      params.get('p') || 
      params.get('f') || 
      params.get('folder') || 
      params.get('share') || 
      params.get('folder_share') || 
      params.get('f_share')

    if (hasShareParam) {
      parseAndFetchPoem(window.location.search)
        .then((result) => {
          if (result.type === 'folder') {
            setSharedFolderData(result)
            setSelectedSharedPoemIndices((result.poems || []).map((_, i) => i))
            window.history.replaceState({}, document.title, window.location.pathname)
          } else if (result.text) {
            const newId = addPoem(result.text, result.title || '')
            window.history.replaceState({}, document.title, window.location.pathname)
            setActivePoem({ id: newId, text: result.text, title: result.title || '' })
            setRoute('practice')
            setActiveTab('main')
          }
        })
        .catch((err) => {
          console.error('Failed to parse shared item from URL', err)
        })
    }
  }, [])

  const handleSavePoem = ({ text, title, folderId }) => {
    if (activePoem && activePoem.id) {
      // Editing existing poem
      updatePoem(activePoem.id, text, title, folderId)
      setActivePoem({ ...activePoem, text, title, folderId })
      setRoute('practice')
    } else {
      // Creating new poem
      const newId = addPoem(text, title, folderId)
      setActivePoem({ id: newId, text, title, folderId })
      setRoute('practice')
    }
    setActiveTab('main')
  }

  const navigateToLibrary = () => {
    setActivePoem(null)
    setRoute('library')
    setActiveTab('main')
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden font-sans selection:bg-zinc-200 selection:text-zinc-900 dark:selection:bg-zinc-800 dark:selection:text-white pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
      <header 
        className="px-4 py-3 sm:py-4 text-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 sticky top-0 z-10 cursor-pointer transition-colors w-full max-w-full overflow-x-hidden" 
        onClick={navigateToLibrary}
      >
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Verso
        </h1>
      </header>
      
      <main className="max-w-4xl w-full mx-auto p-3.5 sm:p-6 pb-28 sm:pb-24 overflow-x-hidden">
        {activeTab === 'profile' ? (
          <ProfileView 
            theme={theme}
            setTheme={setTheme}
            poemsCount={poems.length}
            foldersCount={folders.length}
            sliderStep={sliderStep}
            setSliderStep={setSliderStep}
            revealDuration={revealDuration}
            setRevealDuration={setRevealDuration}
            onExport={exportLibrary}
            onImport={importLibrary}
          />
        ) : activeTab === 'catalog' ? (
          <CatalogView 
            userPoems={poems}
            onPractice={({ title, text }) => {
              const normalizeSig = (s) => (s || '').toLowerCase().replace(/[^a-zа-яё0-9]/gi, '').slice(0, 80)
              const targetSig = normalizeSig(text)
              const existing = poems.find((p) => normalizeSig(p.text) === targetSig)

              if (existing) {
                setActivePoem(existing)
              } else {
                const newId = addPoem(text, title, activeFolderId)
                setActivePoem({ id: newId, text, title, folderId: activeFolderId })
              }
              setRoute('practice')
              setActiveTab('main')
            }}
            onAddToLibrary={({ title, text }) => {
              addPoem(text, title, activeFolderId)
              showToast(`Стих «${title || 'Без названия'}» добавлен в библиотеку!`)
            }}
          />
        ) : (
          <>
            {route === 'library' && (
              <LibraryView 
                poems={poems}
                folders={folders}
                activeFolderId={activeFolderId}
                onSelectFolder={setActiveFolderId}
                onCreateFolder={createFolder}
                onRenameFolder={renameFolder}
                onDeleteFolder={deleteFolder}
                onSetPoemFolder={setPoemFolder}
                onAddPoemsToFolder={addPoemsToFolder}
                onRemovePoemsFromFolder={removePoemsFromFolder}
                onOpen={(poem) => {
                  setActivePoem(poem)
                  setRoute('practice')
                }}
                onAdd={(folderId) => {
                  setActivePoem(null)
                  setActiveFolderId(folderId || null)
                  setRoute('input')
                }}
                onEdit={(poem) => {
                  setActivePoem(poem)
                  setActiveFolderId(poem.folderId || null)
                  setRoute('input')
                }}
                onDelete={deletePoem}
              />
            )}

            {route === 'input' && (
              <InputView 
                initialText={activePoem ? activePoem.text : ''}
                initialTitle={activePoem ? activePoem.title : ''}
                initialFolderId={activePoem ? activePoem.folderId : activeFolderId}
                folders={folders}
                onSave={handleSavePoem}
                onCancel={navigateToLibrary}
                onSelectFromCatalog={() => setActiveTab('catalog')}
                onImportFolder={(folderItem) => {
                  setSharedFolderData(folderItem)
                  setSelectedSharedPoemIndices((folderItem.poems || []).map((_, i) => i))
                }}
              />
            )}

            {route === 'practice' && activePoem && (
              <PracticeView 
                text={activePoem.text} 
                onBack={navigateToLibrary}
                sliderStep={sliderStep}
                revealDuration={revealDuration}
                onCompleteSession={() => recordPracticeSession(activePoem.id)}
              />
            )}
          </>
        )}
      </main>

      {/* Shared Folder Incoming Modal */}
      {sharedFolderData && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSharedFolderData(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[90vh] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Folder className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Вам отправили папку
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                    «{sharedFolderData.name}» • {sharedFolderData.poems.length} {sharedFolderData.poems.length === 1 ? 'стих' : 'стихов'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSharedFolderData(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Выберите стихи, которые хотите импортировать в свою библиотеку:
            </p>

            {/* List of poems with checkboxes */}
            <div className="flex-1 overflow-y-auto max-h-[40vh] flex flex-col gap-1.5 pr-1">
              {sharedFolderData.poems.map((p, idx) => {
                const isSelected = selectedSharedPoemIndices.includes(idx)
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedSharedPoemIndices(prev => 
                        isSelected ? prev.filter(i => i !== idx) : [...prev, idx]
                      )
                    }}
                    className={clsx(
                      "p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center gap-3",
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/30 text-zinc-900 dark:text-zinc-100"
                        : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-800 text-zinc-500 opacity-60"
                    )}
                  >
                    <div className="shrink-0 text-amber-500">
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-zinc-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-semibold truncate">
                        {p.title || 'Без названия'}
                      </div>
                      <div className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-1 mt-0.5">
                        {p.text}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSharedPoemIndices(sharedFolderData.poems.map((_, i) => i))}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Все
                </button>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedSharedPoemIndices([])}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Снять
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSharedFolderData(null)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={selectedSharedPoemIndices.length === 0}
                  onClick={() => {
                    const poemsToImport = sharedFolderData.poems.filter((_, i) => selectedSharedPoemIndices.includes(i))
                    const res = importFolder(sharedFolderData.name, poemsToImport)
                    setActiveFolderId(res.folderId)
                    setRoute('library')
                    setActiveTab('main')
                    setSharedFolderData(null)
                    showToast(`Папка «${res.name}» (${res.count} стихов) добавлена в библиотеку!`)
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Импортировать ({selectedSharedPoemIndices.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Message */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs sm:text-sm font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bottom Navigation Tabs: Мои стихи, Каталог, Профиль with safe-area padding */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-md mx-auto h-14 sm:h-16 flex items-center justify-around px-4">
          <button
            id="tab-main"
            type="button"
            onClick={() => setActiveTab('main')}
            className={clsx(
              "flex flex-col items-center justify-center gap-0.5 sm:gap-1 flex-1 py-1 rounded-xl transition-all cursor-pointer select-none",
              activeTab === 'main'
                ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
            )}
          >
            <Home className={clsx("w-5 h-5 transition-transform", activeTab === 'main' ? "scale-105" : "opacity-75")} />
            <span className="text-[11px] sm:text-xs">Мои стихи</span>
          </button>

          <button
            id="tab-catalog"
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={clsx(
              "flex flex-col items-center justify-center gap-0.5 sm:gap-1 flex-1 py-1 rounded-xl transition-all cursor-pointer select-none",
              activeTab === 'catalog'
                ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
            )}
          >
            <BookOpen className={clsx("w-5 h-5 transition-transform", activeTab === 'catalog' ? "scale-105" : "opacity-75")} />
            <span className="text-[11px] sm:text-xs">Каталог</span>
          </button>

          <button
            id="tab-profile"
            type="button"
            onClick={() => setActiveTab('profile')}
            className={clsx(
              "flex flex-col items-center justify-center gap-0.5 sm:gap-1 flex-1 py-1 rounded-xl transition-all cursor-pointer select-none",
              activeTab === 'profile'
                ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
            )}
          >
            <User className={clsx("w-5 h-5 transition-transform", activeTab === 'profile' ? "scale-105" : "opacity-75")} />
            <span className="text-[11px] sm:text-xs">Профиль</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default App
