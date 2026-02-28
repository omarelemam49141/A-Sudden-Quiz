import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import emailjs from '@emailjs/browser'
import { QUIZ_STEPS } from '../data/quizSteps'

const EMAILJS_SERVICE_ID = (import.meta.env.VITE_EMAILJS_SERVICE_ID ?? '').trim()
const EMAILJS_TEMPLATE_ID = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? '').trim()
const EMAILJS_PUBLIC_KEY = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? '').trim()
const QUIZ_EMAIL_TO = 'omar.elemam.elmghawry@gmail.com'

/** Q3 (dresses): option id → meme image filename. Shown after step label when on step 3. */
const Q3_MEME_IMAGES: Record<string, string> = {
  a: 'ok.png',
  b: 'happy.jpg',
  c: 'why.png',
  d: 'horrible.png',
}
const getQ3MemeSrc = (optionId: string | undefined) => {
  const base = import.meta.env.BASE_URL
  const filename = optionId ? Q3_MEME_IMAGES[optionId] ?? Q3_MEME_IMAGES.a : Q3_MEME_IMAGES.a
  return `${base}images/${filename}`
}

/** Step label: current number only, total is always infinity (∞). */
const getStepLabel = (stepIndex: number) => `خطوة ${stepIndex + 1} من ∞`

const RESULT_MESSAGES = {
  correct: {
    title: 'صح! 🎉',
    subtitle: 'الله ينور',
  },
  wrong: {
    title: 'غلط!',
    subtitles: [
      'محتاجين نسيب الطبيخ ونذاكر شوية',
      'أبو جبل يغلط الغلطة دى؟',
      'عجيبة! غريبة! مريبة!',
      'على رأى أحمد عرابى: مفيش فايدة ولا سعد زغلول باين',
      'الغلطة دى بتفكرنى بالغلطتين اللى فى امتحان ال 18 من 20',
      'الغلطة دى بتفكرنى بال 3 غلطات اللى فى امتحان 27 من 30',
      'الغلطة دى بتفكرنى ان احنا كلنا بنغلط, ربنا يغفرلك',
      'قال يا قاعدين يكفوكوا شر الجايين.....ايه ده ايه العلاقة؟!',
      'بتشيلى كام فى الجيم؟ شكلك متعودة تشيلى كتير... شيلتى السؤال 😠',
      'تسمعى نكتة؟ مرة منة جاوبت صح هههههههه',
    ],
  },
}

const WRONG_SUBTITLES = RESULT_MESSAGES.wrong.subtitles

/** Picks a wrong message that hasn't been shown this round; when all are shown, resets and picks again. */
function pickNextWrongSubtitle(displayedIndices: Set<number>): string {
  let available = WRONG_SUBTITLES.map((_, i) => i).filter((i) => !displayedIndices.has(i))
  if (available.length === 0) {
    displayedIndices.clear()
    available = WRONG_SUBTITLES.map((_, i) => i)
  }
  const idx = available[Math.floor(Math.random() * available.length)]
  displayedIndices.add(idx)
  return WRONG_SUBTITLES[idx]
}

/** Messages shown in the "أعترض!!" badge — fair rotation like wrong subtitles. */
const OBJECT_BADGE_MESSAGES = [
  'معلش',
  'أوك 👍',
  'ربنا يحنن',
  'رقم الشكاوى 19777',
  'معندناش بنات تعترض',
  '😴',
  'حقك طبعا',
  'وحدى الله',
  'الزرار هيبوظ على فكرة',
  'ههههه... بس افتكرت حاجة كده',
  '😠',
  '😠😠😠',
  '😠'.repeat(100),
]

function pickNextObjectBadgeMessage(displayedIndices: Set<number>): string {
  let available = OBJECT_BADGE_MESSAGES.map((_, i) => i).filter((i) => !displayedIndices.has(i))
  if (available.length === 0) {
    displayedIndices.clear()
    available = OBJECT_BADGE_MESSAGES.map((_, i) => i)
  }
  const idx = available[Math.floor(Math.random() * available.length)]
  displayedIndices.add(idx)
  return OBJECT_BADGE_MESSAGES[idx]
}

function getCorrectSubtitle(stepId?: string) {
  if (stepId === '2') {
    return 'تانى يوم أو تالت يوم, الله أعلم, ربنا يولى من يصلح'
  }
  return RESULT_MESSAGES.correct.subtitle
}

export default function QuizArea() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectedOptionByStep, setSelectedOptionByStep] = useState<Record<string, string>>({})
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null)
  const [wrongSubtitle, setWrongSubtitle] = useState<string | null>(null)
  const [showSorryBadge, setShowSorryBadge] = useState(false)
  const [objectBadgeMessage, setObjectBadgeMessage] = useState<string | null>(null)
  const sorryBadgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const displayedWrongIndicesRef = useRef<Set<number>>(new Set())
  const displayedObjectBadgeIndicesRef = useRef<Set<number>>(new Set())
  const askAhmedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [askAhmedKey, setAskAhmedKey] = useState<string | null>(null)
  const yashrafniTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [yashrafniKey, setYashrafniKey] = useState<string | null>(null)
  const nextBadaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [nextBadaKey, setNextBadaKey] = useState<string | null>(null)
  const tenDollarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tenDollarKey, setTenDollarKey] = useState<string | null>(null)
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(0)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const steps = QUIZ_STEPS
  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1
  const selectedId = currentStep ? selectedOptionByStep[currentStep.id] : undefined
  const isNextDisabled =
    (currentStep?.id === '4' && breakSecondsLeft > 0) ||
    (currentStep && currentStep.options.length > 0 && selectedId === undefined)

  const setSelected = (stepId: string, optionId: string) => {
    setSelectedOptionByStep((prev) => ({ ...prev, [stepId]: optionId }))

    if (askAhmedTimeoutRef.current) {
      clearTimeout(askAhmedTimeoutRef.current)
      askAhmedTimeoutRef.current = null
    }
    if (yashrafniTimeoutRef.current) {
      clearTimeout(yashrafniTimeoutRef.current)
      yashrafniTimeoutRef.current = null
    }
    if (nextBadaTimeoutRef.current) {
      clearTimeout(nextBadaTimeoutRef.current)
      nextBadaTimeoutRef.current = null
    }
    if (tenDollarTimeoutRef.current) {
      clearTimeout(tenDollarTimeoutRef.current)
      tenDollarTimeoutRef.current = null
    }

    if (stepId === '2' && optionId === 'c') {
      const key = `${stepId}:${optionId}`
      setAskAhmedKey(key)
      setYashrafniKey(null)
      setNextBadaKey(null)
      setTenDollarKey(null)
      askAhmedTimeoutRef.current = setTimeout(() => {
        setAskAhmedKey((current) => (current === key ? null : current))
        askAhmedTimeoutRef.current = null
      }, 3000)
    } else if (stepId === '6' && optionId === 'f') {
      const key = `${stepId}:${optionId}`
      setAskAhmedKey(null)
      setYashrafniKey(key)
      setNextBadaKey(null)
      setTenDollarKey(null)
      yashrafniTimeoutRef.current = setTimeout(() => {
        setYashrafniKey((current) => (current === key ? null : current))
        yashrafniTimeoutRef.current = null
      }, 3000)
    } else if (stepId === '7' && optionId === 'e') {
      const key = `${stepId}:${optionId}`
      setAskAhmedKey(null)
      setYashrafniKey(null)
      setNextBadaKey(key)
      setTenDollarKey(null)
      nextBadaTimeoutRef.current = setTimeout(() => {
        setNextBadaKey((current) => (current === key ? null : current))
        nextBadaTimeoutRef.current = null
      }, 3000)
    } else if (stepId === '8' && optionId === 'f') {
      const key = `${stepId}:${optionId}`
      setAskAhmedKey(null)
      setYashrafniKey(null)
      setNextBadaKey(null)
      setTenDollarKey(key)
      tenDollarTimeoutRef.current = setTimeout(() => {
        setTenDollarKey((current) => (current === key ? null : current))
        tenDollarTimeoutRef.current = null
      }, 3000)
    } else {
      setAskAhmedKey(null)
      setYashrafniKey(null)
      setNextBadaKey(null)
      setTenDollarKey(null)
    }
  }

  const goNext = () => {
    if (!currentStep) return
    if (selectedId !== undefined) {
      if (isLastStep) {
        setShowSubmitConfirm(true)
        return
      }
      const correct = currentStep.correctAnswerIds?.includes(selectedId) ?? false
      setResultCorrect(correct)
      if (!correct) setWrongSubtitle(pickNextWrongSubtitle(displayedWrongIndicesRef.current))
      setShowResultPopup(true)
      return
    }
    if (!isLastStep) setCurrentStepIndex((i) => i + 1)
  }

  const buildEmailPayload = () => {
    const subject = 'مراجعة اتفاق الإشهار — إجابات الأسئلة'
    const rows = steps
      .filter((step) => step.options.length > 0)
      .map((step, i) => {
        const selectedId = selectedOptionByStep[step.id]
        const optionText = step.options.find((o) => o.id === selectedId)?.text ?? selectedId ?? '—'
        return { num: i + 1, question: step.question, answer: optionText }
      })
    // Plain-text message for EmailJS "Contact Us" template ({{title}}, {{name}}, {{message}}, {{email}}, {{time}})
    const message = rows
      .map((r) => `السؤال ${r.num}: ${r.question}\nالإجابة: ${r.answer}`)
      .join('\n\n')
    return {
      title: subject,
      name: 'مراجعة الإشهار',
      message,
      email: QUIZ_EMAIL_TO,
      time: new Date().toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }),
    }
  }

  const sendQuizEmail = async () => {
    setShowSubmitConfirm(false)
    setEmailError(null)
    setEmailSending(true)
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      setEmailSending(false)
      setEmailError('إعداد البريد غير مكتمل. يرجى إضافة مفاتيح EmailJS في .env')
      return
    }
    try {
      const templateParams = buildEmailPayload()
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        { publicKey: EMAILJS_PUBLIC_KEY }
      )
      setEmailSent(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const isTemplateError = /template|not found/i.test(msg)
      setEmailError(
        isTemplateError
          ? 'معرف القالب (Template ID) غلط أو مش مربوط بحسابك. تأكدي من الرابط: https://dashboard.emailjs.com/admin/templates'
          : msg || 'فشل الإرسال. حاولي مرة تانية'
      )
    } finally {
      setEmailSending(false)
    }
  }

  const closePopupAndGoNext = () => {
    setShowResultPopup(false)
    setResultCorrect(null)
    setWrongSubtitle(null)
    if (!isLastStep) setCurrentStepIndex((i) => i + 1)
  }

  const closePopupAndObject = () => {
    setShowResultPopup(false)
    setResultCorrect(null)
    setWrongSubtitle(null)
    setShowSorryBadge(false)
    setObjectBadgeMessage(null)
  }

  const handleObjectClick = () => {
    setObjectBadgeMessage(pickNextObjectBadgeMessage(displayedObjectBadgeIndicesRef.current))
    setShowSorryBadge(true)
  }

  useEffect(() => {
    if (!showSorryBadge) return
    sorryBadgeTimeoutRef.current = setTimeout(() => {
      setShowSorryBadge(false)
      sorryBadgeTimeoutRef.current = null
    }, 3000)
    return () => {
      if (sorryBadgeTimeoutRef.current) clearTimeout(sorryBadgeTimeoutRef.current)
    }
  }, [showSorryBadge])

  useEffect(
    () => () => {
      if (askAhmedTimeoutRef.current) clearTimeout(askAhmedTimeoutRef.current)
      if (yashrafniTimeoutRef.current) clearTimeout(yashrafniTimeoutRef.current)
      if (nextBadaTimeoutRef.current) clearTimeout(nextBadaTimeoutRef.current)
    },
    []
  )

  // Break step (id '4'): 5-second funny timer
  const breakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (currentStep?.id !== '4') return
    setBreakSecondsLeft(5)
    breakIntervalRef.current = setInterval(() => {
      setBreakSecondsLeft((prev) => {
        if (prev <= 1) {
          if (breakIntervalRef.current) clearInterval(breakIntervalRef.current)
          breakIntervalRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current)
      breakIntervalRef.current = null
    }
  }, [currentStep?.id])

  const goPrev = () => {
    if (!isFirstStep) setCurrentStepIndex((i) => i - 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-amber-50 to-rose-50 flex flex-col">
      {/* Step form — funny vibes; Q3 shows meme after step label */}
      <section className="flex-1 flex flex-col items-center justify-center p-6">
        <div
          className={`w-full flex flex-col gap-4 items-center ${currentStep?.id === '3' ? 'md:flex-row md:max-w-4xl md:justify-center' : 'max-w-lg'}`}
        >
          <div className="w-full max-w-lg">
            <h2 className="text-2xl font-bold text-center text-rose-700 mb-4">
              مراجعة اتفاق الإشهار أبو فستان من شى إن
            </h2>
            <p className="text-sm font-medium text-amber-700 mb-1 text-center">
              {getStepLabel(currentStepIndex)}
            </p>
            {currentStep?.id === '3' && (
              <div className="flex justify-center mb-4">
                <div className="rounded-lg overflow-hidden border-2 border-amber-200 shadow-md bg-gray-100 aspect-square w-20 h-20 flex items-center justify-center text-3xl relative">
                  <img
                    key={selectedOptionByStep['3'] ?? 'none'}
                    src={getQ3MemeSrc(selectedOptionByStep['3'])}
                    alt=""
                    className="w-full h-full object-cover block"
                    onError={(e) => {
                      const el = e.currentTarget
                      el.style.display = 'none'
                      const fallback = el.parentElement?.querySelector('[data-q3-fallback]') as HTMLElement
                      if (fallback) fallback.classList.remove('hidden')
                    }}
                  />
                  <span data-q3-fallback className="hidden absolute text-4xl" aria-hidden>
                    😅
                  </span>
                </div>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl bg-white p-8 shadow-xl border-2 border-dashed border-rose-200/80"
              >
                {currentStep?.id === '4' ? (
                  /* Break time: funny 5-second timer */
                  <div className="text-center py-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {breakSecondsLeft > 0 ? 'استراحة! ☕' : 'lets نكمل'}
                    </h3>
                    {breakSecondsLeft > 0 ? (
                      <>
                        <img
                          src={`${import.meta.env.BASE_URL}images/resting1.png`}
                          alt="شوية هدوء... ثواني وترتاح"
                          className="w-full max-w-sm mx-auto rounded-xl object-cover mb-3"
                        />
                        <motion.span
                          key={breakSecondsLeft}
                          initial={{ scale: 1.4 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          className="inline-block text-6xl font-black text-rose-500 tabular-nums"
                        >
                          {breakSecondsLeft}
                        </motion.span>
                        <p className="text-gray-500 text-sm mt-2">ثانية</p>
                      </>
                    ) : (
                      <img
                        src={`${import.meta.env.BASE_URL}images/resting2.png`}
                        alt="استراحة خلصت! جاهزين؟"
                        className="w-full max-w-sm mx-auto rounded-xl object-cover"
                      />
                    )}
                  </div>
                ) : currentStep ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
                      {currentStep.question}
                    </h3>
                    <div className="space-y-3">
                      {currentStep.options.map((opt) => {
                        const key = `${currentStep.id}:${opt.id}`
                        const showAskAhmed = askAhmedKey === key
                        const showYashrafni = yashrafniKey === key
                        const showNextBada = nextBadaKey === key
                        const showTenDollar = tenDollarKey === key
                        return (
                          <div key={opt.id} className="relative">
                            <motion.button
                              type="button"
                              onClick={() => setSelected(currentStep.id, opt.id)}
                              whileHover={{
                                scale: 1.03,
                                x: 6,
                                rotate: 0.5,
                                transition: { type: 'spring', stiffness: 400, damping: 22 },
                              }}
                              whileTap={{
                                scale: 0.98,
                                transition: { type: 'spring', stiffness: 500, damping: 30 },
                              }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                              className={`w-full text-right py-3 px-4 rounded-xl border-2 transition-colors duration-200 ${
                                selectedOptionByStep[currentStep.id] === opt.id
                                  ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-md'
                                  : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 bg-white'
                              }`}
                            >
                              {opt.text}
                            </motion.button>
                            <AnimatePresence>
                              {showAskAhmed && (
                                <motion.div
                                  initial={{ scale: 0, y: 8, opacity: 0 }}
                                  animate={{
                                    scale: 1,
                                    y: 0,
                                    opacity: 1,
                                    transition: {
                                      type: 'spring',
                                      stiffness: 450,
                                      damping: 18,
                                    },
                                  }}
                                  exit={{
                                    scale: 0.6,
                                    y: -16,
                                    opacity: 0,
                                    transition: { duration: 0.3, ease: 'easeInOut' },
                                  }}
                                  className="absolute left-0 -top-3 -translate-y-full px-3 py-1 rounded-full bg-sky-200 border border-sky-500 text-sky-900 text-xs font-semibold shadow-md"
                                >
                                  اسألى أحمد
                                </motion.div>
                              )}
                              {showYashrafni && (
                                <motion.div
                                  initial={{ scale: 0, y: 8, opacity: 0 }}
                                  animate={{
                                    scale: 1,
                                    y: 0,
                                    opacity: 1,
                                    transition: {
                                      type: 'spring',
                                      stiffness: 450,
                                      damping: 18,
                                    },
                                  }}
                                  exit={{
                                    scale: 0.6,
                                    y: -16,
                                    opacity: 0,
                                    transition: { duration: 0.3, ease: 'easeInOut' },
                                  }}
                                  className="absolute left-0 -top-3 -translate-y-full px-3 py-1 rounded-full bg-amber-200 border border-amber-500 text-amber-900 text-xs font-semibold shadow-md"
                                >
                                  يشرفنى 😎
                                </motion.div>
                              )}
                              {showNextBada && (
                                <motion.div
                                  initial={{ scale: 0, y: 8, opacity: 0 }}
                                  animate={{
                                    scale: 1,
                                    y: 0,
                                    opacity: 1,
                                    transition: {
                                      type: 'spring',
                                      stiffness: 450,
                                      damping: 18,
                                    },
                                  }}
                                  exit={{
                                    scale: 0.6,
                                    y: -16,
                                    opacity: 0,
                                    transition: { duration: 0.3, ease: 'easeInOut' },
                                  }}
                                  className="absolute left-0 -top-3 -translate-y-full px-3 py-1 rounded-full bg-rose-200 border border-rose-500 text-rose-900 text-xs font-semibold shadow-md"
                                >
                                  اشطا, ماشى, اوك, next بقا 😠
                                </motion.div>
                              )}
                              {showTenDollar && (
                                <motion.div
                                  initial={{ scale: 0, y: 8, opacity: 0 }}
                                  animate={{
                                    scale: 1,
                                    y: 0,
                                    opacity: 1,
                                    transition: {
                                      type: 'spring',
                                      stiffness: 450,
                                      damping: 18,
                                    },
                                  }}
                                  exit={{
                                    scale: 0.6,
                                    y: -16,
                                    opacity: 0,
                                    transition: { duration: 0.3, ease: 'easeInOut' },
                                  }}
                                  className="absolute left-0 -top-3 -translate-y-full px-3 py-1 rounded-full bg-emerald-200 border border-emerald-500 text-emerald-900 text-xs font-semibold shadow-md"
                                >
                                  ب 10 دولار $$
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between items-center mt-6 gap-4">
              <motion.button
                type="button"
                onClick={goPrev}
                disabled={isFirstStep}
                whileHover={!isFirstStep ? { scale: 1.05 } : {}}
                whileTap={!isFirstStep ? { scale: 0.95 } : {}}
                className="px-5 py-2 rounded-xl border-2 border-gray-300 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                👉 ورايا
              </motion.button>
              <motion.button
                type="button"
                onClick={goNext}
                disabled={isNextDisabled}
                whileHover={isNextDisabled ? {} : { scale: 1.05 }}
                whileTap={isNextDisabled ? {} : { scale: 0.95 }}
                className="px-5 py-2 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLastStep ? 'خلصت! 🎉' : 'قدام 👈'}
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* Result popup — funny correct/wrong */}
      <AnimatePresence>
        {showResultPopup && resultCorrect !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => e.target === e.currentTarget && closePopupAndObject()}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border-2 border-dashed border-amber-300 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-3xl font-bold mb-2">
                {resultCorrect ? RESULT_MESSAGES.correct.title : RESULT_MESSAGES.wrong.title}
              </p>
              <p className="text-gray-600 text-sm mb-6">
                {resultCorrect ? getCorrectSubtitle(currentStep?.id) : (wrongSubtitle ?? RESULT_MESSAGES.wrong.subtitles[0])}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center relative">
                {resultCorrect && (
                  <motion.button
                    type="button"
                    onClick={closePopupAndGoNext}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition shadow-md"
                  >
                    اللي بعده
                  </motion.button>
                )}
                <div className="relative">
                  <motion.button
                    type="button"
                    onClick={handleObjectClick}
                    whileHover={{ scale: 1.05, rotate: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 rounded-xl border-2 border-amber-400 bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100 transition"
                  >
                    أعترض!!
                  </motion.button>
                  <AnimatePresence>
                    {showSorryBadge && (
                      <motion.div
                        initial={{ scale: 0, y: 8, rotate: -12, opacity: 0 }}
                        animate={{
                          scale: 1,
                          y: 0,
                          rotate: 0,
                          opacity: 1,
                          transition: {
                            type: 'spring',
                            stiffness: 500,
                            damping: 15,
                            mass: 0.8,
                          },
                        }}
                        exit={{
                          scale: 0.3,
                          y: -24,
                          opacity: 0,
                          rotate: 8,
                          transition: { duration: 0.35, ease: 'easeIn' },
                        }}
                        className="absolute left-1/2 bottom-full -translate-x-1/2 mb-2 px-3 py-1.5 rounded-full bg-amber-200 border-2 border-amber-500 text-amber-900 font-bold text-sm shadow-lg whitespace-nowrap"
                        style={{ originY: 1 }}
                      >
                        {objectBadgeMessage ?? 'معلش'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit confirmation (last step only) */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => e.target === e.currentTarget && setShowSubmitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border-2 border-dashed border-rose-300 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xl font-bold text-gray-800 mb-2">إرسال الإجابات</p>
              <p className="text-gray-600 text-sm mb-6">هل أنت متأكدة من إرسال إجاباتك إلى البريد؟</p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  إلغاء
                </motion.button>
                <motion.button
                  type="button"
                  onClick={sendQuizEmail}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 shadow-md"
                >
                  نعم، أرسلي
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loader while sending email */}
      <AnimatePresence>
        {emailSending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black/60"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 rounded-full border-4 border-rose-200 border-t-rose-500"
            />
            <p className="text-white font-semibold">جاري إرسال إجاباتك...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success — quiz over */}
      <AnimatePresence>
        {emailSent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl border-2 border-dashed border-emerald-300 text-center"
            >
              <p className="text-3xl font-bold text-emerald-700 mb-2">تم الإرسال بنجاح! 🎉</p>
              <p className="text-gray-600 text-sm">إجاباتك وصلت. الأسئلة خلصت!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error — retry or dismiss */}
      <AnimatePresence>
        {emailError && !emailSending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => e.target === e.currentTarget && setEmailError(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border-2 border-dashed border-amber-300 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xl font-bold text-amber-800 mb-2">لم يتم الإرسال</p>
              <p className="text-gray-600 text-sm mb-4">{emailError}</p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  type="button"
                  onClick={() => setEmailError(null)}
                  className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 font-medium"
                >
                  إغلاق
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => sendQuizEmail()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white font-semibold"
                >
                  حاولي تاني
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
