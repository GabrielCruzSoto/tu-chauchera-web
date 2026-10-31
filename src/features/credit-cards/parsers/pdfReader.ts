import * as pdfjsLib from 'pdfjs-dist'

// Configure worker locally via Vite bundling to avoid CDN reliance and CSP restrictions
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
}

/**
 * Extracts raw plain text from an ArrayBuffer containing PDF bytes.
 * Reads page by page and concatenates text items with newline separation.
 */
export async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer })
  const pdfDoc = await loadingTask.promise
  let fullText = ''

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Join text items
    const pageLines: string[] = []
    let currentLine = ''
    let lastY: number | null = null

    for (const item of textContent.items) {
      if ('str' in item) {
        const textItem = item as { str: string; transform: number[] }
        const currentY = textItem.transform[5] ?? 0

        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
          if (currentLine.trim()) {
            pageLines.push(currentLine.trim())
          }
          currentLine = textItem.str
        } else {
          currentLine += ' ' + textItem.str
        }
        lastY = currentY
      }
    }

    if (currentLine.trim()) {
      pageLines.push(currentLine.trim())
    }

    fullText += pageLines.join('\n') + '\n'
  }

  return fullText
}
