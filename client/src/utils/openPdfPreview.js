export async function openPdfPreview(loadPdf, title = 'Invoice') {
  const preview = window.open('', '_blank')
  if (preview) {
    preview.document.title = title
    const message = preview.document.createElement('p')
    message.textContent = 'Preparing your invoice...'
    Object.assign(message.style, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      padding: '24px',
    })
    preview.document.body.replaceChildren(message)
  }
  try {
    const url = URL.createObjectURL(await loadPdf())
    if (preview) preview.location.replace(url)
    else window.location.assign(url)
    window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000)
  } catch (error) {
    preview?.close()
    throw error
  }
}
