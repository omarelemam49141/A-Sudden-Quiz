import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface MennaVerificationPopupProps {
  isOpen: boolean
  onClose: () => void
  onVerified?: () => void
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

const REACTION_OPTIONS = [
  { id: 'a', text: 'يا ستار يارب!' },
  { id: 'b', text: 'اللهم أجرنا فى مصيبتنا' },
  { id: 'c', text: '💀' },
]

const CORRECT_SCORE = 27
const CORRECT_TOTAL = 30

function isCorrectExamAnswer(score: string, total: string): boolean {
  const s = score.trim()
  const t = total.trim()
  if (s === '' || t === '') return false
  return Number(s) === CORRECT_SCORE && Number(t) === CORRECT_TOTAL
}

export default function MennaVerificationPopup({ isOpen, onClose, onVerified }: MennaVerificationPopupProps) {
  const [step, setStep] = useState<1 | 2 | 'success'>(1)
  const [examScore, setExamScore] = useState('')
  const [examTotal, setExamTotal] = useState('')
  const [quizTitle, setQuizTitle] = useState('')
  const [reactionChoice, setReactionChoice] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setExamScore('')
      setExamTotal('')
      setQuizTitle('')
      setReactionChoice(null)
    }
  }, [isOpen])

  const handleExamSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!isCorrectExamAnswer(examScore, examTotal)) {
        onClose()
        return
      }
      setStep(2)
    },
    [examScore, examTotal, onClose]
  )

  const handleReactionSelect = useCallback(() => {
    setStep('success')
  }, [])

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
          key="menna-verification"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menna-title"
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
            id="menna-title"
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2 className="text-2xl font-bold text-center text-rose-700 mb-6">
              اثبتى انك منة!! {step === 'success' ? '😡' : step === 1 ? '🤔' : '😊'}
            </h2>

            {step === 1 && (
              <form onSubmit={handleExamSubmit} className="space-y-6">
                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-3">
                    اخر امتحان جبتى فيه كام من كام؟
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="exam-score" className="block text-xs font-medium text-gray-500 mb-1">
                        الدرجة اللي جبتيها
                      </label>
                      <input
                        id="exam-score"
                        type="number"
                        min={0}
                        max={100}
                        inputMode="numeric"
                        value={examScore}
                        onChange={(e) => setExamScore(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg text-gray-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label htmlFor="exam-total" className="block text-xs font-medium text-gray-500 mb-1">
                        من إجمالي
                      </label>
                      <input
                        id="exam-total"
                        type="number"
                        min={1}
                        max={100}
                        inputMode="numeric"
                        value={examTotal}
                        onChange={(e) => setExamTotal(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg text-gray-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="quiz-title" className="block text-sm font-medium text-gray-700 mb-2">
                    اسم الكويز (اختياري)
                  </label>
                  <input
                    id="quiz-title"
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 focus:ring-2 focus:ring-rose-300 transition"
                >
                  التالي
                </button>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <p className="text-gray-700">
                  لو جبتى 18/20 فى امتحان هيبقا رد فعلك ايه؟
                </p>
                <div className="space-y-3">
                  {REACTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setReactionChoice(opt.id)
                        handleReactionSelect()
                      }}
                      className={`w-full text-right py-3 px-4 rounded-xl border-2 transition ${
                        reactionChoice === opt.id
                          ? 'border-rose-500 bg-rose-50 text-rose-800'
                          : 'border-gray-200 hover:border-rose-300 bg-white'
                      }`}
                    >
                      {opt.id}. {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <p className="text-xl font-semibold text-rose-700 mb-4">أحسنت! انتى منة فعلاً 😡😡😡😡😡😡😡😡😡😡</p>
                <button
                  type="button"
                  onClick={() => (onVerified != null ? onVerified() : onClose())}
                  className="px-6 py-2 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition"
                >
                  كمل
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
