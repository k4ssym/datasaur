import { Link } from 'react-router-dom'

const navItems = [
  { href: '#services', label: 'Сервисы' },
  { href: '#about', label: 'О платформе' },
]

function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (href.startsWith('#')) {
    e.preventDefault()
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: 'smooth' })
  }
}

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="qaz.med" className="w-6 h-6" />
            <span className="font-alumni font-bold text-xl text-gray-900">qaz.med</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => scrollToSection(e, href)}
                className="font-alumni text-base font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/register" className="font-alumni text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Регистрация
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white font-alumni font-semibold text-sm hover:bg-gray-800 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>
            <Link to="/login">
              <span className="font-alumni text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Войти
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
