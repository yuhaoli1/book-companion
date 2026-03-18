export default function AIPanel({ highlight, streamedText, loading, error, onSave, onClose }) {
  if (!highlight) return null

  return (
    <div className="border-l border-teal/30 bg-teal/5 p-4 rounded-r-lg mb-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-teal-light text-sm font-semibold">AI Explanation</h4>
        <button
          onClick={onClose}
          className="text-cream-dim/50 hover:text-cream text-sm cursor-pointer"
        >
          ✕
        </button>
      </div>

      <blockquote className="text-cream-dim text-sm italic border-l-2 border-ink-lighter pl-3 mb-3">
        "{highlight.selectedText?.slice(0, 100)}{highlight.selectedText?.length > 100 ? '...' : ''}"
      </blockquote>

      {error && (
        <div className="text-red-400 text-sm mb-3 bg-red-400/10 p-2 rounded">
          {error}
        </div>
      )}

      {loading && !streamedText && (
        <div className="flex items-center gap-2 text-cream-dim text-sm">
          <div className="w-4 h-4 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
          Thinking...
        </div>
      )}

      {streamedText && (
        <div className="text-cream text-sm leading-relaxed mb-3 whitespace-pre-wrap">
          {streamedText}
        </div>
      )}

      {streamedText && !loading && (
        <button
          onClick={() => onSave(streamedText)}
          className="bg-teal hover:bg-teal-light text-cream text-sm px-4 py-1.5 rounded cursor-pointer transition-colors"
        >
          Save Explanation
        </button>
      )}
    </div>
  )
}
