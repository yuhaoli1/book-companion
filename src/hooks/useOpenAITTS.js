import { useState, useCallback, useRef, useEffect } from 'react'

const VOICES = ['alloy', 'ash', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer']

export { VOICES as OPENAI_VOICES }

export function useOpenAITTS(paragraphs) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(-1)
  const [rate, setRate] = useState(1)
  const [voice, setVoice] = useState('nova')
  const [loading, setLoading] = useState(false)
  const audioRef = useRef(new Audio())
  const queueIndexRef = useRef(-1)
  const cacheRef = useRef({}) // cache generated audio blobs

  // Cleanup on unmount
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio.pause()
      audio.src = ''
      // Revoke cached blob URLs
      Object.values(cacheRef.current).forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const generateAudio = useCallback(async (text, apiKey) => {
    const cacheKey = `${voice}:${text}`
    if (cacheRef.current[cacheKey]) return cacheRef.current[cacheKey]

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `OpenAI TTS error: ${response.status}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    cacheRef.current[cacheKey] = url
    return url
  }, [voice])

  const speakParagraph = useCallback(async (index, apiKey) => {
    if (!paragraphs[index] || !apiKey) return

    try {
      setLoading(true)
      setCurrentParagraphIndex(index)
      const audioUrl = await generateAudio(paragraphs[index].text, apiKey)
      setLoading(false)

      const audio = audioRef.current
      audio.src = audioUrl
      audio.playbackRate = rate

      audio.onended = () => {
        const nextIndex = index + 1
        if (nextIndex < paragraphs.length && queueIndexRef.current !== -2) {
          queueIndexRef.current = nextIndex
          speakParagraph(nextIndex, apiKey)
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
      console.error('OpenAI TTS failed:', err)
      setLoading(false)
      setIsSpeaking(false)
    }
  }, [paragraphs, rate, generateAudio])

  const play = useCallback((fromIndex = 0, apiKey) => {
    const startIdx = fromIndex >= 0 ? fromIndex : 0
    speakParagraph(startIdx, apiKey)
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

  const togglePlay = useCallback((apiKey) => {
    if (isSpeaking) {
      pause()
    } else if (audioRef.current.src && audioRef.current.paused && currentParagraphIndex >= 0) {
      resume()
    } else {
      play(currentParagraphIndex >= 0 ? currentParagraphIndex : 0, apiKey)
    }
  }, [isSpeaking, pause, resume, play, currentParagraphIndex])

  const seekToParagraph = useCallback((index, apiKey) => {
    stop()
    setTimeout(() => play(index, apiKey), 50)
  }, [stop, play])

  const changeRate = useCallback((newRate) => {
    setRate(newRate)
    audioRef.current.playbackRate = newRate
  }, [])

  // Clear cache when voice changes
  const changeVoice = useCallback((newVoice) => {
    stop()
    Object.values(cacheRef.current).forEach(url => URL.revokeObjectURL(url))
    cacheRef.current = {}
    setVoice(newVoice)
  }, [stop])

  return {
    isSpeaking,
    currentParagraphIndex,
    rate,
    voice,
    loading,
    voices: VOICES,
    togglePlay,
    seekToParagraph,
    changeRate,
    changeVoice,
    stop,
  }
}
