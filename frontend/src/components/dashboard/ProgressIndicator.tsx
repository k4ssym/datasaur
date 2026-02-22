interface ProgressIndicatorProps {
  step: string
}

const steps = [
  'Извлечение симптомов…',
  'Поиск клинических протоколов…',
  'Генерация диагноза…',
]

export function ProgressIndicator({ step }: ProgressIndicatorProps) {
  const currentIndex = steps.findIndex((s) => step.includes(s.split('…')[0])) ?? 0

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i <= currentIndex ? 'bg-gray-900' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="font-alumni text-sm text-gray-600">{step}</p>
    </div>
  )
}
