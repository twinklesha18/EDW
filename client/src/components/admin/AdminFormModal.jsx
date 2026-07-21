import { AnimatePresence, motion } from 'framer-motion'
import { FiX } from 'react-icons/fi'

function AdminFormModal({ open, title, onClose, children, maxWidth = 'max-w-2xl' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/30 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 30 }}
            animate={{ y: 0 }}
            exit={{ y: 30 }}
            className={`safe-area-bottom max-h-[94dvh] w-full ${maxWidth} overflow-y-auto overscroll-contain rounded-t-[1.5rem] bg-white p-4 shadow-2xl sm:max-h-[92vh] sm:rounded-[2rem] sm:p-8`}
          >
            <header className="flex min-w-0 items-center justify-between gap-3">
              <h2 className="min-w-0 break-words font-serif text-2xl font-semibold sm:text-3xl">{title}</h2>
              <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
                <FiX />
              </button>
            </header>
            <div className="mt-5 sm:mt-6">{children}</div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AdminFormModal
