import { PageTemplate } from '../components/shared/PageTemplate'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function IotMonitoring() {
  return (
    <PageTemplate
      title="IoT Мониторинг"
      subtitle="Мониторинг показателей здоровья в реальном времени через подключённые устройства."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Пульс', value: '—', unit: 'уд/мин', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', color: 'text-red-500' },
          { label: 'SpO2', value: '—', unit: '%', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'text-blue-500' },
          { label: 'Температура', value: '—', unit: '°C', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', color: 'text-amber-500' },
          { label: 'Активность', value: '—', unit: 'шагов', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'text-green-500' },
        ].map(({ label, value, unit, icon, color }) => (
          <Card key={label}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-alumni text-gray-500">{label}</span>
              <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
            </div>
            <p className="font-aldrich text-2xl text-gray-900">{value}<span className="font-alumni text-sm text-gray-500 ml-1">{unit}</span></p>
          </Card>
        ))}
      </div>
      <Card>
        <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Подключение устройства</h3>
        <p className="font-alumni text-gray-600 mb-4">Подключите ваше IoT устройство для начала мониторинга</p>
        <Button variant="primary" size="md">Подключить устройство</Button>
      </Card>
    </PageTemplate>
  )
}
