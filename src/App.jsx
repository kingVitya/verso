import { useState, useEffect } from 'react'
import LZString from 'lz-string'
import InputView from './components/InputView'
import PracticeView from './components/PracticeView'
import LibraryView from './components/LibraryView'
import { useLibrary } from './hooks/useLibrary'

function App() {
  const { poems, addPoem, updatePoem, deletePoem } = useLibrary()
  
  // Routes: 'library', 'input', 'practice'
  const [route, setRoute] = useState('library')
  
  // State for Practice & Edit mode
  const [activePoem, setActivePoem] = useState(null)
  
  // Check for shared poem in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shared = params.get('share')
    
    if (shared) {
      try {
        const text = LZString.decompressFromEncodedURIComponent(shared)
        if (text) {
          const newId = addPoem(text, '')
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname)
          // Open it
          setActivePoem({ id: newId, text, title: '' })
          setRoute('practice')
        }
      } catch (e) {
        console.error('Failed to parse shared poem', e)
      }
    }
  }, []) // Empty dependency array ensures it runs once on mount. We ignore warning because addPoem is stable enough or we don't want infinite loops.

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
  }

  const navigateToLibrary = () => {
    setActivePoem(null)
    setRoute('library')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-purple-300 selection:text-purple-900">
      <header className="px-4 py-4 md:py-6 text-center border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10 shadow-sm cursor-pointer" onClick={navigateToLibrary}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">
          Lexis Trainer
        </h1>
      </header>
      
      <main className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
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
          />
        )}
      </main>
    </div>
  )
}

export default App
