import { useDiagnosisStore } from '../../stores/diagnosisStore'
import { Button } from '../ui/Button'

const examplePrompts = [
  'Пациент 45 лет, жалобы на острую боль в правой нижней части живота, тошнота, температура 38.2 C',
  'Ребёнок 7 лет, кашель 5 дней, насморк, температура 37.5 C, хрипы в лёгких',
  'Женщина 55 лет, головная боль, головокружение, повышение АД 160 на 100',
]

const VALID_CHARS = /^[а-яА-ЯёЁa-zA-Z0-9\s.,;:!?\-()]+$/
const MAX_CHARS = 2000
/** Strip symbols that cannot be sent to the API (e.g. °, /) so input is always valid. */
const SANITIZE_REGEX = /[^\u0400-\u04FFa-zA-Z0-9\s.,;:!?\-()]/g
function sanitizeInput(value: string): string {
  return value.replace(SANITIZE_REGEX, '').slice(0, MAX_CHARS)
}

export function InputSection() {
  const { input, setInput, isLoading, clear } = useDiagnosisStore()
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(sanitizeInput(e.target.value))
  const isValid = input.trim().length > 0 && input.length <= MAX_CHARS && VALID_CHARS.test(input.replace(/\n/g, ' '))
  const wordCount = input.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="space-y-4">
      <label className="block font-alumni font-semibold text-gray-900">
        Анамнез пациента
      </label>
      <textarea
        value={input}
        onChange={handleChange}
        placeholder="Опишите жалобы пациента, анамнез, симптомы..."
        className="w-full min-h-[180px] px-4 py-3 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none resize-y font-cousine text-sm"
        disabled={isLoading}
      />
      <p className="font-alumni text-sm text-gray-500">
        Не используйте символы °, / и др. — только буквы, цифры, пробелы и знаки .,;:!?-(). Максимум {MAX_CHARS} символов.
      </p>
      {input.trim().length > 0 && (
        <p className={`font-alumni text-sm flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-amber-600'}`}>
          {isValid ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Валидный ввод ({wordCount} слов)
            </>
          ) : (
            'Только буквы, цифры и знаки .,;:!?-()'
          )}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button variant="ghost" size="md" type="button" onClick={clear} disabled={isLoading}>
          Очистить
        </Button>
        <Button variant="outline" size="md" type="button" disabled={isLoading}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Загрузить документ
        </Button>
        <Button variant="primary" size="md" type="submit" disabled={isLoading || !isValid} data-tutorial="anamnesis-analyze">
          {isLoading ? 'Анализ...' : 'Анализировать'}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Button>
      </div>
      <div>
        <p className="font-alumni text-sm text-gray-500 mb-2">Примеры:</p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((prompt) => (
            <button
              key={prompt.slice(0, 30)}
              type="button"
              onClick={() => setInput(prompt)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-alumni text-sm text-gray-700 transition-colors"
            >
              {prompt.slice(0, 45)}...
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
