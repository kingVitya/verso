import { useState, useEffect } from 'react'
import LZString from 'lz-string'
import { Home, User } from 'lucide-react'
import clsx from 'clsx'
import InputView from './components/InputView'
import PracticeView from './components/PracticeView'
import LibraryView from './components/LibraryView'
import ProfileView from './components/ProfileView'
import { useLibrary } from './hooks/useLibrary'
import { useTheme } from './hooks/useTheme'
import { useSettings } from './hooks/useSettings'
import { parseAndFetchPoem } from './lib/shareParser'

function App() {
  const { poems, addPoem, updatePoem, deletePoem } = useLibrary()
  const { theme, setTheme } = useTheme()
  const { sliderStep, setSliderStep, revealDuration, setRevealDuration } = useSettings()
  
  // Navigation tabs: 'main' | 'profile'
  const [activeTab, setActiveTab] = useState('main')

  // Routes within Main tab: 'library', 'input', 'practice'
  const [route, setRoute] = useState('library')
  
  // State for Practice & Edit mode
  const [activePoem, setActivePoem] = useState(null)
  
  // Check for shared poem in URL on mount (?p=shortId or ?share=compressed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('p') || params.get('share')) {
      parseAndFetchPoem(window.location.search)
        .then(({ text, title }) => {
          if (text) {
            const newId = addPoem(text, title || '')
            window.history.replaceState({}, document.title, window.location.pathname)
            setActivePoem({ id: newId, text, title: title || '' })
            setRoute('practice')
            setActiveTab('main')
          }
        })
        .catch((err) => {
          console.error('Failed to parse shared poem from URL', err)
        })
    }
  }, []) // Empty dependency array ensures it runs once on mount.

  const handleSavePoem = ({ text, title }) => {
    if (activePoem && activePoem.id) {
      // We are editing
      updatePoem(activePoem.id, text, title)
      setActivePoem({ ...activePoem, text, title })
      setRoute('practice')
    } else {
      // New poem
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
    <div className="min-h-screen font-sans selection:bg-zinc-200 selection:text-zinc-900 dark:selection:bg-zinc-800 dark:selection:text-white pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
      <header 
        className="px-4 py-3 sm:py-4 text-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 sticky top-0 z-10 cursor-pointer transition-colors" 
        onClick={navigateToLibrary}
      >
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Verso
        </h1>
      </header>
      
      <main className="max-w-4xl mx-auto p-3.5 sm:p-6 pb-28 sm:pb-24">
        {activeTab === 'profile' ? (
          <ProfileView 
            theme={theme}
            setTheme={setTheme}
            poemsCount={poems.length}
            sliderStep={sliderStep}
            setSliderStep={setSliderStep}
            revealDuration={revealDuration}
            setRevealDuration={setRevealDuration}
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
              />
            )}

            {route === 'practice' && activePoem && (
              <PracticeView 
                text={activePoem.text} 
                onBack={navigateToLibrary}
                sliderStep={sliderStep}
                revealDuration={revealDuration}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation Tabs: Главная & Профиль with safe-area padding */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-md mx-auto h-14 sm:h-16 flex items-center justify-around px-6">
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
            <span className="text-[11px] sm:text-xs">Главная</span>
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
