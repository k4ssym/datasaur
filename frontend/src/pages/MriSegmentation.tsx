import { useState } from 'react'
import { PageTemplate } from '../components/shared/PageTemplate'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function MriSegmentation() {
  const [mode, setMode] = useState<'static' | 'adaptive'>('static')

  return (
    <PageTemplate
      title="MRI Сегментация"
      subtitle="Статическая и адаптивная сегментация МРТ снимков для выделения областей интереса."
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('static')}
              className={`px-4 py-2 rounded-lg font-alumni text-sm ${mode === 'static' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Статическая
            </button>
            <button
              onClick={() => setMode('adaptive')}
              className={`px-4 py-2 rounded-lg font-alumni text-sm ${mode === 'adaptive' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Адаптивная
            </button>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="font-alumni text-gray-600 mb-2">
              {mode === 'static' ? 'Статическая сегментация' : 'Адаптивная сегментация'}
            </p>
            <p className="font-alumni text-sm text-gray-500 mb-4">
              {mode === 'static' ? 'Фиксированные пороги и регионы' : 'Динамическая подстройка под контраст'}
            </p>
            <Button variant="outline" size="md">Загрузить снимок</Button>
          </div>
        </Card>
        <Card>
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Параметры</h3>
          <div className="space-y-4">
            <div>
              <label className="block font-alumni text-sm text-gray-500 mb-1">Регион</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg font-alumni text-sm">
                <option>Головной мозг</option>
                <option>Гиппокамп</option>
                <option>Белое вещество</option>
              </select>
            </div>
            <div>
              <label className="block font-alumni text-sm text-gray-500 mb-1">Чувствительность</label>
              <input type="range" min="0" max="100" defaultValue="50" className="w-full" />
            </div>
          </div>
        </Card>
      </div>
    </PageTemplate>
  )
}
