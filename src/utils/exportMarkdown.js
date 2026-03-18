export function exportMarkdown(title, highlights, paragraphs) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let md = `# Study Notes: ${title}\n_Exported: ${date}_\n\n---\n`

  highlights.forEach((h, i) => {
    const pIndex = paragraphs.findIndex(p => p.id === h.paragraphId)
    md += `\n## Highlight ${i + 1} — ¶ ${pIndex + 1}\n`
    md += `> "${h.selectedText}"\n`

    if (h.aiExplanation) {
      md += `\n**AI Explanation:**\n${h.aiExplanation}\n`
    }
    if (h.reflection) {
      md += `\n**My Reflection:**\n${h.reflection}\n`
    }
    md += `\n---\n`
  })

  return md
}

export function downloadMarkdown(title, highlights, paragraphs) {
  const md = exportMarkdown(title, highlights, paragraphs)
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title || 'study-notes'}.md`
  a.click()
  URL.revokeObjectURL(url)
}
