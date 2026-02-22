import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../stores/settingsStore'
import { useHistoryStore } from '../stores/historyStore'
import { useAuthStore } from '../stores/authStore'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

type Theme = 'light' | 'dark' | 'system'

export function Settings() {
  const { theme, setTheme } = useSettingsStore()
  const { clearAll } = useHistoryStore()
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClearHistory = () => {
    clearAll()
    setShowConfirm(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="font-aldrich text-3xl text-gray-900 mb-2">
          Настройки
        </h2>
        <p className="font-alumni text-gray-600">
          Управление темой и данными приложения
        </p>
      </div>

      <Card>
        <CardTitle className="mb-4">Тема</CardTitle>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-4 py-2 rounded-lg font-alumni text-sm transition-colors ${
                theme === t
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t === 'light' ? 'Светлая' : t === 'dark' ? 'Тёмная' : 'Системная'}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">Данные</CardTitle>
        <p className="font-alumni text-gray-600 mb-4">
          Очистить всю историю диагностик. Это действие нельзя отменить.
        </p>
        <Button variant="outline" size="md" onClick={() => setShowConfirm(true)}>
          Очистить историю
        </Button>
      </Card>

      <Card>
        <CardTitle className="mb-4">О приложении</CardTitle>
        <p className="font-alumni text-gray-600">
          AI-assisted Diagnosis v1.0 — платформа для диагностики на основе клинических протоколов Казахстана.
        </p>
      </Card>

      <Card>
        <CardTitle className="mb-4">Выход</CardTitle>
        <p className="font-alumni text-gray-600 mb-4">
          Завершить текущий сеанс и выйти из аккаунта.
        </p>
        <Button variant="outline" size="md" onClick={handleLogout}>
          Выйти из аккаунта
        </Button>
      </Card>

      <Dialog open={showConfirm} onClose={() => setShowConfirm(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <DialogTitle className="font-aldrich text-lg font-bold text-gray-900">
              Подтверждение
            </DialogTitle>
            <p className="mt-2 font-alumni text-gray-600">
              Вы уверены, что хотите удалить всю историю?
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowConfirm(false)}>
                Отмена
              </Button>
              <Button variant="primary" onClick={handleClearHistory}>
                Удалить
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
