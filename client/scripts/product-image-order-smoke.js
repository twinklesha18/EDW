import assert from 'node:assert/strict'
import { orderProductImages } from '../src/utils/productImageOrder.js'

const savedOne = { url: 'saved-one' }
const savedTwo = { url: 'saved-two' }
const uploadedOne = { url: 'uploaded-one' }
const uploadedTwo = { url: 'uploaded-two' }
const fileOne = { name: 'file-one' }
const fileTwo = { name: 'file-two' }

assert.deepEqual(
  orderProductImages({ savedImages: [savedOne, savedTwo], selectedImage: savedTwo }),
  [savedTwo, savedOne],
  'A selected saved image becomes the primary image',
)

assert.deepEqual(
  orderProductImages({ savedImages: [savedOne], uploadedImages: [uploadedOne], selectedFiles: [fileOne], selectedImage: fileOne }),
  [uploadedOne, savedOne],
  'A newly uploaded image can replace a saved image as the primary image',
)

assert.deepEqual(
  orderProductImages({ uploadedImages: [uploadedOne, uploadedTwo], selectedFiles: [fileOne, fileTwo], selectedImage: fileTwo }),
  [uploadedTwo, uploadedOne],
  'Any newly selected image can become the primary image',
)

assert.deepEqual(
  orderProductImages({ savedImages: [savedOne, savedTwo], selectedImage: null }),
  [savedOne, savedTwo],
  'The first image remains primary when no alternate selection exists',
)

console.log('Product image ordering smoke test passed: saved and newly uploaded images can be selected as the main image.')
