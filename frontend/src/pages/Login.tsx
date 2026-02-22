import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { login as apiLogin } from '../services/api'
import { Button } from '../components/ui/Button'
import { NeuroOrbitAnimation } from '../components/auth/NeuroOrbitAnimation'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiLogin(email, password)
      login(
        { id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role },
        data.access_token
      )
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-8 overflow-hidden">
        <div className="flex-1 flex items-center justify-center min-h-0">
          <NeuroOrbitAnimation />
        </div>
        <p className="font-alumni text-white text-sm max-w-xs leading-relaxed">
          Платформа нового поколения для нейродиагностики с использованием искусственного интеллекта
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center p-8 lg:p-16 bg-white">
        <div className="max-w-md mx-auto w-full">
          <div className="flex items-center gap-2 mb-12">
            <img src="/logo.png" alt="qaz.med" className="w-6 h-6" />
            <span className="font-aldrich text-gray-900 text-lg">qaz.med</span>
          </div>

          <h1 className="font-aldrich text-2xl text-gray-900 mb-2">Вход</h1>
          <p className="font-alumni text-gray-600 mb-8">
            Войдите в свой аккаунт для доступа к платформе
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-alumni text-sm text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-0 py-2 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none font-alumni text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block font-alumni text-sm text-gray-500 mb-1">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  className="w-full px-0 py-2 pr-10 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none font-alumni text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            {error && (
              <p className="font-alumni text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full rounded-xl" disabled={loading}>
              {loading ? 'Вход...' : 'Войти →'}
            </Button>
          </form>

          <p className="mt-6 font-alumni text-sm text-gray-500">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-gray-900 font-medium hover:underline">
              Создать аккаунт
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
