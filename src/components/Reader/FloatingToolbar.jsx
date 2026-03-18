import { useEffect, useRef } from 'react'

export default function FloatingToolbar({ position, onExplain, onReflect }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && position) {
      const toolbar = ref.current
      const rect = toolbar.getBoundingClientRect()
      // Ensure toolbar stays within viewport
      if (rect.right > window.innerWidth) {
        toolbar.style.left = `${window.innerWidth - rect.width - 10}px`
      }
    }
  }, [position])

  if (!position) return null

  return (
    <div
      ref={ref}
      className="fixed z-50 flex gap-1 bg-ink-lighter border border-ink-lighter rounded-lg shadow-xl p-1 animate-in fade-in"
      style={{
        left: position.x,
        top: position.y - 48,
      }}
    >
      <button
        onClick={onExplain}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-cream hover:bg-amber/20 hover:text-amber transition-colors cursor-pointer"
        title="Get AI explanation"
      >
        <span>💡</span> Explain
      </button>
      <button
        onClick={onReflect}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-cream hover:bg-teal/20 hover:text-teal-light transition-colors cursor-pointer"
        title="Add reflection"
      >
        <span>📝</span> Reflect
      </button>
    </div>
  )
}
