import { useState, useRef, useCallback } from 'react'
import { parseText } from '../utils/textParser'
import { extractTextFromPDF } from '../utils/pdfParser'

export default function Landing({ onBookLoaded, user, onSignOut, onBack }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [audioName, setAudioName] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)
  const audioInputRef = useRef(null)

  const processFile = useCallback(async (file) => {
    if (!file) return
    const name = file.name

    if (name.endsWith('.pdf')) {
      setLoading(true)
      try {
        const extracted = await extractTextFromPDF(file)
        setText(extracted)
        if (!title) setTitle(name.replace(/\.pdf$/i, ''))
      } catch (err) {
        console.error('PDF extraction failed:', err)
      } finally {
        setLoading(false)
      }
    } else if (name.endsWith('.txt')) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setText(ev.target.result)
        if (!title) setTitle(name.replace(/\.txt$/i, ''))
      }
      reader.readAsText(file)
    } else if (file.type.startsWith('audio/') || /\.(mp3|m4a|wav)$/i.test(name)) {
      setAudioFile(file)
      setAudioName(name)
    }
  }, [title])

  const handleFileInput = (e) => processFile(e.target.files[0])
  const handleAudioFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAudioFile(file)
    setAudioName(file.name)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      processFile(file)
    }
  }, [processFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const paragraphCount = text.trim() ? parseText(text).length : 0

  const handleStart = () => {
    if (!text.trim()) return
    const paragraphs = parseText(text)
    const audioUrl = audioFile ? URL.createObjectURL(audioFile) : null
    onBookLoaded({ title: title || 'Untitled', paragraphs, audioUrl })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-12">
          {onBack && (
            <button
              onClick={onBack}
              className="text-cream-dim/50 hover:text-cream text-sm cursor-pointer transition-colors mb-6 inline-block"
            >
              ← Back to Library
            </button>
          )}
          <h1 className="font-serif text-4xl md:text-5xl text-cream mb-3 tracking-tight">
            Book Study Companion
          </h1>
          <p className="text-cream-dim text-lg">
            Turn passive reading into active, annotated learning.
          </p>
          {user && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-cream-dim text-sm">
                {user.user_metadata?.display_name || user.email}
              </span>
              <button
                onClick={onSignOut}
                className="text-cream-dim/50 hover:text-cream text-xs cursor-pointer transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer
              transition-all duration-200
              ${dragging
                ? 'border-amber bg-amber/10 scale-[1.02]'
                : text
                  ? 'border-green-600/50 bg-green-900/10'
                  : 'border-ink-lighter hover:border-amber/50 hover:bg-ink-light/50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf"
              onChange={handleFileInput}
              className="hidden"
            />
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
                <p className="text-cream-dim text-sm">Extracting text from PDF...</p>
              </div>
            ) : text ? (
              <div className="flex flex-col items-center gap-2">
                <div className="text-3xl mb-1">&#10003;</div>
                <p className="text-cream text-sm font-medium">
                  {title || 'Book'} loaded
                </p>
                <p className="text-cream-dim/60 text-xs">
                  {paragraphCount} paragraphs &middot; Click or drop to replace
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="text-4xl mb-1 opacity-60">&#128214;</div>
                <p className="text-cream font-medium">
                  Drop your PDF or TXT file here
                </p>
                <p className="text-cream-dim/60 text-sm">
                  or click to browse
                </p>
              </div>
            )}
          </div>

          {/* Title field */}
          <div>
            <label className="block text-cream-dim text-sm mb-2 font-medium">Book Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Thinking, Fast and Slow"
              className="w-full bg-ink-light border border-ink-lighter rounded-lg px-4 py-3 text-cream placeholder-cream-dim/50 focus:outline-none focus:border-amber transition-colors"
            />
          </div>

          {/* Paste text (collapsible) */}
          <details className="group">
            <summary className="text-cream-dim/60 text-sm cursor-pointer hover:text-cream-dim transition-colors select-none">
              Or paste text manually
            </summary>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your book text here..."
              rows={6}
              className="mt-3 w-full bg-ink-light border border-ink-lighter rounded-lg px-4 py-3 text-cream placeholder-cream-dim/50 focus:outline-none focus:border-amber transition-colors resize-none font-serif leading-relaxed"
            />
          </details>

          {/* Audio upload */}
          <div>
            <label className="block text-cream-dim text-sm mb-2 font-medium">
              Audiobook (optional)
            </label>
            <button
              onClick={() => audioInputRef.current?.click()}
              className="w-full bg-ink-light border border-ink-lighter border-dashed rounded-lg px-4 py-6 text-cream-dim hover:border-amber/50 transition-colors cursor-pointer text-center"
            >
              {audioName ? (
                <span className="text-cream">{audioName}</span>
              ) : (
                <span>Click to upload .mp3, .m4a, or .wav</span>
              )}
            </button>
            <input
              ref={audioInputRef}
              type="file"
              accept=".mp3,.m4a,.wav,audio/*"
              onChange={handleAudioFile}
              className="hidden"
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!text.trim() || loading}
            className="w-full bg-amber hover:bg-amber-dim disabled:opacity-30 disabled:cursor-not-allowed text-ink font-semibold rounded-lg py-3 text-lg transition-colors cursor-pointer"
          >
            Open Book
          </button>
        </div>
      </div>
    </div>
  )
}
