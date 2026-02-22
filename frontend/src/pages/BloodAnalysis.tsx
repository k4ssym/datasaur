import { useState } from 'react'
import { PageTemplate } from '../components/shared/PageTemplate'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const workflowSteps = [
  { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Collection', sub: 'Sample logged' },
  { icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', label: 'Upload', sub: 'Secure transfer' },
  { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: 'Analysis', sub: 'Pattern check' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Insights', sub: 'Risk stratification' },
]

export function BloodAnalysis() {
  const [file, setFile] = useState<File | null>(null)

  return (
    <PageTemplate
      title="AI Blood Analysis"
      subtitle="AI анализирует биомаркеры крови, выявляя паттерны воспаления, гормональных изменений и метаболических рисков. Загрузите CSV файл с результатами анализа."
    >
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center mb-6">
        <input
          type="file"
          accept=".csv,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          id="blood-upload"
        />
        <label htmlFor="blood-upload" className="cursor-pointer block">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="font-alumni text-lg text-gray-700 mb-1">Upload CSV or PDF blood test</p>
          <p className="font-alumni text-sm text-gray-500 mb-4">PDF из Invivo/Олимп или CSV (60+ биомаркеров + RU/KZ/EN)</p>
          <Button variant="primary" size="md">Choose file</Button>
        </label>
        {file && <p className="font-alumni text-sm text-gray-600 mt-4">Выбран: {file.name}</p>}
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {workflowSteps.map(({ icon, label, sub }) => (
          <Card key={label} className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
            <p className="font-aldrich text-sm font-bold text-gray-900">{label}</p>
            <p className="font-alumni text-xs text-gray-500">{sub}</p>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="primary" size="lg" disabled={!file}>
          Начать анализ
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </Button>
      </div>
    </PageTemplate>
  )
}
