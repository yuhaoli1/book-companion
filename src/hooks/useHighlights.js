import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

export function useHighlights(initialHighlights = []) {
  const [highlights, setHighlights] = useState(initialHighlights)

  const addHighlight = useCallback((paragraphId, selectedText, startOffset, endOffset) => {
    const newHighlight = {
      id: uuidv4(),
      paragraphId,
      selectedText,
      startOffset,
      endOffset,
      aiExplanation: null,
      reflection: null,
      createdAt: new Date().toISOString(),
    }
    setHighlights(prev => [...prev, newHighlight])
    return newHighlight
  }, [])

  const updateHighlight = useCallback((id, updates) => {
    let updated = null
    setHighlights(prev =>
      prev.map(h => {
        if (h.id === id) {
          updated = { ...h, ...updates }
          return updated
        }
        return h
      })
    )
    return updated
  }, [])

  const deleteHighlight = useCallback((id) => {
    setHighlights(prev => prev.filter(h => h.id !== id))
  }, [])

  return { highlights, setHighlights, addHighlight, updateHighlight, deleteHighlight }
}
