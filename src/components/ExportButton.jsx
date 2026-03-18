import { useState } from 'react'
import { downloadMarkdown } from '../utils/exportMarkdown'
import { downloadPDF } from '../utils/exportPDF'

export default function ExportButton({ title, highlights, paragraphs }) {
  const [showMenu, setShowMenu] = useState(false)

  if (highlights.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-4 py-2 text-sm text-cream-dim hover:text-cream bg-ink-lighter rounded-lg cursor-pointer transition-colors"
      >
        Export Notes
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 bg-ink-lighter border border-ink-lighter rounded-lg shadow-xl z-50 py-1 min-w-[160px]">
            <button
              onClick={() => {
                downloadMarkdown(title, highlights, paragraphs)
                setShowMenu(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-cream hover:bg-amber/10 cursor-pointer transition-colors"
            >
              📄 Markdown (.md)
            </button>
            <button
              onClick={() => {
                downloadPDF(title, highlights, paragraphs)
                setShowMenu(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-cream hover:bg-amber/10 cursor-pointer transition-colors"
            >
              📑 PDF (.pdf)
            </button>
          </div>
        </>
      )}
    </div>
  )
}
