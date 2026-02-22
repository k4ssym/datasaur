import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { PageTemplate } from '../components/shared/PageTemplate'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function Profile() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <PageTemplate
      title="Профиль"
      subtitle="Управление данными профиля и настройками аккаунта."
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Личные данные</h3>
          <div className="space-y-4">
            <div>
              <label className="block font-alumni text-sm text-gray-500 mb-1">Имя</label>
              <input
                type="text"
                defaultValue={user?.name || ''}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg font-alumni"
              />
            </div>
            <div>
              <label className="block font-alumni text-sm text-gray-500 mb-1">Email</label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg font-alumni"
              />
            </div>
            <div>
              <label className="block font-alumni text-sm text-gray-500 mb-1">Роль</label>
              <input
                type="text"
                defaultValue={user?.role || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg font-alumni bg-gray-50"
              />
            </div>
          </div>
          <Button variant="primary" size="md" className="mt-4">Сохранить</Button>
        </Card>
        <Card>
          <h3 className="font-aldrich text-lg font-bold text-gray-900 mb-4">Аватар</h3>
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <span className="font-aldrich text-2xl text-gray-500">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <Button variant="outline" size="sm">Изменить фото</Button>
          <Button variant="outline" size="md" className="mt-4 w-full" onClick={handleLogout}>
            Выйти из аккаунта
          </Button>
        </Card>
      </div>
    </PageTemplate>
  )
}
