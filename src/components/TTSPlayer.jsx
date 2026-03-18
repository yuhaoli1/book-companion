import { useState } from 'react'

const RATES = [0.75, 1, 1.25, 1.5, 2]
const TTS_MODES = ['browser', 'openai', 'elevenlabs']
const MODE_LABELS = { browser: 'Browser', openai: 'OpenAI', elevenlabs: 'ElevenLabs' }

function sortVoices(voices) {
  const english = voices.filter(v => v.lang.startsWith('en'))
  const display = english.length > 0 ? english : voices
  return [...display].sort((a, b) => {
    const aScore = a.name.includes('Premium') ? 0 : a.name.includes('Enhanced') ? 1 : 2
    const bScore = b.name.includes('Premium') ? 0 : b.name.includes('Enhanced') ? 1 : 2
    if (aScore !== bScore) return aScore - bScore
    return a.name.localeCompare(b.name)
  })
}

function voiceLabel(name) {
  return name.replace(/Microsoft |Google |Apple /g, '')
}

export default function TTSPlayer({
  isSpeaking,
  rate,
  currentParagraphIndex,
  totalParagraphs,
  onTogglePlay,
  onChangeRate,
  loading,
  ttsMode,
  onCycleMode,
  // Browser TTS
  browserVoice,
  browserVoices,
  onSetBrowserVoice,
  // OpenAI TTS
  openaiVoice,
  openaiVoices,
  onSetOpenAIVoice,
  // ElevenLabs TTS
  elevenVoice,
  elevenVoices,
  onSetElevenVoice,
  onSearchElevenVoices,
}) {
  const [showTip, setShowTip] = useState(false)
  const [showVoiceSearch, setShowVoiceSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const sorted = sortVoices(browserVoices || [])
  const hasPremium = sorted.some(v => v.name.includes('Premium') || v.name.includes('Enhanced'))

  const handleSearch = async () => {
    if (!searchQuery.trim() || !onSearchElevenVoices) return
    setSearching(true)
    const results = await onSearchElevenVoices(searchQuery)
    setSearchResults(results || [])
    setSearching(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-ink-light/95 backdrop-blur-md border-t border-ink-lighter z-40">
      {/* Voice quality tip */}
      {showTip && (
        <div className="bg-ink-lighter border-b border-ink-lighter px-4 py-3 text-sm text-cream-dim">
          <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
            <div>
              <p className="text-cream font-medium mb-1">Get better voices for free</p>
              <p className="text-cream-dim/80 text-xs leading-relaxed">
                On Mac: <span className="text-cream">System Settings → Accessibility → Spoken Content → System Voice → Manage Voices</span>
                <br />Download voices marked "Premium" or "Enhanced" (e.g. Ava Premium, Zoe Premium). They'll appear in the voice selector automatically.
              </p>
            </div>
            <button onClick={() => setShowTip(false)} className="text-cream-dim/40 hover:text-cream text-sm cursor-pointer shrink-0">✕</button>
          </div>
        </div>
      )}

      {/* ElevenLabs voice search panel */}
      {showVoiceSearch && ttsMode === 'elevenlabs' && (
        <div className="bg-ink-lighter border-b border-ink-lighter px-4 py-3">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-cream text-sm font-medium">Search Voice Library</p>
              <button onClick={() => setShowVoiceSearch(false)} className="text-cream-dim/40 hover:text-cream text-sm cursor-pointer">✕</button>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for a voice (e.g. Ray Dalio, Morgan Freeman...)"
                className="flex-1 bg-ink border border-ink-lighter rounded-lg px-3 py-2 text-sm text-cream placeholder-cream-dim/40 focus:outline-none focus:border-amber"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 text-sm bg-amber text-ink rounded-lg cursor-pointer hover:bg-amber-dim disabled:opacity-30 transition-colors"
              >
                {searching ? '...' : 'Search'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {searchResults.map(v => (
                  <button
                    key={v.voice_id}
                    onClick={() => {
                      onSetElevenVoice(v)
                      setShowVoiceSearch(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors flex items-center justify-between ${
                      elevenVoice?.voice_id === v.voice_id
                        ? 'bg-amber/20 text-amber'
                        : 'text-cream hover:bg-ink-light'
                    }`}
                  >
                    <div>
                      <span className="font-medium">{v.name}</span>
                      {v.labels && (
                        <span className="ml-2 text-cream-dim/50 text-xs">
                          {Object.values(v.labels || {}).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                    {v.preview_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          new Audio(v.preview_url).play()
                        }}
                        className="text-cream-dim/50 hover:text-amber text-xs px-2 py-1 cursor-pointer"
                      >
                        Preview
                      </button>
                    )}
                  </button>
                ))}
              </div>
            )}
            {searchResults.length === 0 && !searching && searchQuery && (
              <p className="text-cream-dim/40 text-xs">No results. Try a different search term.</p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          disabled={loading}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-amber/20 hover:bg-amber/30 text-amber transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
          ) : isSpeaking ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2.5v11l10-5.5z" />
            </svg>
          )}
        </button>

        {/* Progress */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-cream-dim text-sm shrink-0">
            {currentParagraphIndex >= 0 ? `¶ ${currentParagraphIndex + 1}` : '—'}
          </span>
          <div className="flex-1 h-1 bg-ink-lighter rounded-full overflow-hidden">
            <div
              className="h-full bg-amber rounded-full transition-all duration-300"
              style={{
                width: currentParagraphIndex >= 0
                  ? `${((currentParagraphIndex + 1) / totalParagraphs) * 100}%`
                  : '0%'
              }}
            />
          </div>
          <span className="text-cream-dim/50 text-sm shrink-0">{totalParagraphs} ¶</span>
        </div>

        {/* Speed */}
        <div className="flex gap-1 shrink-0">
          {RATES.map(r => (
            <button
              key={r}
              onClick={() => onChangeRate(r)}
              className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                rate === r ? 'bg-amber text-ink font-semibold' : 'text-cream-dim hover:text-cream'
              }`}
            >
              {r}×
            </button>
          ))}
        </div>

        {/* Voice selector per mode */}
        {ttsMode === 'elevenlabs' ? (
          <div className="flex items-center gap-2 shrink-0">
            {elevenVoices.length > 0 && (
              <select
                value={elevenVoice?.voice_id || ''}
                onChange={(e) => {
                  const v = elevenVoices.find(vi => vi.voice_id === e.target.value)
                  if (v) onSetElevenVoice(v)
                }}
                className="bg-ink-lighter border border-ink-lighter rounded px-2 py-1 text-xs text-cream-dim cursor-pointer shrink-0 max-w-[130px]"
              >
                {elevenVoices.map(v => (
                  <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowVoiceSearch(!showVoiceSearch)}
              className="text-amber/60 hover:text-amber text-xs cursor-pointer shrink-0 transition-colors"
              title="Search voice library"
            >
              🔍
            </button>
          </div>
        ) : ttsMode === 'openai' ? (
          <select
            value={openaiVoice}
            onChange={(e) => onSetOpenAIVoice(e.target.value)}
            className="bg-ink-lighter border border-ink-lighter rounded px-2 py-1 text-xs text-cream-dim cursor-pointer shrink-0"
          >
            {(openaiVoices || []).map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        ) : sorted.length > 1 ? (
          <select
            value={browserVoice?.name || ''}
            onChange={(e) => {
              const v = (browserVoices || []).find(vi => vi.name === e.target.value)
              if (v) onSetBrowserVoice(v)
            }}
            className="bg-ink-lighter border border-ink-lighter rounded px-2 py-1 text-xs text-cream-dim cursor-pointer shrink-0 max-w-[160px]"
          >
            {sorted.map(v => (
              <option key={v.name} value={v.name}>{voiceLabel(v.name)}</option>
            ))}
          </select>
        ) : null}

        {/* Better voices hint */}
        {ttsMode === 'browser' && !hasPremium && (
          <button
            onClick={() => setShowTip(!showTip)}
            className="text-amber/60 hover:text-amber text-xs cursor-pointer shrink-0 transition-colors"
          >
            ✦ Better voices
          </button>
        )}

        {/* Engine cycle button */}
        <button
          onClick={onCycleMode}
          className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors shrink-0 ${
            ttsMode === 'openai'
              ? 'bg-green-800/50 text-green-300'
              : ttsMode === 'elevenlabs'
                ? 'bg-purple-800/50 text-purple-300'
                : 'bg-ink-lighter text-cream-dim/60 hover:text-cream-dim'
          }`}
          title={`Using ${MODE_LABELS[ttsMode]} TTS — click to switch`}
        >
          {MODE_LABELS[ttsMode]}
        </button>
      </div>
    </div>
  )
}
