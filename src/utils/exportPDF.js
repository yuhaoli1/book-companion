import jsPDF from 'jspdf'

export function downloadPDF(title, highlights, paragraphs) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const maxWidth = pageWidth - margin * 2
  let y = 30

  const checkPage = (needed = 20) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      y = 20
    }
  }

  // Title page
  doc.setFontSize(24)
  doc.text(title || 'Study Notes', pageWidth / 2, 60, { align: 'center' })

  doc.setFontSize(12)
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(`Exported: ${date}`, pageWidth / 2, 75, { align: 'center' })
  doc.text(`${highlights.length} highlight${highlights.length !== 1 ? 's' : ''}`, pageWidth / 2, 85, { align: 'center' })

  if (highlights.length === 0) {
    doc.save(`${title || 'study-notes'}.pdf`)
    return
  }

  doc.addPage()
  y = 20

  highlights.forEach((h, i) => {
    checkPage(40)
    const pIndex = paragraphs.findIndex(p => p.id === h.paragraphId)

    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text(`Highlight ${i + 1} — ¶ ${pIndex + 1}`, margin, y)
    y += 10

    doc.setFontSize(10)
    doc.setFont(undefined, 'italic')
    const quoteLines = doc.splitTextToSize(`"${h.selectedText}"`, maxWidth)
    checkPage(quoteLines.length * 5 + 10)
    doc.text(quoteLines, margin, y)
    y += quoteLines.length * 5 + 8

    if (h.aiExplanation) {
      checkPage(20)
      doc.setFont(undefined, 'bold')
      doc.setFontSize(11)
      doc.text('AI Explanation:', margin, y)
      y += 6
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      const expLines = doc.splitTextToSize(h.aiExplanation, maxWidth)
      checkPage(expLines.length * 5 + 5)
      doc.text(expLines, margin, y)
      y += expLines.length * 5 + 8
    }

    if (h.reflection) {
      checkPage(20)
      doc.setFont(undefined, 'bold')
      doc.setFontSize(11)
      doc.text('My Reflection:', margin, y)
      y += 6
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      const refLines = doc.splitTextToSize(h.reflection, maxWidth)
      checkPage(refLines.length * 5 + 5)
      doc.text(refLines, margin, y)
      y += refLines.length * 5 + 8
    }

    // Separator
    checkPage(10)
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 12
  })

  doc.save(`${title || 'study-notes'}.pdf`)
}
