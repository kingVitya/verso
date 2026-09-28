import { useState, useEffect } from 'react'
import { Home, User, BookOpen, X, Check } from 'lucide-react'
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
    addPoem, 
    updatePoem, 
    deletePoem, 
    recordPracticeSession, 
    exportLibrary, 
    importLibrary 
  } = useLibrary()
  const { theme, setTheme } = useTheme()
  const { sliderStep, setSliderStep, revealDuration, setRevealDuration } = useSettings()
  
  const [activeTab, setActiveTab] = useState('main')
  const [route, setRoute] = useState('library')
  const [activePoem, setActivePoem] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev))
    }, 4000)
  }
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hasShareParam = 
      params.get('p') || 
      params.get('share')

    if (hasShareParam) {
      parseAndFetchPoem(window.location.search)
        .then((result) => {
          if (result.text) {
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

  const handleSavePoem = ({ text, title }) => {
    if (activePoem && activePoem.id) {
      updatePoem(activePoem.id, text, title)
      setActivePoem({ ...activePoem, text, title })
      setRoute('practice')
    } else {
      const newId = addPoem(text, title)
      setActivePoem({ id: newId, text, title })
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
      
      <main className={clsx(
        "max-w-4xl w-full mx-auto p-3.5 sm:p-6 overflow-x-hidden",
        (route === 'library' || activeTab === 'catalog' || activeTab === 'profile') ? "pb-28 sm:pb-24" : "pb-10"
      )}>
        {activeTab === 'profile' ? (
          <ProfileView 
            theme={theme}
            setTheme={setTheme}
            poemsCount={poems.length}
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
                const newId = addPoem(text, title)
                setActivePoem({ id: newId, text, title })
              }
              setRoute('practice')
              setActiveTab('main')
            }}
            onAddToLibrary={({ title, text }) => {
              addPoem(text, title)
              showToast(`Стих «${title || 'Без названия'}» добавлен в библиотеку!`)
            }}
          />
        ) : (
          <>
            {route === 'library' && (
              <LibraryView 
                poems={poems}
                onOpen={(poem) => {
                  setActivePoem(poem)
                  setRoute('practice')
                }}
                onAdd={() => {
                  setActivePoem(null)
                  setRoute('input')
                }}
                onEdit={(poem) => {
                  setActivePoem(poem)
                  setRoute('input')
                }}
                onDelete={deletePoem}
              />
            )}

            {route === 'input' && (
              <InputView 
                initialText={activePoem ? activePoem.text : ''}
                initialTitle={activePoem ? activePoem.title : ''}
                onSave={handleSavePoem}
                onCancel={navigateToLibrary}
                onSelectFromCatalog={() => setActiveTab('catalog')}
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

      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs sm:text-sm font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {(route === 'library' || activeTab === 'catalog' || activeTab === 'profile') && (
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
      )}
    </div>
  )
}

export default App
