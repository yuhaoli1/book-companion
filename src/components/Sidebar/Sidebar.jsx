import NoteCard from './NoteCard'
import AIPanel from '../AIPanel'

export default function Sidebar({
  highlights,
  paragraphs,
  activeHighlight,
  streamedText,
  aiLoading,
  aiError,
  onDeleteHighlight,
  onScrollToParagraph,
  onExplainHighlight,
  onSaveExplanation,
  onCloseAI,
  onUpdateReflection,
  isOpen,
  onToggle,
}) {
  const getParagraphIndex = (paragraphId) =>
    paragraphs.findIndex(p => p.id === paragraphId)

  // Sort highlights by paragraph order
  const sorted = [...highlights].sort(
    (a, b) => getParagraphIndex(a.paragraphId) - getParagraphIndex(b.paragraphId)
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="md:hidden fixed top-4 right-4 z-50 bg-ink-lighter rounded-full w-10 h-10 flex items-center justify-center text-cream-dim hover:text-cream cursor-pointer"
      >
        {isOpen ? '✕' : '📝'}
      </button>

      <div
        className={`
          w-full md:w-[35%] bg-ink-light/50 border-l border-ink-lighter
          overflow-y-auto flex flex-col
          fixed md:relative inset-0 md:inset-auto z-40 md:z-auto
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-ink-lighter flex items-center justify-between sticky top-0 bg-ink-light/95 backdrop-blur-sm z-10">
          <h3 className="text-cream font-semibold text-sm">
            Study Notes
            {highlights.length > 0 && (
              <span className="ml-2 text-cream-dim/60 font-normal">({highlights.length})</span>
            )}
          </h3>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {/* AI Panel for active highlight */}
          {activeHighlight && (
            <AIPanel
              highlight={activeHighlight}
              streamedText={streamedText}
              loading={aiLoading}
              error={aiError}
              onSave={onSaveExplanation}
              onClose={onCloseAI}
            />
          )}

          {sorted.length === 0 && !activeHighlight && (
            <div className="text-cream-dim/40 text-sm text-center py-8">
              <p className="mb-2">No highlights yet.</p>
              <p>Select text in the book to get started.</p>
            </div>
          )}

          {sorted.map(h => (
            <NoteCard
              key={h.id}
              highlight={h}
              paragraphIndex={getParagraphIndex(h.paragraphId)}
              onDelete={onDeleteHighlight}
              onScrollTo={onScrollToParagraph}
              onExplain={onExplainHighlight}
              onUpdateReflection={onUpdateReflection}
            />
          ))}
        </div>
      </div>
    </>
  )
}
