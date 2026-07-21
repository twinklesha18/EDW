import { useEffect, useState } from 'react'
import { FiArrowUp } from 'react-icons/fi'

function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-gold/30 bg-white text-ink shadow-luxury transition-transform hover:-translate-y-1 sm:right-6"
      aria-label="Back to top"
    >
      <FiArrowUp aria-hidden="true" />
    </button>
  )
}

export default BackToTop
