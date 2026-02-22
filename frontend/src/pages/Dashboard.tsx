import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useDiagnosisStore } from '../stores/diagnosisStore'
import { Card } from '../components/ui/Card'

const quickActions = [
  { to: '/anamnesis', label: 'Пройти опросник', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/mri', label: 'Загрузить снимок', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { to: '/iot', label: 'IoT Мониторинг', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

const aiServices = [
  { to: '/mri', title: 'MRI Классификация', desc: 'Deep Learning классификация МРТ снимков' },
  { to: '/mri-segmentation', title: 'MRI Сегментация', desc: 'Статическая и адаптивная сегментация' },
  { to: '/ml-analysis', title: 'ML Анализ', desc: 'Статический и адаптивный ML анализ' },
  { to: '/iot', title: 'IoT Мониторинг', desc: 'Мониторинг показателей в реальном времени' },
  { to: '/anamnesis', title: 'Анамнез жизни', desc: 'Сбор и анализ истории болезни' },
  { to: '/cv-analysis', title: 'CV Анализ', desc: 'Computer Vision анализ движений' },
]

const recommendations = [
  { title: 'Проверьте сердечный ритм', sub: 'Рекомендуем IoT мониторинг', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { title: 'Когнитивный тест', sub: 'Пройдите опросник MMSE', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { title: 'Уровень стресса', sub: 'Оценка через PSS-10', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
]

const tasks = [
  { label: 'Заполнить профиль', done: true },
  { label: 'Пройти первый опросник', done: true },
  { label: 'Подключить IoT устройство', done: false },
]

export function Dashboard() {
  const { user } = useAuthStore()
  const { setInput } = useDiagnosisStore()
  const location = useLocation()
  const prefill = (location.state as { prefill?: string })?.prefill

  useEffect(() => {
    if (prefill) setInput(prefill)
  }, [prefill, setInput])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-aldrich text-3xl font-bold text-gray-900 mb-2">
          AI-assisted Diagnosis
        </h1>
        <p className="font-alumni text-base text-gray-600 max-w-2xl">
          Введите анамнез пациента в свободной форме и получите доказательные гипотезы на основе клинических протоколов Казахстана за секунды.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-aldrich text-xl text-gray-900 mb-2">
                Добро пожаловать{user ? ` ${user.name}` : ''}
              </h2>
              <p className="font-alumni text-gray-600 mb-4">
                Начните с прохождения диагностики для получения персональных рекомендаций от AI
              </p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map(({ to, label, icon }) => (
                  <Link key={to} to={to}>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white font-alumni text-sm hover:bg-gray-800 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                      </svg>
                      {label}
                    </button>
                  </Link>
                ))}
              </div>
            </div>
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-alumni rounded">7 дней подряд</span>
          </div>
        </Card>
        <Card>
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-green-500" />
            </span>
            Neuro-Readiness Score
          </h3>
          <p className="font-aldrich text-4xl text-green-600 mb-4">78 / 100</p>
          <div className="space-y-2">
            {['Сон: 85%', 'HRV: 72%', 'Стресс: 32%'].map((m) => (
              <div key={m} className="flex items-center justify-between">
                <span className="font-alumni text-sm text-gray-600">{m}</span>
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: m.match(/\d+/)?.[0] + '%' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { value: '12', label: 'всего проведено', trend: '+12%' },
          { value: '5', label: 'Анализов', trend: '+12%' },
          { value: '32%', label: 'Опросников', trend: 'низкий' },
          { value: '15', label: 'Уровень стресса', trend: '-12%' },
          { value: 'декабря', label: 'Следующий визит', trend: '+12%' },
        ].map(({ value, label, trend }) => (
          <Card key={label} className="text-center">
            <p className="font-aldrich text-2xl text-gray-900">{value}</p>
            <p className="font-alumni text-xs text-gray-500">{label}</p>
            <p className="font-alumni text-xs text-green-600 mt-1">{trend}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-aldrich text-lg font-bold text-gray-900">AI сервисы</h3>
            <span className="font-alumni text-sm text-gray-500">6 доступно</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {aiServices.map(({ to, title, desc }) => (
              <Link key={to} to={to} className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <p className="font-aldrich text-sm font-bold text-gray-900">{title}</p>
                <p className="font-alumni text-xs text-gray-500">{desc}</p>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">AI Рекомендации</h3>
          <div className="space-y-3">
            {recommendations.map(({ title, sub, icon }) => (
              <div key={title} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50">
                <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                <div>
                  <p className="font-alumni font-semibold text-gray-900">{title}</p>
                  <p className="font-alumni text-sm text-gray-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Задачи</h3>
          <p className="font-alumni text-sm text-gray-500 mb-4">2/3 выполнено</p>
          <div className="space-y-2">
            {tasks.map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2">
                {done ? (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-5 h-5 rounded border-2 border-gray-300" />
                )}
                <span className={`font-alumni text-sm ${done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Быстрый ввод анамнеза</h3>
          <p className="font-alumni text-gray-600 mb-4">Введите анамнез для получения диагностических гипотез</p>
          <Link to="/anamnesis">
            <button className="w-full py-3 rounded-lg bg-black text-white font-alumni font-semibold hover:bg-gray-800 transition-colors">
              Перейти к анамнезу
            </button>
          </Link>
        </Card>
      </div>
    </div>
  )
}
