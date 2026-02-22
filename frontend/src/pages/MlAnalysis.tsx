import { useState } from 'react'
import { PageTemplate } from '../components/shared/PageTemplate'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function MlAnalysis() {
  const [data, setData] = useState('')

  return (
    <PageTemplate
      title="ML Анализ"
      subtitle="Статический и адаптивный ML анализ медицинских данных. Загрузите CSV или введите данные для анализа."
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Входные данные</h3>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Вставьте данные в формате CSV или JSON..."
            className="w-full min-h-[200px] px-4 py-3 border border-gray-200 rounded-lg font-cousine text-sm resize-y"
          />
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="md">Загрузить CSV</Button>
            <Button variant="primary" size="md" disabled={!data.trim()}>Анализировать</Button>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Метрики</h3>
            <div className="space-y-3">
              {['Точность', 'Полнота', 'F1-score'].map((m) => (
                <div key={m} className="flex justify-between items-center">
                  <span className="font-alumni text-gray-600">{m}</span>
                  <span className="font-cousine text-sm text-gray-900">—</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Рекомендации</h3>
            <p className="font-alumni text-sm text-gray-500">Загрузите данные для получения рекомендаций</p>
          </Card>
        </div>
      </div>
    </PageTemplate>
  )
}
