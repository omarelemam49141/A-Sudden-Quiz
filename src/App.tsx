import { useState } from 'react'
import IntroPopup from './components/IntroPopup'
import MennaVerificationPopup from './components/MennaVerificationPopup'
import QuizArea from './components/QuizArea'

export type PopupState = 'none' | 'intro' | 'menna'
export type ViewState = 'gate' | 'quiz'

// Path to \"Who will win the million dollars\" sound.
const MILLION_DOLLARS_SOUND = `${import.meta.env.BASE_URL}sounds/million-dollars.mp3`

export default function App() {
  const [view, setView] = useState<ViewState>('gate')
  const [popup, setPopup] = useState<PopupState>('intro')

  const openMennaVerification = (_name: string) => {
    setPopup('menna')
  }

  const goToQuiz = () => {
    const audio = new Audio(MILLION_DOLLARS_SOUND)
    audio.play().catch(() => {
      // Autoplay may be blocked or file missing; ignore
    })
    setPopup('none')
    setView('quiz')
  }

  if (view === 'quiz') {
    return <QuizArea />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 flex flex-col items-center justify-center p-4">
      {popup === 'none' && (
        <button
          type="button"
          onClick={() => setPopup('intro')}
          className="px-8 py-4 rounded-2xl bg-rose-500 text-white font-semibold text-lg shadow-lg hover:bg-rose-600 hover:scale-105 transition-all"
        >
          ابدأ الكويز
        </button>
      )}

      <IntroPopup
        isOpen={popup === 'intro'}
        onClose={() => setPopup('none')}
        onMennaDetected={openMennaVerification}
      />

      <MennaVerificationPopup
        isOpen={popup === 'menna'}
        onClose={() => setPopup('none')}
        onVerified={goToQuiz}
      />
    </div>
  )
}
