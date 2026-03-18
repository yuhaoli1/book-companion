import { useState, useCallback, useRef, useEffect } from 'react'

export function useTTS(paragraphs) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(-1)
  const [rate, setRate] = useState(1)
  const [voice, setVoice] = useState(null)
  const [voices, setVoices] = useState([])
  const utteranceRef = useRef(null)
  const queueIndexRef = useRef(-1)

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices()
      setVoices(v)
      if (!voice && v.length > 0) {
        // Prefer Premium/Enhanced voices (downloaded via macOS System Settings)
        const english = v.filter(vi => vi.lang.startsWith('en'))
        const premium = english.find(vi => vi.name.includes('Premium'))
        const enhanced = english.find(vi => vi.name.includes('Enhanced'))
        const preferred = ['Samantha', 'Karen', 'Daniel', 'Fiona', 'Moira', 'Tessa', 'Alex']
        const fallback = preferred.reduce((found, name) =>
          found || english.find(vi => vi.name.includes(name)), null
        )
        const best = premium || enhanced || fallback
          || english.find(vi => vi.localService)
          || english[0]
          || v[0]
        setVoice(best)
      }
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [voice])

  const speakParagraph = useCallback((index) => {
    if (!paragraphs[index]) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(paragraphs[index].text)
    utterance.rate = rate
    if (voice) utterance.voice = voice

    utterance.onstart = () => {
      setIsSpeaking(true)
      setCurrentParagraphIndex(index)
    }

    utterance.onend = () => {
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

    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        setIsSpeaking(false)
        setCurrentParagraphIndex(-1)
      }
    }

    utteranceRef.current = utterance
    queueIndexRef.current = index
    window.speechSynthesis.speak(utterance)
  }, [paragraphs, rate, voice])

  const play = useCallback((fromIndex = 0) => {
    const startIdx = fromIndex >= 0 ? fromIndex : 0
    speakParagraph(startIdx)
  }, [speakParagraph])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    setIsSpeaking(false)
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis.resume()
    setIsSpeaking(true)
  }, [])

  const stop = useCallback(() => {
    queueIndexRef.current = -2 // signal to stop chain
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setCurrentParagraphIndex(-1)
    queueIndexRef.current = -1
  }, [])

  const togglePlay = useCallback(() => {
    if (isSpeaking) {
      pause()
    } else if (window.speechSynthesis.paused) {
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
    // If currently speaking, restart at current paragraph with new rate
    if (isSpeaking && currentParagraphIndex >= 0) {
      const idx = currentParagraphIndex
      stop()
      setTimeout(() => {
        // rate state will be updated by next render, but we need it now
        // so we restart and the next speakParagraph call will use the new rate
        play(idx)
      }, 50)
    }
  }, [isSpeaking, currentParagraphIndex, stop, play])

  // Cleanup on unmount
  useEffect(() => {
    return () => window.speechSynthesis.cancel()
  }, [])

  return {
    isSpeaking,
    currentParagraphIndex,
    rate,
    voice,
    voices,
    togglePlay,
    seekToParagraph,
    changeRate,
    setVoice,
    stop,
  }
}
