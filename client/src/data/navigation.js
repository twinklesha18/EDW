export const primaryNavigation = Object.freeze([
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Categories', to: '/categories' },
  { label: 'Custom Orders', to: '/custom-orders' },
  { label: 'Contact', to: '/contact' },
])

export const footerGroups = Object.freeze([
  {
    title: 'Quick Links',
    links: [
      { label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' },
      { label: 'Contact', to: '/contact' },
      { label: 'Custom Orders', to: '/custom-orders' },
    ],
  },
  {
    title: 'Collections',
    links: [
      { label: 'Gift Collections', to: '/categories' },
      { label: 'All Products', to: '/shop' },
    ],
  },
])
