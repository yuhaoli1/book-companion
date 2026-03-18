import { useState, useRef, useCallback, useEffect } from 'react'

export function useAudioSync(paragraphs) {
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(-1)

  const updateCurrentParagraph = useCallback((time) => {
    if (!paragraphs || paragraphs.length === 0) return

    // Find the last paragraph whose timestamp <= current time
    const hasTimestamps = paragraphs.some(p => p.timestamp !== null)

    if (hasTimestamps) {
      let idx = -1
      for (let i = 0; i < paragraphs.length; i++) {
        if (paragraphs[i].timestamp !== null && paragraphs[i].timestamp <= time) {
          idx = i
        }
      }
      setCurrentParagraphIndex(idx)
    } else if (duration > 0) {
      // Proportional fallback
      const progress = time / duration
      const idx = Math.min(
        Math.floor(progress * paragraphs.length),
        paragraphs.length - 1
      )
      setCurrentParagraphIndex(idx)
    }
  }, [paragraphs, duration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      updateCurrentParagraph(audio.currentTime)
    }
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [updateCurrentParagraph])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play()
    else audio.pause()
  }, [])

  const seek = useCallback((time) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
    updateCurrentParagraph(time)
  }, [updateCurrentParagraph])

  const changeRate = useCallback((rate) => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = rate
    setPlaybackRate(rate)
  }, [])

  const changeVolume = useCallback((vol) => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = vol
    setVolume(vol)
  }, [])

  const seekToParagraph = useCallback((index) => {
    if (!paragraphs || !paragraphs[index]) return
    const ts = paragraphs[index].timestamp
    if (ts !== null) {
      seek(ts)
    } else if (duration > 0) {
      seek((index / paragraphs.length) * duration)
    }
  }, [paragraphs, duration, seek])

  return {
    audioRef,
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    volume,
    currentParagraphIndex,
    togglePlay,
    seek,
    changeRate,
    changeVolume,
    seekToParagraph,
  }
}
