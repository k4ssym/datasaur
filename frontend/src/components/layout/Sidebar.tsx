import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { to: '/dashboard', label: 'Главная', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z M16 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z M16 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { to: '/mri', label: 'MRI Классификация', icon: 'M8 7h8m-8 4h8m-8 4h4m12-4v4m0 0v4m0-4h4m0-4h-4m4 0v4' },
  { to: '/mri-segmentation', label: 'MRI Сегментация', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { to: '/ml-analysis', label: 'ML Анализ', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { to: '/iot', label: 'IoT Мониторинг', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/anamnesis', label: 'Анамнез жизни', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/cv-analysis', label: 'CV Анализ', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { to: '/genetic', label: 'Генетический анализ', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { to: '/alphafold', label: 'AlphaFold Server', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { to: '/blood', label: 'Анализ крови', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', expandable: true },
  { to: '/history', label: 'История', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/profile', label: 'Профиль', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { to: '/settings', label: 'Настройки', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
]

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [bloodExpanded, setBloodExpanded] = useState(location.pathname.startsWith('/blood'))

  return (
    <>
      {/* Collapse (hide) button — fixed on the right edge of sidebar when open, so it's never clipped */}
      {open && (
        <button
          type="button"
          onClick={onToggle}
          className="fixed left-[14.75rem] top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-700 shadow-lg transition-all hover:bg-gray-800 hover:text-white hover:border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          aria-label="Скрыть меню"
        >
          <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Fixed sidebar panel with slide animation */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen w-64 flex flex-col overflow-x-hidden
          bg-white border-r border-gray-200 shadow-xl
          transition-[transform,opacity] duration-300 ease-out
          will-change-transform
          ${open ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}
        `}
        aria-hidden={!open}
      >
        <div className="p-4 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="qaz.med" className="w-6 h-6" />
            <span className="font-aldrich text-xl text-gray-800">qaz.med</span>
          </Link>
          {user ? (
            <div className="mt-4 space-y-1">
              <p className="font-alumni font-semibold text-sm text-gray-900">{user.name}</p>
              <p className="font-alumni text-xs text-gray-500">{user.email}</p>
              <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded font-alumni">
                {user.role}
              </span>
            </div>
          ) : (
            <Link to="/login" className="mt-4 block font-alumni text-sm text-gray-500 hover:text-gray-900">
              Войти
            </Link>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map(({ to, label, icon, expandable }) => {
            const isActive = location.pathname === to || (to === '/blood' && location.pathname.startsWith('/blood'))

            if (expandable) {
              return (
                <div key={label} className="relative mx-2">
                  <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-r-lg font-alumni text-sm transition-colors ${isActive ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Link to="/blood" className="flex items-center gap-3 flex-1 min-w-0">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                      </svg>
                      {label}
                    </Link>
                    <button type="button" onClick={() => setBloodExpanded(!bloodExpanded)} className="p-1 -m-1">
                      <svg className={`w-4 h-4 transition-transform ${bloodExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-black rounded-r" />
                  )}
                  {bloodExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      <Link to="/blood" className={`block px-4 py-2 rounded-r-lg font-alumni text-sm ${location.pathname === '/blood' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                        Общий анализ
                      </Link>
                      <Link to="/blood/biochemistry" className={`block px-4 py-2 rounded-r-lg font-alumni text-sm ${location.pathname === '/blood/biochemistry' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                        Биохимия
                      </Link>
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={label}
                to={to}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-r-lg font-alumni text-sm transition-colors relative ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-black rounded-r" />
                )}
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          {user ? (
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-r-lg font-alumni text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Выйти
            </button>
          ) : null}
        </div>
      </aside>

      {/* Show sidebar button when closed — tab on the left edge */}
      <button
        type="button"
        onClick={onToggle}
        className={`
          fixed left-0 top-1/2 z-30 flex h-14 w-11 -translate-y-1/2 items-center justify-center
          rounded-r-xl bg-gray-800 text-white shadow-lg transition-all duration-300 ease-out
          hover:bg-black hover:w-12 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
          ${open ? 'pointer-events-none opacity-0' : 'opacity-100'}
        `}
        aria-label="Открыть меню"
        style={{ boxShadow: open ? 'none' : '4px 0 14px rgba(0,0,0,0.2)' }}
      >
        <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </>
  )
}
