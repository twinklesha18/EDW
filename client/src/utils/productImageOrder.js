export function orderProductImages({ savedImages = [], uploadedImages = [], selectedFiles = [], selectedImage = null }) {
  const combinedImages = [...savedImages, ...uploadedImages].slice(0, 3)
  const savedMainIndex = savedImages.indexOf(selectedImage)
  const fileMainIndex = selectedFiles.indexOf(selectedImage)
  const mainIndex = savedMainIndex >= 0
    ? savedMainIndex
    : fileMainIndex >= 0
      ? savedImages.length + fileMainIndex
      : 0

  if (mainIndex <= 0 || mainIndex >= combinedImages.length) return combinedImages
  return [combinedImages[mainIndex], ...combinedImages.filter((_, index) => index !== mainIndex)]
}
