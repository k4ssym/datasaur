import { Disclosure } from '@headlessui/react'
import type { DiagnosisResult } from '../../types'
import { Card, CardTitle } from '../ui/Card'

interface ResultsSectionProps {
  result: DiagnosisResult
}

export function ResultsSection({ result }: ResultsSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardTitle className="mb-4">Основной диагноз</CardTitle>
        <div className="space-y-2">
          <p className="font-aldrich text-xl text-gray-900">{result.primaryDiagnosis}</p>
          <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg font-alumni text-sm font-medium text-gray-800">
            ICD-10: {result.icd10Code}
          </span>
          {result.confidenceScore != null && (
            <p className="font-alumni text-sm text-gray-600">
              Уверенность: {Math.round(result.confidenceScore * 100)}%
            </p>
          )}
          {result.protocolReference && (
            <a
              href={result.protocolReference}
              target="_blank"
              rel="noopener noreferrer"
              className="font-alumni text-sm text-teal-600 hover:underline"
            >
              Ссылка на протокол →
            </a>
          )}
        </div>
      </Card>

      {result.differentialDiagnoses.length > 0 && (
        <Card>
          <Disclosure>
            <Disclosure.Button className="flex items-center justify-between w-full text-left">
              <CardTitle>Дифференциальные диагнозы</CardTitle>
              <svg
                className="w-5 h-5 text-gray-500 ui-open:rotate-180 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Disclosure.Button>
            <Disclosure.Panel className="mt-4 space-y-4">
              {result.differentialDiagnoses.map((d, i) => (
                <div key={i} className="border-l-2 border-gray-200 pl-4">
                  <p className="font-alumni font-semibold text-gray-900">{d.diagnosis}</p>
                  <p className="font-alumni text-sm text-gray-600">ICD-10: {d.icd10Code}</p>
                  <p className="font-alumni text-sm text-gray-500 mt-1">{d.reasoning}</p>
                </div>
              ))}
            </Disclosure.Panel>
          </Disclosure>
        </Card>
      )}

      {result.rawProtocolSnippets && result.rawProtocolSnippets.length > 0 && (
        <Card>
          <Disclosure>
            <Disclosure.Button className="flex items-center justify-between w-full text-left">
              <CardTitle>Фрагменты протоколов</CardTitle>
              <svg
                className="w-5 h-5 text-gray-500 ui-open:rotate-180 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Disclosure.Button>
            <Disclosure.Panel className="mt-4">
              <div className="space-y-2 font-alumni text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                {result.rawProtocolSnippets.map((snippet, i) => (
                  <p key={i} className="border-b border-gray-200 pb-2 last:border-0">
                    {snippet}
                  </p>
                ))}
              </div>
            </Disclosure.Panel>
          </Disclosure>
        </Card>
      )}
    </div>
  )
}
