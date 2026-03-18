import { useState, useCallback, useRef, useEffect } from 'react'

// Point this to your deployed Cloudflare Worker URL
// In dev, you can use wrangler dev (default: http://localhost:8787)
const PROXY_URL = import.meta.env.VITE_TTS_PROXY_URL || ''

export function useElevenLabsTTS(paragraphs) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(-1)
  const [rate, setRate] = useState(1)
  const [voice, setVoice] = useState(null)
  const [voices, setVoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const audioRef = useRef(new Audio())
  const queueIndexRef = useRef(-1)
  const cacheRef = useRef({})

  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio.pause()
      audio.src = ''
      Object.values(cacheRef.current).forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const proxyFetch = useCallback((path, options = {}) => {
    if (!PROXY_URL) {
      setError('TTS proxy not configured. Set VITE_TTS_PROXY_URL in your .env file.')
      return Promise.reject(new Error('Proxy not configured'))
    }
    return fetch(`${PROXY_URL}${path}`, options)
  }, [])

  const fetchVoices = useCallback(async () => {
    try {
      setError(null)
      const response = await proxyFetch('/voices')
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      const data = await response.json()
      setVoices(data.voices || [])
      if (!voice && data.voices?.length > 0) {
        setVoice(data.voices[0])
      }
    } catch (err) {
      console.error('Failed to fetch voices:', err)
      setError(err.message)
    }
  }, [voice, proxyFetch])

  const searchVoiceLibrary = useCallback(async (query) => {
    if (!query.trim()) return []
    try {
      const response = await proxyFetch(`/voices/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error(`Search error: ${response.status}`)
      const data = await response.json()
      return data.voices || []
    } catch (err) {
      console.error('Voice library search failed:', err)
      return []
    }
  }, [proxyFetch])

  const generateAudio = useCallback(async (text) => {
    if (!voice) return null
    const cacheKey = `${voice.voice_id}:${text}`
    if (cacheRef.current[cacheKey]) return cacheRef.current[cacheKey]

    const response = await proxyFetch(`/tts/${voice.voice_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `TTS error: ${response.status}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    cacheRef.current[cacheKey] = url
    return url
  }, [voice, proxyFetch])

  const speakParagraph = useCallback(async (index) => {
    if (!paragraphs[index] || !voice) return

    try {
      setLoading(true)
      setError(null)
      setCurrentParagraphIndex(index)
      const audioUrl = await generateAudio(paragraphs[index].text)
      if (!audioUrl) return
      setLoading(false)

      const audio = audioRef.current
      audio.src = audioUrl
      audio.playbackRate = rate

      audio.onended = () => {
        const nextIndex = index + 1
        if (nextIndex < paragraphs.length && queueIndexRef.current !== -2) {
          queueIndexRef.current = nextIndex
          speakParagraph(nextIndex)
        } else {
          setIsSpeaking(false)
          setCurrentParagraphIndex(-1)
          queueIndexRef.current = -1
        }
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        setLoading(false)
      }

      queueIndexRef.current = index
      setIsSpeaking(true)
      await audio.play()
    } catch (err) {
      console.error('ElevenLabs TTS failed:', err)
      setError(err.message)
      setLoading(false)
      setIsSpeaking(false)
    }
  }, [paragraphs, rate, voice, generateAudio])

  const play = useCallback((fromIndex = 0) => {
    speakParagraph(fromIndex >= 0 ? fromIndex : 0)
  }, [speakParagraph])

  const pause = useCallback(() => {
    audioRef.current.pause()
    setIsSpeaking(false)
  }, [])

  const resume = useCallback(() => {
    audioRef.current.play()
    setIsSpeaking(true)
  }, [])

  const stop = useCallback(() => {
    queueIndexRef.current = -2
    audioRef.current.pause()
    audioRef.current.src = ''
    setIsSpeaking(false)
    setCurrentParagraphIndex(-1)
    setLoading(false)
    queueIndexRef.current = -1
  }, [])

  const togglePlay = useCallback(() => {
    if (isSpeaking) {
      pause()
    } else if (audioRef.current.src && audioRef.current.paused && currentParagraphIndex >= 0) {
      resume()
    } else {
      play(currentParagraphIndex >= 0 ? currentParagraphIndex : 0)
    }
  }, [isSpeaking, pause, resume, play, currentParagraphIndex])

  const seekToParagraph = useCallback((index) => {
    stop()
    setTimeout(() => play(index), 50)
  }, [stop, play])

  const changeRate = useCallback((newRate) => {
    setRate(newRate)
    audioRef.current.playbackRate = newRate
  }, [])

  const changeVoice = useCallback((v) => {
    stop()
    Object.values(cacheRef.current).forEach(url => URL.revokeObjectURL(url))
    cacheRef.current = {}
    setVoice(v)
  }, [stop])

  return {
    isSpeaking,
    currentParagraphIndex,
    rate,
    voice,
    voices,
    loading,
    error,
    togglePlay,
    seekToParagraph,
    changeRate,
    changeVoice,
    fetchVoices,
    searchVoiceLibrary,
    stop,
  }
}
