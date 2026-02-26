import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { isMennaName } from '../utils/mennaNames'

interface IntroPopupProps {
  isOpen: boolean
  onClose: () => void
  onMennaDetected: (name: string) => void
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 400 },
  },
  exit: { opacity: 0, scale: 0.95, y: 10 },
}

export default function IntroPopup({ isOpen, onClose, onMennaDetected }: IntroPopupProps) {
  const [name, setName] = useState('')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = name.trim()
      if (!trimmed) return
      if (isMennaName(trimmed)) {
        onMennaDetected(trimmed)
      } else {
        onClose()
      }
    },
    [name, onClose, onMennaDetected]
  )

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="intro-popup"
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-heading"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={handleKeyDown}
        >
          <motion.div
            className="absolute inset-0 bg-black/50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
          />
          <motion.div
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2 id="intro-heading" className="text-2xl font-bold text-center text-rose-700 mb-6">
              نتعرف بيك 👋
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="intro-name" className="block text-sm font-medium text-gray-700 mb-2">
                  اسمك...؟
                </label>
                <input
                  id="intro-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اكتب اسمك 🔫"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition"
                  autoFocus
                  autoComplete="name"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 focus:ring-2 focus:ring-rose-300 transition"
              >
                تمام
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
