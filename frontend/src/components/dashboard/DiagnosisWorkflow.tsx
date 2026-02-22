import { useCallback } from 'react'
import { useDiagnosisStore } from '../../stores/diagnosisStore'
import { useHistoryStore } from '../../stores/historyStore'
import { useHealthStore } from '../../stores/healthStore'
import { useAuthStore } from '../../stores/authStore'
import { submitDiagnosis } from '../../services/api'
import { InputSection } from './InputSection'
import { ProgressIndicator } from './ProgressIndicator'
import { ResultsSection } from './ResultsSection'
import { Card } from '../ui/Card'

export function DiagnosisWorkflow() {
  const {
    input,
    isLoading,
    progressStep,
    result,
    error,
    setLoading,
    setProgressStep,
    setResult,
    setError,
  } = useDiagnosisStore()
  const { addItem } = useHistoryStore()
  const { status } = useHealthStore()
  const { accessToken } = useAuthStore()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      setLoading(true)
      setError(null)
      setProgressStep('Извлечение симптомов…')

      try {
        await new Promise((r) => setTimeout(r, 500))
        setProgressStep('Поиск клинических протоколов…')
        await new Promise((r) => setTimeout(r, 500))
        setProgressStep('Генерация диагноза…')

        const data = await submitDiagnosis(input, accessToken)

        const diagnosisResult = {
          id: crypto.randomUUID(),
          primaryDiagnosis: data.primaryDiagnosis,
          icd10Code: data.icd10Code,
          confidenceScore: data.confidenceScore,
          protocolReference: data.protocolReference,
          differentialDiagnoses: data.differentialDiagnoses,
          rawProtocolSnippets: data.rawProtocolSnippets,
          timestamp: Date.now(),
          inputPreview: input.slice(0, 100),
          inputText: input,
        }

        setResult(diagnosisResult)
        addItem(diagnosisResult)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Сервис диагностики временно недоступен. Повторите попытку.'
        const isInvalidInput = /invalid|неверн|ошибка ввода|validation|формат/i.test(msg)
        setError(isInvalidInput ? 'Не используйте символы °, / и др. — только буквы, цифры и знаки .,;:!?-()' : msg)
      } finally {
        setLoading(false)
        setProgressStep(null)
      }
    },
    [input, isLoading, status, accessToken, setLoading, setProgressStep, setResult, setError, addItem]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div data-tutorial="anamnesis-input">
        <Card>
          <InputSection />
        </Card>
      </div>

      {status !== 'online' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="font-alumni text-amber-800">
            Сервис диагностики временно перегружен. Пожалуйста, подождите.
          </p>
        </div>
      )}

      {isLoading && progressStep && (
        <Card>
          <ProgressIndicator step={progressStep} />
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="font-alumni text-red-800">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-2 font-alumni text-sm text-red-600 hover:underline"
          >
            Закрыть
          </button>
        </Card>
      )}

      {result ? (
        <div data-tutorial="anamnesis-results">
          <ResultsSection result={result} />
        </div>
      ) : (
        <div data-tutorial="anamnesis-results" className="h-px opacity-0 pointer-events-none" aria-hidden />
      )}
    </form>
  )
}
