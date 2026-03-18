import { useRef, useEffect, useCallback, useState } from 'react'
import Paragraph from './Paragraph'
import FloatingToolbar from './FloatingToolbar'

export default function BookPane({
  paragraphs,
  currentParagraphIndex,
  highlights,
  syncModeActive,
  hoveredParagraphRef,
  onParagraphClick,
  onAddHighlight,
  onExplainHighlight,
  onReflectHighlight,
}) {
  const containerRef = useRef(null)
  const [toolbarPos, setToolbarPos] = useState(null)
  const [selection, setSelection] = useState(null)

  // Auto-scroll to active paragraph
  useEffect(() => {
    if (currentParagraphIndex < 0 || !containerRef.current) return
    const el = containerRef.current.querySelector(`[data-index="${currentParagraphIndex}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentParagraphIndex])

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setToolbarPos(null)
      setSelection(null)
      return
    }

    const text = sel.toString().trim()
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Find which paragraph this selection is in
    let node = range.startContainer
    while (node && !node.dataset?.index) {
      node = node.parentElement
    }
    if (!node) {
      setToolbarPos(null)
      return
    }

    const paragraphIndex = parseInt(node.dataset.index)
    const paragraph = paragraphs[paragraphIndex]
    if (!paragraph) return

    // Calculate offsets relative to paragraph text
    const fullText = paragraph.text
    const startOffset = fullText.indexOf(text)
    const endOffset = startOffset >= 0 ? startOffset + text.length : 0

    setToolbarPos({ x: rect.left + rect.width / 2 - 75, y: rect.top + window.scrollY })
    setSelection({
      text,
      paragraphId: paragraph.id,
      paragraphIndex,
      startOffset: startOffset >= 0 ? startOffset : 0,
      endOffset: endOffset || text.length,
    })
  }, [paragraphs])

  const handleExplain = useCallback(() => {
    if (!selection) return
    const highlight = onAddHighlight(
      selection.paragraphId,
      selection.text,
      selection.startOffset,
      selection.endOffset
    )
    onExplainHighlight(highlight)
    setToolbarPos(null)
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [selection, onAddHighlight, onExplainHighlight])

  const handleReflect = useCallback(() => {
    if (!selection) return
    const highlight = onAddHighlight(
      selection.paragraphId,
      selection.text,
      selection.startOffset,
      selection.endOffset
    )
    onReflectHighlight(highlight)
    setToolbarPos(null)
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [selection, onAddHighlight, onReflectHighlight])

  const handleClickOutside = useCallback(() => {
    // Small delay to allow button clicks to register
    setTimeout(() => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) {
        setToolbarPos(null)
        setSelection(null)
      }
    }, 200)
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-6 md:p-10 space-y-1"
      onMouseUp={handleMouseUp}
      onMouseDown={handleClickOutside}
    >
      <FloatingToolbar
        position={toolbarPos}
        onExplain={handleExplain}
        onReflect={handleReflect}
      />
      {paragraphs.map((p, i) => (
        <Paragraph
          key={p.id}
          paragraph={p}
          index={i}
          isActive={i === currentParagraphIndex}
          highlights={highlights}
          onClick={() => onParagraphClick(i)}
          onMouseEnter={() => { hoveredParagraphRef.current = i }}
          isSyncMode={syncModeActive}
        />
      ))}
    </div>
  )
}
