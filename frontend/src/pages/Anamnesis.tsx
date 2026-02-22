import { useState, useCallback } from 'react'
import { PageTemplate } from '../components/shared/PageTemplate'
import { DiagnosisWorkflow } from '../components/dashboard/DiagnosisWorkflow'
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay'
import { anamnesisTutorialSteps } from '../components/tutorial/anamnesisTutorialSteps'

export function Anamnesis() {
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)

  const openTutorial = useCallback(() => {
    setTutorialStep(0)
    setTutorialOpen(true)
  }, [])

  const closeTutorial = useCallback(() => setTutorialOpen(false), [])
  const nextStep = useCallback(() => setTutorialStep((s) => Math.min(s + 1, anamnesisTutorialSteps.length - 1)), [])
  const prevStep = useCallback(() => setTutorialStep((s) => Math.max(s - 1, 0)), [])

  return (
    <div className="relative">
      <PageTemplate
        title="Анамнез жизни"
        subtitle="Сбор и анализ истории болезни пациента. Введите анамнез в свободной форме для получения диагностических гипотез."
        dataTutorialId="anamnesis-welcome"
      >
        <DiagnosisWorkflow />
      </PageTemplate>

      {/* Tutorial trigger — for hackathon organisers */}
      <button
        type="button"
        onClick={openTutorial}
        data-tutorial="anamnesis-api"
        className="fixed bottom-8 right-28 z-40 flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white/95 px-4 py-2.5 font-alumni text-sm font-semibold text-gray-700 shadow-lg backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
        aria-label="Открыть обучающий тур"
      >
        <span className="text-lg" aria-hidden>?</span>
        <span>Как пользоваться</span>
      </button>

      {tutorialOpen && (
        <TutorialOverlay
          steps={anamnesisTutorialSteps}
          currentStep={tutorialStep}
          onNext={nextStep}
          onBack={prevStep}
          onClose={closeTutorial}
        />
      )}
    </div>
  )
}
