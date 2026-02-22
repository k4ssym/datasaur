import { Link } from 'react-router-dom'
import { LandingHeader } from '../components/landing/LandingHeader'
import { HeroOrb } from '../components/landing/HeroOrb'
import { BackgroundCells } from '../components/landing/BackgroundCells'

const tagChips = [
  { label: 'Рак головного мозга', bg: 'bg-[#fce7e9]', text: 'text-[#9f2d38]' },
  { label: 'Опухоли мозга', bg: 'bg-[#fef3d0]', text: 'text-[#9a6b1a]' },
  { label: 'Нейродегенеративные заболевания', bg: 'bg-[#ede9f7]', text: 'text-[#5b4d7a]' },
]

const services = [
  { to: '/dashboard', title: 'ML Анализ', desc: 'Статический и адаптивный ML анализ данных', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/iot', title: 'IoT Мониторинг', desc: 'Мониторинг показателей здоровья в реальном времени', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { to: '/anamnesis', title: 'Анамнез жизни', desc: 'Сбор и анализ истории болезни пациента', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/cv-analysis', title: 'CV Анализ', desc: 'Computer Vision анализ движений', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { to: '/genetic', title: 'Генетический анализ', desc: 'Анализ генетических данных для диагностики', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { to: '/blood', title: 'Анализ крови', desc: 'Интерпретация результатов анализа крови', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative">
      <BackgroundCells />
      <div className="relative z-10">
      <LandingHeader />

      <section id="hero" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="font-alumni text-xs uppercase tracking-[0.2em] text-gray-400 font-medium mb-4 text-center lg:text-left">
              МУЛЬТИМОДАЛЬНАЯ ПЛАТФОРМА
            </p>
            <div className="h-px bg-gray-200 mb-6 w-12 mx-auto lg:mx-0" />
            <h1 className="font-alumni text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              <span className="font-bold text-gray-900">Нейро-диагностика</span>
              <br />
              <span className="font-normal text-gray-500">и реабилитация</span>
            </h1>
            <div className="flex flex-wrap gap-2 mb-6">
              {tagChips.map(({ label, bg, text }) => (
                <span
                  key={label}
                  className={`px-4 py-2 rounded-full font-alumni text-sm font-medium ${bg} ${text} transition-transform hover:scale-105 cursor-default`}
                >
                  {label}
                </span>
              ))}
            </div>
            <p className="font-alumni text-lg text-gray-600 leading-relaxed max-w-xl mb-8">
              AI-платформа для ранней диагностики, мониторинга и персонализированной реабилитации пациентов
            </p>
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <button className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-alumni font-semibold text-base hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl">
                  Начать работу
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Link>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="font-alumni font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Узнать больше
              </a>
            </div>
          </div>
          <div className="hidden lg:flex justify-center items-center">
            <HeroOrb />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 mt-16 text-gray-400">
          <span className="font-alumni text-xs uppercase tracking-widest font-medium">Scroll</span>
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      <section id="services" className="relative py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-alumni text-xs uppercase tracking-widest text-gray-500 font-medium mb-2">
            ИНСТРУМЕНТЫ
          </p>
          <h2 className="font-alumni text-4xl font-bold text-gray-900 mb-4">
            AI сервисы
          </h2>
          <p className="font-alumni text-lg text-gray-600 max-w-2xl mb-12">
            Комплексные инструменты для диагностики на основе клинических протоколов Казахстана
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(({ to, title, desc, icon }) => (
              <Link
                key={title}
                to={to}
                className="group block bg-white rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/40 transition-all duration-300 border border-gray-100 hover:-translate-y-1 hover:border-gray-200"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center mb-4 transition-colors">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
                <h3 className="font-alumni text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="font-alumni text-sm text-gray-600 font-normal">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="relative py-24 bg-gray-50/80 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-alumni text-xs uppercase tracking-widest text-gray-500 font-medium mb-2">
            О ПЛАТФОРМЕ
          </p>
          <h2 className="font-alumni text-4xl font-bold text-gray-900 mb-6">
            Технологии следующего поколения
          </h2>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="font-alumni text-lg text-gray-600 leading-relaxed">
                Qaz.med объединяет передовые алгоритмы машинного обучения и глубокие нейронные сети для анализа медицинских данных с беспрецедентной точностью.
              </p>
              <p className="font-alumni text-lg text-gray-600 leading-relaxed">
                Наши модели обучены на миллионах клинических случаев и постоянно совершенствуются для обеспечения максимально точной диагностики.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '10M+', label: 'Клинических случаев' },
                { value: '99.2%', label: 'Точность' },
                { value: '24/7', label: 'Доступность' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center p-6 rounded-xl bg-white shadow-md border border-gray-100">
                  <p className="font-alumni text-2xl font-bold text-gray-900">{value}</p>
                  <p className="font-alumni text-sm text-gray-600 font-normal">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div className="px-8 py-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="font-alumni text-sm font-medium text-gray-500">ICD-10</p>
              <p className="font-alumni font-bold text-gray-900">Автоматическое извлечение кодов</p>
            </div>
            <div className="px-8 py-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="font-alumni text-sm font-medium text-gray-500">Протоколы</p>
              <p className="font-alumni font-bold text-gray-900">Клинические протоколы РК</p>
            </div>
            <div className="px-8 py-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="font-alumni text-sm font-medium text-gray-500">Streaming</p>
              <p className="font-alumni font-bold text-gray-900">Ответы в реальном времени</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
              <img src="/logo.png" alt="qaz.med" className="w-5 h-5" />
              <span className="font-alumni font-bold text-lg">qaz.med</span>
            </Link>
            <nav className="flex gap-8">
              <Link to="/about" className="font-alumni text-sm font-medium text-gray-500 hover:text-gray-900">
                Документация
              </Link>
              <a href="#" className="font-alumni text-sm font-medium text-gray-500 hover:text-gray-900">
                Поддержка
              </a>
              <a href="#" className="font-alumni text-sm font-medium text-gray-500 hover:text-gray-900">
                Контакты
              </a>
            </nav>
            <p className="font-alumni text-sm font-medium text-gray-500">
              © 2025 Qaz.med
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
