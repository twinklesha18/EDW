export async function openPdfPreview(loadPdf, title = 'Invoice') {
  const preview = window.open('', '_blank')
  if (preview) {
    preview.document.title = title
    preview.document.body.innerHTML = '<p style="font:16px Arial;padding:24px">Preparing your invoice...</p>'
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
