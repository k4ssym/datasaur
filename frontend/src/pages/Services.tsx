import { Link } from 'react-router-dom'
import { LandingHeader } from '../components/landing/LandingHeader'

const services = [
  { title: 'Анамнез жизни', desc: 'Сбор и анализ истории болезни пациента', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { title: 'IoT Мониторинг', desc: 'Мониторинг показателей здоровья в реальном времени', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { title: 'MRI Классификация', desc: 'Deep Learning классификация МРТ снимков', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { title: 'Библиотека', desc: 'Образовательные и релаксационные материалы', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
]

export function Services() {
  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden />
      <LandingHeader />

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <p className="font-alumni text-xs uppercase tracking-widest text-gray-500 mb-2">
          ИНСТРУМЕНТЫ
        </p>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div>
            <h1 className="font-aldrich text-4xl font-bold text-gray-900 mb-4">
              AI сервисы
            </h1>
          </div>
          <p className="font-alumni text-lg text-gray-600 max-w-xl">
            Комплексные инструменты для диагностики различных аспектов неврологического здоровья на основе клинических протоколов Казахстана
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {services.map(({ title, desc, icon }) => (
            <Link
              key={title}
              to="/dashboard"
              className="block bg-gray-50 rounded-xl p-6 hover:shadow-md hover:bg-white transition-all border border-gray-100"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              </div>
              <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="font-alumni text-sm text-gray-600">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
