import { PageTemplate } from '../components/shared/PageTemplate'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function BloodBiochemistry() {
  return (
    <PageTemplate
      title="Биохимический анализ крови"
      subtitle="Детальный анализ биохимических маркеров: глюкоза, холестерин, печёночные ферменты и др."
    >
      <Card>
        <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Загрузка результатов</h3>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-alumni text-gray-600 mb-4">Загрузите результаты биохимического анализа</p>
          <Button variant="primary" size="md">Выбрать файл</Button>
        </div>
      </Card>
    </PageTemplate>
  )
}
