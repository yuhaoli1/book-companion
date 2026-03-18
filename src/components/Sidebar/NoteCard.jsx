import { useState } from 'react'

export default function NoteCard({
  highlight,
  paragraphIndex,
  onDelete,
  onScrollTo,
  onExplain,
  onUpdateReflection,
}) {
  const [editing, setEditing] = useState(false)
  const [reflectionDraft, setReflectionDraft] = useState(highlight.reflection || '')

  const saveReflection = () => {
    onUpdateReflection(highlight.id, reflectionDraft)
    setEditing(false)
  }

  return (
    <div className="bg-ink-light rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onScrollTo(paragraphIndex)}
          className="text-cream-dim text-xs hover:text-amber transition-colors cursor-pointer"
        >
          ¶ {paragraphIndex + 1}
        </button>
        <button
          onClick={() => onDelete(highlight.id)}
          className="text-cream-dim/40 hover:text-red-400 text-xs cursor-pointer transition-colors"
        >
          Delete
        </button>
      </div>

      {/* Quoted text */}
      <blockquote className="text-cream text-sm font-serif italic border-l-2 border-amber/50 pl-3">
        "{highlight.selectedText.slice(0, 120)}{highlight.selectedText.length > 120 ? '...' : ''}"
      </blockquote>

      {/* AI Explanation */}
      {highlight.aiExplanation && (
        <div className="border-l-2 border-teal pl-3">
          <p className="text-teal-light text-xs font-semibold mb-1">AI Explanation</p>
          <p className="text-cream-dim text-sm leading-relaxed">{highlight.aiExplanation}</p>
        </div>
      )}

      {!highlight.aiExplanation && (
        <button
          onClick={() => onExplain(highlight)}
          className="text-teal-light text-xs hover:text-teal transition-colors cursor-pointer"
        >
          💡 Get explanation
        </button>
      )}

      {/* Reflection */}
      {highlight.reflection && !editing ? (
        <div className="border-l-2 border-amber pl-3">
          <p className="text-amber text-xs font-semibold mb-1">My Reflection</p>
          <p className="text-cream-dim text-sm leading-relaxed">{highlight.reflection}</p>
          <button
            onClick={() => setEditing(true)}
            className="text-cream-dim/40 text-xs mt-1 hover:text-cream cursor-pointer"
          >
            Edit
          </button>
        </div>
      ) : editing || !highlight.reflection ? (
        <div className="space-y-2">
          <textarea
            value={reflectionDraft}
            onChange={(e) => setReflectionDraft(e.target.value)}
            placeholder="Write your reflection..."
            rows={3}
            className="w-full bg-ink border border-ink-lighter rounded px-3 py-2 text-sm text-cream placeholder-cream-dim/40 focus:outline-none focus:border-amber/50 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={saveReflection}
              disabled={!reflectionDraft.trim()}
              className="text-xs bg-amber/20 text-amber px-3 py-1 rounded cursor-pointer hover:bg-amber/30 disabled:opacity-30 transition-colors"
            >
              Save
            </button>
            {editing && (
              <button
                onClick={() => { setEditing(false); setReflectionDraft(highlight.reflection || '') }}
                className="text-xs text-cream-dim px-3 py-1 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
