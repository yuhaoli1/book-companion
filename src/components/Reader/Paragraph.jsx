import { useMemo } from 'react'

export default function Paragraph({
  paragraph,
  index,
  isActive,
  highlights,
  onClick,
  onMouseEnter,
  isSyncMode,
}) {
  // Build segments with highlights applied
  const segments = useMemo(() => {
    const pHighlights = highlights.filter(h => h.paragraphId === paragraph.id)
    if (pHighlights.length === 0) return [{ text: paragraph.text, highlighted: false }]

    // Sort highlights by startOffset
    const sorted = [...pHighlights].sort((a, b) => a.startOffset - b.startOffset)
    const result = []
    let lastEnd = 0

    for (const h of sorted) {
      if (h.startOffset > lastEnd) {
        result.push({ text: paragraph.text.slice(lastEnd, h.startOffset), highlighted: false })
      }
      result.push({
        text: paragraph.text.slice(h.startOffset, h.endOffset),
        highlighted: true,
        highlightId: h.id,
      })
      lastEnd = Math.max(lastEnd, h.endOffset)
    }
    if (lastEnd < paragraph.text.length) {
      result.push({ text: paragraph.text.slice(lastEnd), highlighted: false })
    }
    return result
  }, [paragraph, highlights])

  return (
    <p
      data-index={index}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        font-serif text-lg leading-relaxed px-4 py-2 rounded-md cursor-pointer
        transition-all duration-300
        ${isActive
          ? 'bg-amber/8 border-l-2 border-amber'
          : 'border-l-2 border-transparent hover:bg-ink-light/50'
        }
        ${isSyncMode ? 'hover:bg-teal/10 hover:border-teal' : ''}
      `}
    >
      <span className="text-cream-dim/40 text-xs font-sans mr-3 select-none">¶{index + 1}</span>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark
            key={i}
            className="bg-amber/20 text-cream rounded-sm px-0.5"
            data-highlight-id={seg.highlightId}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  )
}
