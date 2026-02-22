import { useState } from 'react'
import { PageTemplate } from '../components/shared/PageTemplate'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function MriClassification() {
  const [file, setFile] = useState<File | null>(null)

  return (
    <PageTemplate
      title="MRI Классификация"
      subtitle="Deep Learning классификация МРТ снимков. Загрузите изображение для автоматической классификации по клиническим протоколам."
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Загрузка снимка</h3>
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-gray-300 transition-colors cursor-pointer"
            onClick={() => document.getElementById('mri-upload')?.click()}
          >
            <input
              id="mri-upload"
              type="file"
              accept="image/*,.dcm"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-alumni text-gray-600 mb-1">
              {file ? file.name : 'Перетащите снимок или нажмите для выбора'}
            </p>
            <p className="font-alumni text-sm text-gray-500">DICOM, PNG, JPG до 50 МБ</p>
          </div>
          <Button variant="primary" size="lg" className="mt-4 w-full" disabled={!file}>
            Классифицировать
          </Button>
        </Card>
        <Card>
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Результаты</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-alumni text-gray-500">Статус</span>
              <span className="font-alumni text-gray-900">Ожидание</span>
            </div>
            <div className="flex justify-between">
              <span className="font-alumni text-gray-500">Модель</span>
              <span className="font-alumni text-gray-900">ResNet-50</span>
            </div>
            <div className="flex justify-between">
              <span className="font-alumni text-gray-500">Вероятность</span>
              <span className="font-alumni text-gray-900">—</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-alumni text-xs text-gray-500">Поддерживаемые классы: норма, опухоль, инсульт, атрофия</p>
          </div>
        </Card>
      </div>
    </PageTemplate>
  )
}
