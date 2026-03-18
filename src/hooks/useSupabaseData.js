import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// --- useBooks ---

export function useBooks(userId) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchBooks = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      if (error) throw error
      setBooks(
        (data || []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          paragraphCount: row.paragraph_count,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }))
      )
    } catch (err) {
      console.error('fetchBooks error:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const saveBook = useCallback(
    async (title, paragraphCount) => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('books')
        .insert({
          user_id: userId,
          title,
          paragraph_count: paragraphCount,
        })
        .select()
        .single()
      if (error) {
        console.error('saveBook error:', error)
        return null
      }
      const book = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        paragraphCount: data.paragraph_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
      setBooks((prev) => [book, ...prev])
      return book
    },
    [userId]
  )

  const deleteBook = useCallback(
    async (bookId) => {
      const { error } = await supabase.from('books').delete().eq('id', bookId)
      if (error) {
        console.error('deleteBook error:', error)
        return
      }
      setBooks((prev) => prev.filter((b) => b.id !== bookId))
    },
    []
  )

  return { books, loading, fetchBooks, saveBook, deleteBook }
}

// --- useSupabaseHighlights ---

function highlightToRow(highlight, userId, bookId) {
  return {
    id: highlight.id,
    user_id: userId,
    book_id: bookId,
    paragraph_id: highlight.paragraphId,
    selected_text: highlight.selectedText,
    start_offset: highlight.startOffset,
    end_offset: highlight.endOffset,
    ai_explanation: highlight.aiExplanation ?? null,
    reflection: highlight.reflection ?? null,
  }
}

function rowToHighlight(row) {
  return {
    id: row.id,
    paragraphId: row.paragraph_id,
    selectedText: row.selected_text,
    startOffset: row.start_offset,
    endOffset: row.end_offset,
    aiExplanation: row.ai_explanation,
    reflection: row.reflection,
    createdAt: row.created_at,
  }
}

export function useSupabaseHighlights(userId, bookId) {
  const [highlights, setHighlights] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchHighlights = useCallback(async () => {
    if (!userId || !bookId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .order('created_at', { ascending: true })
      if (error) throw error
      setHighlights((data || []).map(rowToHighlight))
    } catch (err) {
      console.error('fetchHighlights error:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, bookId])

  const saveHighlight = useCallback(
    async (highlight) => {
      if (!userId || !bookId) return
      const row = highlightToRow(highlight, userId, bookId)
      const { data, error } = await supabase
        .from('highlights')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single()
      if (error) {
        console.error('saveHighlight error:', error)
        return
      }
      const mapped = rowToHighlight(data)
      setHighlights((prev) => {
        const idx = prev.findIndex((h) => h.id === mapped.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = mapped
          return updated
        }
        return [...prev, mapped]
      })
    },
    [userId, bookId]
  )

  const removeHighlight = useCallback(
    async (highlightId) => {
      const { error } = await supabase
        .from('highlights')
        .delete()
        .eq('id', highlightId)
      if (error) {
        console.error('removeHighlight error:', error)
        return
      }
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId))
    },
    []
  )

  const syncHighlights = useCallback(
    async (localHighlights) => {
      if (!userId || !bookId || !localHighlights.length) return
      const rows = localHighlights.map((h) => highlightToRow(h, userId, bookId))
      const { error } = await supabase
        .from('highlights')
        .upsert(rows, { onConflict: 'id' })
      if (error) {
        console.error('syncHighlights error:', error)
        return
      }
      await fetchHighlights()
    },
    [userId, bookId, fetchHighlights]
  )

  return { highlights, loading, fetchHighlights, saveHighlight, removeHighlight, syncHighlights }
}

// --- useReadingProgress ---

export function useReadingProgress(userId, bookId) {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchProgress = useCallback(async () => {
    if (!userId || !bookId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .single()
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      if (data) {
        setProgress({
          lastParagraphIndex: data.last_paragraph_index,
          totalReadingTimeSeconds: data.total_reading_time_seconds,
          lastReadAt: data.last_read_at,
        })
      } else {
        setProgress(null)
      }
    } catch (err) {
      console.error('fetchProgress error:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, bookId])

  const updateProgress = useCallback(
    async (lastParagraphIndex, readingTimeSeconds) => {
      if (!userId || !bookId) return
      const row = {
        user_id: userId,
        book_id: bookId,
        last_paragraph_index: lastParagraphIndex,
        total_reading_time_seconds: readingTimeSeconds,
        last_read_at: new Date().toISOString(),
      }
      const { data, error } = await supabase
        .from('reading_progress')
        .upsert(row, { onConflict: 'user_id,book_id' })
        .select()
        .single()
      if (error) {
        console.error('updateProgress error:', error)
        return
      }
      setProgress({
        lastParagraphIndex: data.last_paragraph_index,
        totalReadingTimeSeconds: data.total_reading_time_seconds,
        lastReadAt: data.last_read_at,
      })
    },
    [userId, bookId]
  )

  return { progress, loading, fetchProgress, updateProgress }
}
