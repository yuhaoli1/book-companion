const RATES = [0.75, 1, 1.25, 1.5, 2]

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({
  audioRef,
  audioUrl,
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  volume,
  onTogglePlay,
  onSeek,
  onChangeRate,
  onChangeVolume,
}) {
  if (!audioUrl) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-ink-light/95 backdrop-blur-md border-t border-ink-lighter z-40">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-amber/20 hover:bg-amber/30 text-amber transition-colors cursor-pointer shrink-0"
        >
          {isPlaying ? (
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

        {/* Time */}
        <span className="text-cream-dim text-sm tabular-nums w-12 text-right shrink-0">
          {formatTime(currentTime)}
        </span>

        {/* Scrub bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="flex-1 h-1 accent-amber cursor-pointer"
        />

        {/* Duration */}
        <span className="text-cream-dim text-sm tabular-nums w-12 shrink-0">
          {formatTime(duration)}
        </span>

        {/* Speed */}
        <div className="flex gap-1 shrink-0">
          {RATES.map(rate => (
            <button
              key={rate}
              onClick={() => onChangeRate(rate)}
              className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                playbackRate === rate
                  ? 'bg-amber text-ink font-semibold'
                  : 'text-cream-dim hover:text-cream'
              }`}
            >
              {rate}×
            </button>
          ))}
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" className="text-cream-dim">
            <path d="M2 5.5h2.5L8 2.5v11l-3.5-3H2a.5.5 0 01-.5-.5V6a.5.5 0 01.5-.5z" fill="currentColor" />
            {volume > 0.3 && <path d="M10 5.5s1.5 1 1.5 2.5-1.5 2.5-1.5 2.5" strokeWidth="1.5" strokeLinecap="round" />}
            {volume > 0.7 && <path d="M12 3.5s2 1.5 2 4.5-2 4.5-2 4.5" strokeWidth="1.5" strokeLinecap="round" />}
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="w-20 h-1 accent-amber cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
