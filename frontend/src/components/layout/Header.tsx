import { Link, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
import { HealthIndicator } from '../shared/HealthIndicator'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../stores/authStore'

interface HeaderProps {
  showAuth?: boolean
  showHealth?: boolean
  showLogo?: boolean
  pageTitle?: string
}

const navItems = [
  { to: '/services', label: 'Сервисы' },
  { to: '/about', label: 'О платформе' },
]

export function Header({
  showAuth = true,
  showHealth = false,
  showLogo = true,
  pageTitle,
}: HeaderProps) {
  const location = useLocation()
  const { user } = useAuthStore()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {showLogo ? <Logo /> : <div className="flex-1" />}
          {showLogo && (
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`font-alumni text-sm font-medium transition-colors ${
                    location.pathname === to
                      ? 'text-teal-600 border-b-2 border-teal-500 pb-0.5'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-4">
            {!showLogo && (
              <>
                <div className="relative">
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Поиск..." className="pl-10 pr-4 py-1.5 rounded-lg border border-gray-200 text-sm font-alumni w-48 focus:outline-none focus:border-gray-400" />
                </div>
                <button className="p-2 text-gray-500 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-gray-600 font-alumni text-sm hover:text-gray-900"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-alumni text-xs font-semibold text-gray-600">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span>{user?.name || 'Пользователь'}</span>
                </Link>
              </>
            )}
            {showHealth && <HealthIndicator />}
            {showAuth && (
              <>
                {user ? (
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 font-alumni text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                      {user.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                    {user.name}
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="font-alumni text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Регистрация
                    </Link>
                    <Link to="/login">
                      <Button variant="primary" size="sm">
                        Войти
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {pageTitle && (
          <div className="pb-3">
            <h1 className="font-aldrich text-2xl text-gray-900">{pageTitle}</h1>
          </div>
        )}
      </div>
    </header>
  )
}
