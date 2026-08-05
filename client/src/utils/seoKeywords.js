const uniqueKeywords = (keywords) => [...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))].join(', ')

export const SEO_KEYWORDS = Object.freeze({
  home: uniqueKeywords([
    'Eshaz Dream World',
    'custom gifts Batticaloa',
    'personalized gifts Batticaloa',
    'online gift shop Batticaloa',
    'gift delivery Batticaloa',
    'custom gifts Sri Lanka',
    'personalized gifts Sri Lanka',
    'handmade gifts Sri Lanka',
  ]),
  shop: uniqueKeywords([
    'buy gifts online Batticaloa',
    'order gifts online Batticaloa',
    'online gift delivery Batticaloa',
    'custom gift delivery Sri Lanka',
    'birthday gifts Batticaloa',
    'anniversary gifts Batticaloa',
    'gift hampers Batticaloa',
  ]),
  categories: uniqueKeywords([
    'custom bouquets Batticaloa',
    'personalized bouquets Batticaloa',
    'gift hampers Sri Lanka',
    'custom photo gifts Sri Lanka',
    'custom gift boxes Batticaloa',
    'birthday gift ideas Sri Lanka',
    'anniversary gift ideas Sri Lanka',
  ]),
  contact: uniqueKeywords([
    'gift shop Batticaloa',
    'gift delivery Batticaloa',
    'custom gift enquiries Batticaloa',
    'personalized gift delivery Sri Lanka',
    'Eshaz Dream World contact',
  ]),
})

export const categorySeoKeywords = (categoryName = 'Custom Gifts') => uniqueKeywords([
  `${categoryName} Batticaloa`,
  `${categoryName} Sri Lanka`,
  ...(categoryName.toLowerCase().startsWith('custom ') ? [] : [`custom ${categoryName} Batticaloa`]),
  ...(categoryName.toLowerCase().startsWith('personalized ') ? [] : [`personalized ${categoryName} Batticaloa`]),
  `${categoryName} delivery Sri Lanka`,
  'Eshaz Dream World',
])

export const productSeoKeywords = (productName, categoryName = 'Custom Gifts') => uniqueKeywords([
  productName,
  `${productName} Batticaloa`,
  `${categoryName} Batticaloa`,
  `${categoryName} Sri Lanka`,
  'custom gifts Batticaloa',
  'gift delivery Sri Lanka',
  'Eshaz Dream World',
])
