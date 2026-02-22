import { LandingHeader } from '../components/landing/LandingHeader'

export function About() {
  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden />
      <LandingHeader />

      <section className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <h1 className="font-aldrich text-4xl font-bold text-gray-900 mb-6">
          О платформе
        </h1>
        <p className="font-alumni text-lg text-gray-600 leading-relaxed mb-6">
          AI-assisted Diagnosis — платформа для диагностики на основе клинических протоколов Казахстана.
          Введите анамнез пациента в свободной форме и получите доказательные гипотезы за секунды.
        </p>
        <p className="font-alumni text-gray-600 leading-relaxed">
          Проект разработан в рамках хакатона. Все данные обрабатываются с использованием AI.
        </p>
      </section>
    </div>
  )
}
