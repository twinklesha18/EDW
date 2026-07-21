export const primaryNavigation = Object.freeze([
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Categories', to: '/categories' },
  { label: 'Custom Orders', to: '/custom-orders' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
])

export const footerGroups = Object.freeze([
  {
    title: 'Quick Links',
    links: [
      { label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' },
      { label: 'About', to: '/about' }, { label: 'Contact', to: '/contact' },
      { label: 'Custom Orders', to: '/custom-orders' },
    ],
  },
  {
    title: 'Collections',
    links: [
      { label: 'Bouquets', to: '/shop?category=chocolate-bouquets' },
      { label: 'Gift Collections', to: '/categories' },
      { label: 'Photo Frames', to: '/shop?category=photo-frames' },
      { label: 'Greeting Cards', to: '/shop?category=greeting-cards' },
      { label: 'Custom Designs', to: '/custom-orders' },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'FAQ', to: '/faq' }, { label: 'Shipping Information', to: '/shipping' },
      { label: 'Track Order', to: '/track-order' },
      { label: 'Return Policy', to: '/returns' }, { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms & Conditions', to: '/terms' },
    ],
  },
])
