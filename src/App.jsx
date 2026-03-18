import { useState, useEffect, useCallback } from 'react'
import AuthScreen from './components/AuthScreen'
import AppShell from './components/AppShell'
import Library from './components/Library'
import Settings from './components/Settings'
import UploadModal from './components/UploadModal'
import ReaderLayout from './components/Reader/ReaderLayout'
import { useAuth } from './hooks/useAuth'
import { useBooks } from './hooks/useSupabaseData'

const STORAGE_KEY = 'book-companion-state'

function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { books, loading: booksLoading, fetchBooks, saveBook, deleteBook } = useBooks(user?.id)
  const [page, setPage] = useState('library') // 'library' | 'settings'
  const [activeBook, setActiveBook] = useState(null)
  const [progress, setProgress] = useState({})
  const [showUpload, setShowUpload] = useState(false)

  // Fetch books when user logs in
  useEffect(() => {
    if (user) fetchBooks()
  }, [user, fetchBooks])

  // Fetch all reading progress for library display
  useEffect(() => {
    if (!user || books.length === 0) return
    const fetchAllProgress = async () => {
      const { supabase } = await import('./lib/supabase')
      const { data } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
      if (data) {
        const map = {}
        data.forEach(row => {
          map[row.book_id] = {
            lastParagraphIndex: row.last_paragraph_index,
            totalReadingTimeSeconds: row.total_reading_time_seconds,
            lastReadAt: row.last_read_at,
          }
        })
        setProgress(map)
      }
    }
    fetchAllProgress()
  }, [user, books])

  const handleBookLoaded = useCallback(async ({ title, paragraphs, audioUrl }) => {
    const saved = await saveBook(title, paragraphs.length)
    if (saved) {
      localStorage.setItem(`${STORAGE_KEY}-paragraphs-${saved.id}`, JSON.stringify(paragraphs))
      setActiveBook({ id: saved.id, title, paragraphs, audioUrl })
      setShowUpload(false)
    }
  }, [saveBook])

  const handleSelectBook = useCallback((book) => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-paragraphs-${book.id}`)
    if (stored) {
      const paragraphs = JSON.parse(stored)
      setActiveBook({ id: book.id, title: book.title, paragraphs, audioUrl: null })
    } else {
      alert('Book text not found locally. Please re-upload the file.')
    }
  }, [])

  const handleBackToLibrary = useCallback(() => {
    setActiveBook(null)
    fetchBooks()
  }, [fetchBooks])

  const handleSignOut = useCallback(async () => {
    await signOut()
    setActiveBook(null)
    setPage('library')
  }, [signOut])

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <AuthScreen />
  }

  // Reader — full screen, opts out of shell
  if (activeBook) {
    return (
      <ReaderLayout
        key={activeBook.id}
        book={activeBook}
        onReset={handleBackToLibrary}
        user={user}
        onSignOut={handleSignOut}
      />
    )
  }

  // App shell with sidebar
  return (
    <AppShell
      user={user}
      onSignOut={handleSignOut}
      currentPage={page}
      onNavigate={setPage}
    >
      {page === 'settings' && <Settings user={user} />}
      {page === 'library' && (
        <Library
          user={user}
          onSignOut={handleSignOut}
          onSelectBook={handleSelectBook}
          onNewBook={() => setShowUpload(true)}
          books={books}
          progress={progress}
          loading={booksLoading}
          onDeleteBook={deleteBook}
        />
      )}
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onBookLoaded={handleBookLoaded}
      />
    </AppShell>
  )
}

export default App
