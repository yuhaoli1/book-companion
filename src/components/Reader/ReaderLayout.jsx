import { useRef, useCallback, useEffect, useState } from 'react'
import BookPane from './BookPane'
import Sidebar from '../Sidebar/Sidebar'
import AudioPlayer from '../AudioPlayer'
import TTSPlayer from '../TTSPlayer'
import ExportButton from '../ExportButton'
import { useAudioSync } from '../../hooks/useAudioSync'
import { useTTS } from '../../hooks/useTTS'
import { useOpenAITTS } from '../../hooks/useOpenAITTS'
import { useElevenLabsTTS } from '../../hooks/useElevenLabsTTS'
import { useHighlights } from '../../hooks/useHighlights'
import { useClaudeStream } from '../../hooks/useClaudeStream'
import { useReadingProgress, useSupabaseHighlights } from '../../hooks/useSupabaseData'

const STORAGE_KEY = 'book-companion-state'
const API_KEY_KEY = 'book-companion-apikey'
const OPENAI_KEY_KEY = 'book-companion-openai-key'

// ElevenLabs goes through proxy — no user API key needed
const HAS_PROXY = !!import.meta.env.VITE_TTS_PROXY_URL

const TTS_MODES = HAS_PROXY ? ['browser', 'elevenlabs', 'openai'] : ['browser', 'openai']

export default function ReaderLayout({ book, onReset, user, onSignOut }) {
  const [paragraphs, setParagraphs] = useState(book.paragraphs)
  const [syncModeActive, setSyncModeActive] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeHighlightId, setActiveHighlightId] = useState(null)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_KEY) || '')
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem(OPENAI_KEY_KEY) || '')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [ttsMode, setTtsMode] = useState(() => {
    if (HAS_PROXY) return 'elevenlabs'
    if (localStorage.getItem(OPENAI_KEY_KEY)) return 'openai'
    return 'browser'
  })
  const hoveredParagraphRef = useRef(0)

  const { highlights, setHighlights, addHighlight, updateHighlight, deleteHighlight } = useHighlights()
  const { loading: aiLoading, streamedText, error: aiError, explain, setStreamedText, setError: setAiError } = useClaudeStream()

  const hasAudioFile = !!book.audioUrl
  const audio = useAudioSync(paragraphs)
  const browserTTS = useTTS(paragraphs)
  const openaiTTS = useOpenAITTS(paragraphs)
  const elevenTTS = useElevenLabsTTS(paragraphs)

  // Active TTS engine
  const activeTTS = ttsMode === 'elevenlabs' ? elevenTTS : ttsMode === 'openai' ? openaiTTS : browserTTS

  // Supabase reading progress & highlights
  const { progress, fetchProgress, updateProgress } = useReadingProgress(user?.id, book.id)
  const { saveHighlight: saveHighlightToDb, removeHighlight: removeHighlightFromDb } = useSupabaseHighlights(user?.id, book.id)
  const readingStartRef = useRef(Date.now())
  const maxParagraphRef = useRef(0)

  // Unified current paragraph index
  const currentParagraphIndex = hasAudioFile ? audio.currentParagraphIndex : activeTTS.currentParagraphIndex

  // Track max paragraph reached
  useEffect(() => {
    if (currentParagraphIndex > maxParagraphRef.current) {
      maxParagraphRef.current = currentParagraphIndex
    }
  }, [currentParagraphIndex])

  // Load reading progress on mount
  useEffect(() => {
    if (user && book.id) fetchProgress()
  }, [user, book.id, fetchProgress])

  // Save reading progress periodically (every 30s) and on unmount
  useEffect(() => {
    if (!user || !book.id) return
    const interval = setInterval(() => {
      const elapsed = Math.round((Date.now() - readingStartRef.current) / 1000)
      const totalTime = (progress?.totalReadingTimeSeconds || 0) + elapsed
      updateProgress(maxParagraphRef.current, totalTime)
      readingStartRef.current = Date.now()
    }, 30000)
    return () => {
      clearInterval(interval)
      const elapsed = Math.round((Date.now() - readingStartRef.current) / 1000)
      const totalTime = (progress?.totalReadingTimeSeconds || 0) + elapsed
      updateProgress(maxParagraphRef.current, totalTime)
    }
  }, [user, book.id, progress?.totalReadingTimeSeconds, updateProgress])

  // Fetch ElevenLabs voices on mount when proxy is available
  useEffect(() => {
    if (HAS_PROXY && ttsMode === 'elevenlabs') {
      elevenTTS.fetchVoices()
    }
  }, [ttsMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const state = JSON.parse(saved)
        if (state.bookTitle === book.title) {
          if (state.paragraphs) setParagraphs(state.paragraphs)
          if (state.highlights) setHighlights(state.highlights)
        }
      }
    } catch {}
  }, [book.title, setHighlights])

  // Save state
  useEffect(() => {
    const state = { bookTitle: book.title, paragraphs, highlights }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [book.title, paragraphs, highlights])

  // Save API keys
  useEffect(() => { if (apiKey) localStorage.setItem(API_KEY_KEY, apiKey) }, [apiKey])
  useEffect(() => { if (openaiKey) localStorage.setItem(OPENAI_KEY_KEY, openaiKey) }, [openaiKey])

  // Sync mode: press S to stamp timestamp
  useEffect(() => {
    if (!syncModeActive) return
    const handler = (e) => {
      if (e.key === 's' || e.key === 'S') {
        const idx = hoveredParagraphRef.current
        setParagraphs(prev => prev.map((p, i) =>
          i === idx ? { ...p, timestamp: audio.currentTime } : p
        ))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [syncModeActive, audio.currentTime])

  const handleParagraphClick = useCallback((index) => {
    if (syncModeActive) return
    if (hasAudioFile) {
      audio.seekToParagraph(index)
    } else if (ttsMode === 'elevenlabs') {
      elevenTTS.seekToParagraph(index)
    } else if (ttsMode === 'openai') {
      openaiTTS.seekToParagraph(index, openaiKey)
    } else {
      browserTTS.seekToParagraph(index)
    }
  }, [syncModeActive, hasAudioFile, audio, ttsMode, elevenTTS, openaiTTS, browserTTS, openaiKey])

  const handleAddHighlight = useCallback((paragraphId, text, startOffset, endOffset) => {
    const h = addHighlight(paragraphId, text, startOffset, endOffset)
    if (h && user) saveHighlightToDb(h)
    setSidebarOpen(true)
    return h
  }, [addHighlight, user, saveHighlightToDb])

  const requireApiKey = useCallback((action) => {
    if (!apiKey) {
      setPendingAction(() => action)
      setShowApiKeyModal(true)
      return false
    }
    return true
  }, [apiKey])

  const handleExplainHighlight = useCallback((highlight) => {
    const doExplain = async () => {
      if (!requireApiKey(() => handleExplainHighlight(highlight))) return
      setActiveHighlightId(highlight.id)
      setSidebarOpen(true)
      await explain(highlight.selectedText, apiKey)
    }
    doExplain()
  }, [apiKey, explain, requireApiKey])

  const handleReflectHighlight = useCallback((highlight) => {
    setActiveHighlightId(highlight.id)
    setSidebarOpen(true)
  }, [])

  const handleSaveExplanation = useCallback((text) => {
    if (activeHighlightId) {
      const updated = updateHighlight(activeHighlightId, { aiExplanation: text })
      if (user && updated) saveHighlightToDb(updated)
      setActiveHighlightId(null)
      setStreamedText('')
    }
  }, [activeHighlightId, updateHighlight, setStreamedText, user, saveHighlightToDb])

  const handleCloseAI = useCallback(() => {
    setActiveHighlightId(null)
    setStreamedText('')
    setAiError(null)
  }, [setStreamedText, setAiError])

  const handleUpdateReflection = useCallback((id, reflection) => {
    const updated = updateHighlight(id, { reflection })
    if (user && updated) saveHighlightToDb(updated)
  }, [updateHighlight, user, saveHighlightToDb])

  const handleScrollToParagraph = useCallback((index) => {
    const el = document.querySelector(`[data-index="${index}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const handleSaveApiKey = (keys) => {
    setApiKey(keys.anthropic)
    setOpenaiKey(keys.openai)
    setShowApiKeyModal(false)
    if (keys.openai) setTtsMode('openai')
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  const handleCycleTTSMode = useCallback(() => {
    activeTTS.stop()
    const currentIdx = TTS_MODES.indexOf(ttsMode)
    const nextMode = TTS_MODES[(currentIdx + 1) % TTS_MODES.length]

    if (nextMode === 'openai' && !openaiKey) {
      // Skip OpenAI if no key — go to next
      const afterIdx = TTS_MODES.indexOf(nextMode)
      setTtsMode(TTS_MODES[(afterIdx + 1) % TTS_MODES.length])
      return
    }
    setTtsMode(nextMode)
  }, [ttsMode, activeTTS, openaiKey])

  const handleTTSTogglePlay = useCallback(() => {
    if (ttsMode === 'elevenlabs') {
      elevenTTS.togglePlay()
    } else if (ttsMode === 'openai') {
      if (!openaiKey) { setShowApiKeyModal(true); return }
      openaiTTS.togglePlay(openaiKey)
    } else {
      browserTTS.togglePlay()
    }
  }, [ttsMode, openaiKey, elevenTTS, openaiTTS, browserTTS])

  const handleSearchElevenVoices = useCallback(async (query) => {
    return elevenTTS.searchVoiceLibrary(query)
  }, [elevenTTS])

  const activeHighlight = highlights.find(h => h.id === activeHighlightId)

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-ink-lighter bg-ink/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onReset}
            className="text-cream-dim/50 hover:text-cream text-sm cursor-pointer transition-colors"
          >
            ← Library
          </button>
          <h2 className="text-cream font-serif text-lg truncate">{book.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {hasAudioFile && (
            <button
              onClick={() => setSyncModeActive(!syncModeActive)}
              className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                syncModeActive
                  ? 'bg-teal text-cream'
                  : 'text-cream-dim hover:text-cream bg-ink-lighter'
              }`}
            >
              {syncModeActive ? '● Sync Mode' : 'Sync Mode'}
            </button>
          )}
          {user && (
            <span className="text-cream-dim/50 text-xs hidden md:inline">
              {user.user_metadata?.display_name || user.email}
            </span>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="text-cream-dim/50 hover:text-cream text-xs cursor-pointer transition-colors"
            >
              Sign out
            </button>
          )}
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="text-cream-dim/50 hover:text-cream text-sm cursor-pointer transition-colors"
            title="API Key Settings"
          >
            ⚙️
          </button>
          <ExportButton title={book.title} highlights={highlights} paragraphs={paragraphs} />
        </div>
      </header>

      {syncModeActive && (
        <div className="bg-teal/10 border-b border-teal/30 px-4 py-2 text-sm text-teal-light text-center shrink-0">
          Sync Mode: Hover over a paragraph and press <kbd className="bg-teal/20 px-1.5 py-0.5 rounded text-xs font-mono">S</kbd> to stamp the current audio time.
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <BookPane
          paragraphs={paragraphs}
          currentParagraphIndex={currentParagraphIndex}
          highlights={highlights}
          syncModeActive={syncModeActive}
          hoveredParagraphRef={hoveredParagraphRef}
          onParagraphClick={handleParagraphClick}
          onAddHighlight={handleAddHighlight}
          onExplainHighlight={handleExplainHighlight}
          onReflectHighlight={handleReflectHighlight}
        />
        <Sidebar
          highlights={highlights}
          paragraphs={paragraphs}
          activeHighlight={activeHighlight}
          streamedText={streamedText}
          aiLoading={aiLoading}
          aiError={aiError}
          onDeleteHighlight={(id) => { deleteHighlight(id); if (user) removeHighlightFromDb(id) }}
          onScrollToParagraph={handleScrollToParagraph}
          onExplainHighlight={handleExplainHighlight}
          onSaveExplanation={handleSaveExplanation}
          onCloseAI={handleCloseAI}
          onUpdateReflection={handleUpdateReflection}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Audio player — file-based or TTS */}
      {hasAudioFile ? (
        <AudioPlayer
          audioRef={audio.audioRef}
          audioUrl={book.audioUrl}
          currentTime={audio.currentTime}
          duration={audio.duration}
          isPlaying={audio.isPlaying}
          playbackRate={audio.playbackRate}
          volume={audio.volume}
          onTogglePlay={audio.togglePlay}
          onSeek={audio.seek}
          onChangeRate={audio.changeRate}
          onChangeVolume={audio.changeVolume}
        />
      ) : (
        <TTSPlayer
          isSpeaking={activeTTS.isSpeaking}
          rate={activeTTS.rate}
          currentParagraphIndex={activeTTS.currentParagraphIndex}
          totalParagraphs={paragraphs.length}
          onTogglePlay={handleTTSTogglePlay}
          onChangeRate={activeTTS.changeRate}
          loading={ttsMode !== 'browser' ? activeTTS.loading : false}
          ttsMode={ttsMode}
          onCycleMode={handleCycleTTSMode}
          browserVoice={browserTTS.voice}
          browserVoices={browserTTS.voices}
          onSetBrowserVoice={browserTTS.setVoice}
          openaiVoice={openaiTTS.voice}
          openaiVoices={openaiTTS.voices}
          onSetOpenAIVoice={openaiTTS.changeVoice}
          elevenVoice={elevenTTS.voice}
          elevenVoices={elevenTTS.voices}
          onSetElevenVoice={elevenTTS.changeVoice}
          onSearchElevenVoices={handleSearchElevenVoices}
        />
      )}

      {/* API Key Modal — only for Anthropic + OpenAI now */}
      {showApiKeyModal && (
        <ApiKeyModal
          apiKey={apiKey}
          openaiKey={openaiKey}
          onSave={handleSaveApiKey}
          onClose={() => { setShowApiKeyModal(false); setPendingAction(null) }}
        />
      )}
    </div>
  )
}

function ApiKeyModal({ apiKey: initAnthropic, openaiKey: initOpenai, onSave, onClose }) {
  const [anthropic, setAnthropic] = useState(initAnthropic)
  const [openai, setOpenai] = useState(initOpenai)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-ink-light border border-ink-lighter rounded-xl p-6 w-full max-w-md space-y-5">
        <h3 className="text-cream font-semibold">API Keys</h3>
        <p className="text-cream-dim text-sm">
          Keys are stored locally and only sent to their respective APIs.
        </p>

        <div>
          <label className="block text-cream-dim text-xs mb-1.5 font-medium">
            Anthropic API Key <span className="text-cream-dim/40">(for AI explanations)</span>
          </label>
          <input
            type="password"
            value={anthropic}
            onChange={(e) => setAnthropic(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-ink border border-ink-lighter rounded-lg px-4 py-2.5 text-cream text-sm placeholder-cream-dim/40 focus:outline-none focus:border-amber"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-cream-dim text-xs mb-1.5 font-medium">
            OpenAI API Key <span className="text-cream-dim/40">(optional — for OpenAI TTS voices)</span>
          </label>
          <input
            type="password"
            value={openai}
            onChange={(e) => setOpenai(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-ink border border-ink-lighter rounded-lg px-4 py-2.5 text-cream text-sm placeholder-cream-dim/40 focus:outline-none focus:border-amber"
          />
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-cream-dim cursor-pointer hover:text-cream transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ anthropic, openai })}
            className="px-4 py-2 text-sm bg-amber text-ink rounded-lg cursor-pointer hover:bg-amber-dim transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
