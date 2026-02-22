import { useCallback, useEffect, useRef, useState } from 'react'

export interface TutorialStep {
  id: string
  title: string
  body: string
  /** CSS selector for the element this step describes (e.g. [data-tutorial="..."]) */
  targetSelector: string
  /** Where to place the mini window relative to the target */
  placement?: 'top' | 'right' | 'bottom' | 'left'
  icon?: string
}

interface TutorialOverlayProps {
  steps: TutorialStep[]
  currentStep: number
  onNext: () => void
  onBack: () => void
  onClose: () => void
}

const CARD_GAP = 12
const CARD_WIDTH = 320
const FALLBACK = { top: 120, left: 24 }

function getPosition(
  rect: DOMRect,
  placement: TutorialStep['placement'],
  cardWidth: number,
  gap: number
): { top: number; left: number } {
  const viewport = { w: window.innerWidth, h: window.innerHeight }
  const pad = 16

  switch (placement) {
    case 'right':
      return {
        top: rect.top + rect.height / 2 - 40,
        left: Math.min(rect.right + gap, viewport.w - cardWidth - pad),
      }
    case 'left':
      return {
        top: rect.top + rect.height / 2 - 40,
        left: Math.max(rect.left - cardWidth - gap, pad),
      }
    case 'bottom':
      return {
        top: Math.min(rect.bottom + gap, viewport.h - 180 - pad),
        left: rect.left + Math.max(0, rect.width / 2 - cardWidth / 2),
      }
    case 'top':
      return {
        top: Math.max(rect.top - 160 - gap, pad),
        left: rect.left + Math.max(0, rect.width / 2 - cardWidth / 2),
      }
    default:
      return {
        top: Math.min(rect.bottom + gap, viewport.h - 180 - pad),
        left: rect.left + Math.max(0, rect.width / 2 - cardWidth / 2),
      }
  }
}

export function TutorialOverlay({
  steps,
  currentStep,
  onNext,
  onBack,
  onClose,
}: TutorialOverlayProps) {
  const step = steps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1
  const [position, setPosition] = useState(FALLBACK)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!step?.targetSelector) {
      setPosition(FALLBACK)
      return
    }
    const el = document.querySelector(step.targetSelector)
    if (!el) {
      setPosition(FALLBACK)
      return
    }
    const rect = el.getBoundingClientRect()
    const pos = getPosition(rect, step.placement ?? 'bottom', CARD_WIDTH, CARD_GAP)
    setPosition(pos)
  }, [currentStep, step?.targetSelector, step?.placement])

  useEffect(() => {
    overlayRef.current?.focus()
  }, [currentStep])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') !isLast && onNext()
      if (e.key === 'ArrowLeft') !isFirst && onBack()
    },
    [isFirst, isLast, onClose, onNext, onBack]
  )

  if (!step) return null

  return (
    <div
      ref={overlayRef}
      tabIndex={0}
      className="fixed inset-0 z-[100] outline-none"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-body"
    >
      {/* Light background shadow only — click to close */}
      <div
        className="absolute inset-0 bg-black/15"
        aria-hidden
        onClick={onClose}
      />

      {/* Mini window next to the target element */}
      <div
        className="absolute z-10 w-[320px] rounded-xl border border-gray-200/90 bg-white shadow-xl"
        style={{
          top: position.top,
          left: Math.max(16, Math.min(position.left, window.innerWidth - CARD_WIDTH - 16)),
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 p-4 pb-2">
          <div className="min-w-0 flex-1">
            <h2
              id="tutorial-title"
              className="font-aldrich text-base font-bold text-gray-900"
            >
              {step.title}
            </h2>
            <p
              id="tutorial-body"
              className="mt-1 font-alumni text-sm text-gray-600 leading-snug"
            >
              {step.body}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Закрыть"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-1">
          <span className="font-alumni text-xs text-gray-400">
            {currentStep + 1} / {steps.length}
          </span>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-alumni text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Назад
              </button>
            )}
            <button
              type="button"
              onClick={isLast ? onClose : onNext}
              className="rounded-lg bg-black px-3 py-1.5 font-alumni text-sm font-semibold text-white hover:bg-gray-800"
            >
              {isLast ? 'Закрыть' : 'Далее'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
