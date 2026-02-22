import { useState } from 'react'
import { PageTemplate } from '../components/shared/PageTemplate'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function CvAnalysis() {
  const [file, setFile] = useState<File | null>(null)

  return (
    <PageTemplate
      title="CV Анализ"
      subtitle="Computer Vision анализ движений и поз. Загрузите видео для оценки моторных функций."
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Загрузка видео</h3>
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-gray-300 transition-colors cursor-pointer"
            onClick={() => document.getElementById('cv-upload')?.click()}
          >
            <input
              id="cv-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="font-alumni text-gray-600 mb-1">
              {file ? file.name : 'Перетащите видео или нажмите'}
            </p>
            <p className="font-alumni text-sm text-gray-500">MP4, WebM до 100 МБ</p>
          </div>
          <Button variant="primary" size="lg" className="mt-4 w-full" disabled={!file}>
            Анализировать
          </Button>
        </Card>
        <Card>
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Оценка движений</h3>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-alumni text-sm text-gray-600">Походка</p>
              <p className="font-cousine text-xs text-gray-500">Ожидание анализа</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-alumni text-sm text-gray-600">Баланс</p>
              <p className="font-cousine text-xs text-gray-500">Ожидание анализа</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-alumni text-sm text-gray-600">Координация</p>
              <p className="font-cousine text-xs text-gray-500">Ожидание анализа</p>
            </div>
          </div>
        </Card>
      </div>
    </PageTemplate>
  )
}
