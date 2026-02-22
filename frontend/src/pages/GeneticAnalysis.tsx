import { useState } from 'react'
import { PageTemplate } from '../components/shared/PageTemplate'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function GeneticAnalysis() {
  const [sequence, setSequence] = useState('')

  return (
    <PageTemplate
      title="Генетический анализ"
      subtitle="Анализ генетических данных для диагностики. Введите последовательность или загрузите файл."
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Генетическая последовательность</h3>
          <textarea
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            placeholder="ATCGATCG..."
            className="w-full min-h-[180px] px-4 py-3 border border-gray-200 rounded-lg font-cousine text-sm resize-y"
          />
          <p className="font-alumni text-sm text-gray-500 mt-2">FASTA, GenBank или сырая последовательность</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="md">Загрузить файл</Button>
            <Button variant="primary" size="md" disabled={!sequence.trim()}>Анализировать</Button>
          </div>
        </Card>
        <Card>
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Результаты</h3>
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="font-alumni text-sm font-semibold text-amber-800">Риски</p>
              <p className="font-alumni text-xs text-amber-700">Загрузите данные для анализа</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-alumni text-sm text-gray-600">Варианты</p>
              <p className="font-cousine text-xs text-gray-500">—</p>
            </div>
          </div>
        </Card>
      </div>
    </PageTemplate>
  )
}
