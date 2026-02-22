import { useState } from 'react'
import { PageTemplate } from '../components/shared/PageTemplate'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function AlphaFold() {
  const [sequence, setSequence] = useState('MKTAYIAKQRQISFVKSHFSRQDILDLWQYFSYGRAL')
  const isValid = /^[ACDEFGHIKLMNPQRSTVWY]+$/i.test(sequence.replace(/\s/g, ''))
  const aminoCount = sequence.replace(/\s/g, '').length

  return (
    <PageTemplate
      title="Protein Structure Prediction"
      subtitle="Предсказание 3D структуры белков по аминокислотной последовательности с использованием ESMFold API. Введите последовательность или загрузите FASTA файл."
    >
      <Card>
        <label className="block font-alumni font-semibold text-gray-900 mb-2">
          Аминокислотная последовательность
        </label>
        <textarea
          value={sequence}
          onChange={(e) => setSequence(e.target.value)}
          placeholder="MKTAYIAKQRQISFVK..."
          className="w-full min-h-[120px] px-4 py-3 border border-gray-200 rounded-lg font-cousine text-sm resize-y"
        />
        <p className="font-alumni text-sm text-gray-500 mt-2">
          Используйте однобуквенные коды аминокислот. Максимум 400 символов.
        </p>
        {sequence.trim().length > 0 && (
          <p className={`font-alumni text-sm flex items-center gap-2 mt-2 ${isValid && aminoCount <= 400 ? 'text-green-600' : 'text-amber-600'}`}>
            {isValid && aminoCount <= 400 ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Валидная последовательность ({aminoCount} аминокислот)
              </>
            ) : (
              'Проверьте формат последовательности'
            )}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Загрузить FASTA
          </Button>
          <Button variant="primary" size="md" disabled={!isValid || aminoCount > 400}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Предсказать структуру
          </Button>
        </div>
      </Card>
    </PageTemplate>
  )
}
