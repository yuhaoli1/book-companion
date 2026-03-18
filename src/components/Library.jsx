import { useState } from 'react'

function formatRelativeDate(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Library({
  user,
  onSignOut,
  onSelectBook,
  onNewBook,
  books = [],
  progress = {},
  loading = false,
  onDeleteBook,
}) {
  const [hoveredCard, setHoveredCard] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const getProgress = (book) => {
    const p = progress[book.id]
    if (!p || !book.paragraphCount) return 0
    return Math.min(1, (p.lastParagraphIndex + 1) / book.paragraphCount)
  }

  const handleDelete = (e, bookId) => {
    e.stopPropagation()
    if (confirmDelete === bookId) {
      onDeleteBook(bookId)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(bookId)
    }
  }

  return (
    <div className="p-6 md:p-10">
      {/* Page title */}
      <div className="max-w-5xl mx-auto mb-10">
        <h1 className="font-serif text-3xl text-cream tracking-tight">Library</h1>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto">
        {loading ? (
          /* Loading state */
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-10 h-10 border-2 border-amber/30 border-t-amber rounded-full animate-spin mb-4" />
            <p className="text-cream-dim text-sm">Loading your library...</p>
          </div>
        ) : books.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-6xl mb-6 opacity-40">&#128218;</div>
            <p className="text-cream text-xl font-serif mb-2">
              Start your reading journey
            </p>
            <p className="text-cream-dim/60 text-sm mb-8 max-w-sm">
              Add your first book to begin annotating, reflecting, and learning.
            </p>
            <button
              onClick={onNewBook}
              className="bg-amber hover:bg-amber-dim text-ink font-semibold rounded-lg px-6 py-3 transition-colors cursor-pointer"
            >
              Add Your First Book
            </button>
          </div>
        ) : (
          /* Book grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {books.map((book) => {
              const p = progress[book.id]
              const pct = getProgress(book)
              const lastRead = p?.lastReadAt
                ? formatRelativeDate(p.lastReadAt)
                : formatRelativeDate(book.updatedAt)

              return (
                <div
                  key={book.id}
                  onClick={() => onSelectBook(book)}
                  onMouseEnter={() => setHoveredCard(book.id)}
                  onMouseLeave={() => {
                    setHoveredCard(null)
                    setConfirmDelete(null)
                  }}
                  className="group relative bg-ink-light border border-ink-lighter rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-amber/40 hover:bg-ink-light/80"
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, book.id)}
                    className={`
                      absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center
                      text-xs transition-all duration-150 cursor-pointer
                      ${confirmDelete === book.id
                        ? 'bg-red-900/40 text-red-400 opacity-100'
                        : 'bg-ink-lighter/80 text-cream-dim/40 hover:text-cream-dim opacity-0 group-hover:opacity-100'
                      }
                    `}
                    title={confirmDelete === book.id ? 'Click again to confirm' : 'Delete book'}
                  >
                    {confirmDelete === book.id ? '?' : '\u00D7'}
                  </button>

                  {/* Book title */}
                  <h3 className="font-serif text-lg text-cream mb-3 pr-6 leading-snug line-clamp-2">
                    {book.title}
                  </h3>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-cream-dim/50 mb-4">
                    <span>{book.paragraphCount} paragraphs</span>
                    {lastRead && (
                      <>
                        <span className="opacity-30">&middot;</span>
                        <span>{lastRead}</span>
                      </>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1 bg-ink-lighter rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber/60 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(pct * 100)}%` }}
                    />
                  </div>
                  {pct > 0 && (
                    <p className="text-[10px] text-cream-dim/40 mt-1.5">
                      {Math.round(pct * 100)}% read
                    </p>
                  )}
                </div>
              )
            })}

            {/* Add Book card */}
            <div
              onClick={onNewBook}
              className="flex flex-col items-center justify-center border-2 border-dashed border-ink-lighter rounded-xl p-5 min-h-[160px] cursor-pointer transition-all duration-200 hover:border-amber/50 hover:bg-ink-light/30"
            >
              <span className="text-3xl text-cream-dim/30 mb-2">+</span>
              <span className="text-sm text-cream-dim/50">Add Book</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
