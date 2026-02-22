import { useEffect } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.toggle('dark', mq.matches)
      mq.addEventListener('change', (e) => root.classList.toggle('dark', e.matches))
      return () => mq.removeEventListener('change', () => {})
    }
  }, [theme])

  return <>{children}</>
}
